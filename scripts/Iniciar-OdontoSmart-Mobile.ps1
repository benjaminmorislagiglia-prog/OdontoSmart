$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$mobileRoot = Join-Path $projectRoot 'mobile-app'
$backendRoot = Join-Path $projectRoot 'OdontoSmartAPI'
$envFile = Join-Path $mobileRoot '.env.local'
$launcher = Join-Path $projectRoot 'Iniciar-OdontoSmart-Mobile.cmd'
$startupLock = [System.Threading.Mutex]::new($false, 'Local\OdontoSmart-Mobile-Startup')
$lockTaken = $false

function Get-LanAddress {
    $adapters = @(Get-NetAdapter -Physical | Where-Object Status -eq 'Up')
    $routes = @(Get-NetRoute -AddressFamily IPv4 -DestinationPrefix '0.0.0.0/0' |
        Where-Object { $_.InterfaceIndex -in $adapters.InterfaceIndex })
    $candidates = foreach ($route in $routes) {
        $network = Get-NetIPInterface -AddressFamily IPv4 -InterfaceIndex $route.InterfaceIndex
        foreach ($address in (Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $route.InterfaceIndex)) {
            if ($address.AddressState -eq 'Preferred' -and -not $address.SkipAsSource -and
                $address.IPAddress -notmatch '^(127\.|169\.254\.|0\.)') {
                [pscustomobject]@{
                    IP = $address.IPAddress
                    Adapter = $network.InterfaceAlias
                    Metric = $route.RouteMetric + $network.InterfaceMetric
                    Index = $route.InterfaceIndex
                }
            }
        }
    }
    $selected = $candidates | Sort-Object Metric, Index, IP | Select-Object -First 1
    if (-not $selected) {
        throw 'No se encontro una IPv4 LAN en un adaptador fisico activo con puerta de enlace. Conecte la PC por Wi-Fi o Ethernet.'
    }
    return $selected
}

function Get-PortListeners([int] $Port) {
    # Un listener tiene puerto remoto cero; no depende de la traduccion del enum State de CIM.
    $listeners = @(Get-NetTCPConnection | Where-Object {
        $_.LocalPort -eq $Port -and $_.RemotePort -eq 0
    })
    if ($listeners.Count -eq 0) {
        foreach ($hostAddress in @('127.0.0.1', $lan.IP)) {
            $client = [Net.Sockets.TcpClient]::new()
            try {
                if ($client.ConnectAsync($hostAddress, $Port).Wait(500) -and $client.Connected) {
                    throw "El puerto $Port responde, pero Windows no informo su proceso. No se iniciara otra instancia. Revise el puerto con netstat -ano antes de reintentar."
                }
            } catch [System.AggregateException] {
                # Una conexion rechazada indica que no hay servicio en esta direccion.
            } finally {
                $client.Dispose()
            }
        }
    }
    return $listeners
}

function Get-PortDescription($Listeners) {
    return (($Listeners.OwningProcess | Sort-Object -Unique | ForEach-Object {
        $process = Get-CimInstance Win32_Process -Filter "ProcessId = $_"
        'PID {0} ({1})' -f $_, $process.Name
    }) -join ', ')
}

function Wait-Http([string] $Url, [int] $Seconds = 60) {
    $deadline = [DateTime]::UtcNow.AddSeconds($Seconds)
    do {
        try {
            return Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
        } catch {
            Start-Sleep -Milliseconds 500
        }
    } while ([DateTime]::UtcNow -lt $deadline)
    throw "No respondio $Url. Revise los errores en la ventana correspondiente. Las ventanas quedan abiertas."
}

