import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {profileAddress,validateProfilePhoto,maxPhotoBytes} from '../src/utils/profile.js';

const localities=[{idLocalidad:1,nombre:'Córdoba Capital',idProvincia:2}];
const provinces=[{idProvincia:2,nombre:'Córdoba',pais:'Argentina'}];
const direction={calle:'Av. Colón & Unión # / ?',numero:1250,idLocalidad:1};
const complete=profileAddress(direction,localities,provinces);
const url=new URL(complete.mapsUrl);
assert.equal(url.origin,'https://www.google.com');
assert.equal(url.pathname,'/maps/search/');assert.equal(url.searchParams.get('api'),'1');
assert.equal(url.searchParams.get('query'),'Av. Colón & Unión # / ? 1250, Córdoba Capital, Córdoba, Argentina');
assert.equal([...url.searchParams].length,2);
for(const incomplete of [null,{}, {...direction,numero:0},{...direction,calle:''},{...direction,idLocalidad:99}])
 assert.equal(profileAddress(incomplete,localities,provinces).mapsUrl,null);
assert.equal(profileAddress(direction,localities,[]).mapsUrl,null);
assert.equal(profileAddress(direction,[],provinces).mapsUrl,null);
for(const [name,type] of [['foto.JPG','image/jpeg'],['foto.jpeg','image/jpeg'],['foto.png','image/png'],['foto.webp','image/webp']])
 assert.equal(validateProfilePhoto({name,type,size:1024}),'');
assert.ok(validateProfilePhoto({name:'foto.png',type:'image/png',size:maxPhotoBytes+1}));
assert.ok(validateProfilePhoto({name:'foto.png',type:'image/png',size:0}));
assert.ok(validateProfilePhoto({name:'foto.svg',type:'image/svg+xml',size:100}));
assert.ok(validateProfilePhoto({name:'foto.png',type:'text/plain',size:100}));
const server=await createServer({configFile:false,server:{middlewareMode:true},define:{'import.meta.env.VITE_API_URL':JSON.stringify('https://api.invalid')}});
try {
 const {api}=await server.ssrLoadModule('/src/services/api.js');
 const {profilePhotoUrl,uploadProfilePhoto}=await server.ssrLoadModule('/src/services/profileService.js');
 const path='/api/fotos-perfil/'+'a'.repeat(32)+'.webp';
 assert.equal(profilePhotoUrl(path),'https://api.invalid'+path);
 for(const invalid of [null,'https://externo.invalid/foto.webp','/../../appsettings.json','data:image/png;base64,AAAA'])assert.equal(profilePhotoUrl(invalid),null);
 let sent;
 api.defaults.adapter=async config=>{sent=config;return {config,status:200,statusText:'OK',headers:{},data:{fotoUrl:path}};};
 const file=new File(['fixture'],'foto.png',{type:'image/png'});
 assert.equal((await uploadProfilePhoto('Pacientes',1,file)).fotoUrl,path);
 assert.equal(sent.url,'/api/Pacientes/1/foto');assert.equal(sent.method,'put');
 assert.ok(sent.data instanceof FormData);assert.equal(sent.data.get('archivo').name,'foto.png');
 await assert.rejects(()=>uploadProfilePhoto('odontologos',1,file));
 await assert.rejects(()=>uploadProfilePhoto('Pacientes','../1',file));
 console.log('Pruebas de fotos y Maps correctas: dirección codificada, datos incompletos, validación de archivos, URL de API y multipart.');
}finally{await server.close();}