function Start-ServiceWindow([string] $Service) {
    # CMD /k conserva la consola incluso cuando el comando termina con un error.
    Start-Process -FilePath $env:ComSpec -WorkingDirectory $projectRoot -WindowStyle Normal `
        -ArgumentList ('/d /k ""{0}" --{1}"' -f $launcher, $Service)
}

try {
    $lockTaken = $startupLock.WaitOne(0)
    if (-not $lockTaken) {
        throw 'Ya hay un inicio de OdontoSmart Mobile en curso. Espere a que termine.'
    }
    foreach ($command in @('dotnet', 'npx.cmd')) {
        if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
            throw "No se encontro $command. Instale .NET SDK y Node.js, y vuelva a abrir la terminal."
        }
    }
    if (-not (Test-Path (Join-Path $mobileRoot 'node_modules/expo/package.json'))) {
        throw 'Faltan las dependencias de mobile-app. Ejecute npm install dentro de mobile-app y vuelva a iniciar.'
    }

    $lan = Get-LanAddress
    $apiUrl = 'http://{0}:5122' -f $lan.IP
    Write-Host ('Red: {0} - IPv4: {1}' -f $lan.Adapter, $lan.IP)

    $apiListeners = @(Get-PortListeners 5122)
    if ($apiListeners.Count -gt 0) {
        $description = Get-PortDescription $apiListeners
        Write-Host "Puerto 5122 ocupado por $description."
        $owners = @($apiListeners.OwningProcess | Sort-Object -Unique)
        $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($owners[0])"
        $binRoot = (Join-Path $backendRoot 'bin') + [IO.Path]::DirectorySeparatorChar
        $isProjectApi = $process.ExecutablePath -and
            $process.ExecutablePath.StartsWith($binRoot, [StringComparison]::OrdinalIgnoreCase) -and
            $process.Name -eq 'OdontoSmartAPI.exe'
        if ($owners.Count -ne 1 -or -not $isProjectApi) {
            throw "No se iniciara otra API: 5122 esta ocupado por $description. Cierre ese proceso solo si corresponde y vuelva a ejecutar el lanzador."
        }
        if (-not ($apiListeners | Where-Object { $_.LocalAddress -in @('0.0.0.0', '::', $lan.IP) })) {
            throw 'La API existente solo escucha en otra direccion. Detengala desde su consola o Visual Studio y vuelva a ejecutar el lanzador para habilitar la LAN.'
        }
        Write-Host 'Se reutilizara la API del proyecto; no se abrira otra instancia.'
    }

    $oldEnv = if (Test-Path -LiteralPath $envFile) { [IO.File]::ReadAllText($envFile) } else { '' }
    $envPattern = '(?m)^[ \t]*(?:export[ \t]+)?EXPO_PUBLIC_API_URL[ \t]*=[^\r\n]*'
    $envLine = 'EXPO_PUBLIC_API_URL=' + $apiUrl
    $newEnv = if ($oldEnv -match $envPattern) {
        [regex]::Replace($oldEnv, $envPattern, $envLine)
    } else {
        $separator = if ($oldEnv.Length -gt 0 -and -not $oldEnv.EndsWith("`n")) { "`r`n" } else { '' }
        $oldEnv + $separator + $envLine + "`r`n"
    }

    $expoListeners = @(Get-PortListeners 8081)
    if ($expoListeners.Count -gt 0) {
        $description = Get-PortDescription $expoListeners
        Write-Host "Puerto 8081 ocupado por $description."
        try {
            $status = Invoke-WebRequest 'http://127.0.0.1:8081/status' -UseBasicParsing -TimeoutSec 3
            $statusText = if ($status.Content -is [string]) { $status.Content } else { [Text.Encoding]::UTF8.GetString($status.Content) }
            $expoRoot = [Uri]::UnescapeDataString([string]$status.Headers['X-React-Native-Project-Root'])
            $manifest = Invoke-RestMethod "http://$($lan.IP):8081/" -Headers @{ 'expo-platform' = 'android'; Accept = 'application/json' } -TimeoutSec 10
            $sameProject = $statusText -eq 'packager-status:running' -and
                $expoRoot.TrimEnd('\', '/') -eq $mobileRoot.TrimEnd('\', '/')
            $sameAddress = $manifest.extra.expoClient.hostUri -eq "$($lan.IP):8081"
        } catch {
            $sameProject = $false
            $sameAddress = $false
        }
        if (-not $sameProject -or -not $sameAddress -or $oldEnv -cne $newEnv) {
            throw "8081 esta ocupado por $description. Cierre la consola anterior de Expo (o revise ese proceso) y vuelva a iniciar para usar la IP actual. No se cerrara ningun proceso automaticamente."
        }
        Write-Host 'Se reutilizara Expo del proyecto; el QR sigue en su consola.'
    }

    if ($oldEnv -cne $newEnv) {
        [IO.File]::WriteAllText($envFile, $newEnv, [Text.UTF8Encoding]::new($false))
    }
    # Las variables heredadas no deben prevalecer sobre la IP recien detectada.
    $env:EXPO_PUBLIC_API_URL = $apiUrl
    $env:REACT_NATIVE_PACKAGER_HOSTNAME = $lan.IP
    Write-Host "mobile-app\.env.local: $envLine"

    if ($apiListeners.Count -eq 0) {
        Start-ServiceWindow 'api'
    }
    $null = Wait-Http "$apiUrl/swagger/v1/swagger.json"
    Write-Host "API disponible desde la IP LAN: $apiUrl"

    if ($expoListeners.Count -eq 0) {
        Start-ServiceWindow 'expo'
    }
    $null = Wait-Http "http://$($lan.IP):8081/status"
    Write-Host "Expo disponible: exp://$($lan.IP):8081"
    Write-Host "Escanee el QR de la ventana Expo. Para comprobar la API desde el telefono, abra $apiUrl/swagger."
    Write-Host 'Para detener los servicios use Ctrl+C en cada ventana. Ambas quedan abiertas para ver logs.'
} catch {
    Write-Host ("ERROR: " + $_.Exception.Message) -ForegroundColor Red
    exit 1
} finally {
    if ($lockTaken) { $startupLock.ReleaseMutex() }
    $startupLock.Dispose()
}
