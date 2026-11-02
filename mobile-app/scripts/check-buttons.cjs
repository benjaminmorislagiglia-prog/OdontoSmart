/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(relative, mocks) {
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', relative), 'utf8'), {
    fileName: relative.replace(/\.js$/, '.jsx'),
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', source)(name => mocks[name] || require(name), module, module.exports);
  return module.exports;
}

function animatedValue(initial) {
  return {
    value: initial, stopped: 0,
    setValue(next) { this.value = next; },
    stopAnimation() { this.stopped++; },
    interpolate({ outputRange }) { return { read: () => outputRange[0] + this.value * (outputRange[1] - outputRange[0]) }; },
  };
}
const read = value => value?.read ? value.read() : value;
const flatten = style => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

// Verifica eventos, bloqueo y reducción de movimiento sin simular una pantalla nativa.
function render(props = {}, reduceMotion = false) {
  const effects = [];
  const timings = [];
  const value = animatedValue(0);
  const mocks = {
    react: { useEffect: fn => effects.push(fn) },
    'react-native': {
      ActivityIndicator: 'ActivityIndicator', Pressable: 'Pressable', Text: 'Text', useAnimatedValue: () => value,
      Easing: { quad: x => x * x, out: fn => x => 1 - fn(1 - x) },
      Animated: { createAnimatedComponent: () => 'AnimatedPressable', timing: (node, options) => {
        timings.push(options);
        return { start: () => node.setValue(options.toValue) };
      } },
    },
    '../context/ThemeContext': { useTheme: () => ({ colors: {}, reduceMotion }) },
  };
  const AnimatedPressable = load('src/components/AnimatedPressable.js', mocks).default;
  const AppButton = load('src/components/AppButton.js', { ...mocks, './AnimatedPressable': AnimatedPressable }).default;
  const element = AppButton({ title: 'Guardar', onPress: () => {}, ...props });
  assert.equal(element.type, AnimatedPressable);
  const native = AnimatedPressable(element.props);
  const cleanups = effects.map(effect => effect()).filter(Boolean);
  return { button: native.props, value, timings, AnimatedPressable, cleanup: () => cleanups.forEach(fn => fn()) };
}

let presses = 0;
const normal = render({ onPress: () => presses++ });
const visual = flatten(normal.button.style);
const scale = visual.transform[0].scale;
const translateY = visual.transform[1].translateY;
assert.equal(read(scale), 1);
normal.button.onPressIn();
assert.equal(read(scale), 0.92);
assert.equal(read(visual.opacity), 0.85);
assert.equal(read(translateY), 2);
normal.button.onPressOut();
assert.equal(read(scale), 1);
assert.equal(read(visual.opacity), 1);
assert.equal(read(translateY), 0);
normal.button.onPress();
assert.equal(presses, 1);
assert.ok(normal.timings.every(options => options.useNativeDriver && options.duration >= 80 && options.duration <= 120));
assert.equal(normal.button.accessibilityRole, 'button');
for (let count = 0; count < 10; count++) {
  normal.button.onPressIn();
  normal.button.onPressOut();
}
assert.equal(read(scale), 1);
assert.equal(presses, 1, 'Liberar/cancelar una pulsacion no debe ejecutar la accion');
normal.cleanup();
assert.ok(normal.value.stopped > 0);

for (const props of [{ disabled: true }, { loading: true }]) {
  const blocked = render(props);
  assert.equal(blocked.button.disabled, true);
  assert.equal(blocked.button.accessibilityState.disabled, true);
  blocked.button.onPressIn();
  blocked.button.onPressOut();
  assert.equal(blocked.value.value, 0);
  assert.equal(flatten(blocked.button.style).opacity, 0.65);
  assert.equal(blocked.timings.length, 0);
  blocked.cleanup();
}
const reduced = render({}, true);
reduced.button.onPressIn();
const reducedStyle = flatten(reduced.button.style);
assert.equal(read(reducedStyle.transform[0].scale), 1);
assert.equal(read(reducedStyle.transform[1].translateY), 0);
assert.equal(read(reducedStyle.opacity), 0.85, 'Con movimiento reducido queda feedback de opacidad instantaneo');
reduced.button.onPressOut();
assert.equal(read(reducedStyle.opacity), 1);
assert.equal(reduced.timings.length, 0);
reduced.cleanup();

let inEvent, outEvent;
const custom = normal.AnimatedPressable({
  onPressIn: event => { inEvent = event; }, onPressOut: event => { outEvent = event; },
  onPress: () => presses++, accessibilityLabel: 'Paciente',
});
const event = { nativeEvent: {} };
custom.props.onPressIn(event);
custom.props.onPressOut(event);
assert.equal(inEvent, event);
assert.equal(outEvent, event);
assert.equal(custom.props.accessibilityLabel, 'Paciente');
custom.props.onPress();
assert.equal(presses, 2);

function theme() {
  const states = [], effects = [];
  let cursor = 0, removed = false, listener, resolve, reject;
  const pending = new Promise((ok, fail) => { resolve = ok; reject = fail; });
  const provider = load('src/context/ThemeContext.js', {
    react: {
      createContext: () => ({ Provider: 'Provider' }),
      useEffect: fn => effects.push(fn), useMemo: fn => fn(),
      useState: initial => {
        const index = cursor++;
        if (!(index in states)) states[index] = initial;
        return [states[index], value => { states[index] = value; }];
      },
    },
    'react-native': { AccessibilityInfo: {
      isReduceMotionEnabled: () => pending,
      addEventListener: (name, callback) => {
        assert.equal(name, 'reduceMotionChanged');
        listener = callback;
        return { remove: () => { removed = true; } };
      },
    } },
    '@react-native-async-storage/async-storage': { getItem: async () => null },
    '../styles/theme': { colors: {}, darkColors: {}, createThemeStyles: () => ({}) },
  }).ThemeProvider;
  const current = () => { cursor = 0; return provider({ children: null }).props.value.reduceMotion; };
  assert.equal(current(), true, 'Mientras se consulta la preferencia se evita movimiento');
  const cleanups = effects.map(fn => fn()).filter(Boolean);
  return { current, resolve, reject, change: value => listener(value), removed: () => removed, cleanup: () => cleanups.forEach(fn => fn()) };
}

async function checkAccessibility() {
  for (const actual of [false, true]) {
    const state = theme();
    state.resolve(actual);
    await new Promise(setImmediate);
    assert.equal(state.current(), actual, 'Debe respetar el valor nativo, sin forzarlo a true');
    state.change(!actual);
    assert.equal(state.current(), !actual);
    state.cleanup();
    assert.equal(state.removed(), true);
  }
  const failure = theme();
  failure.reject(new Error('Consulta nativa fallida'));
  await new Promise(setImmediate);
  assert.equal(failure.current(), false, 'Un error no debe dejar las animaciones bloqueadas para siempre');
  failure.cleanup();

  const race = theme();
  race.change(true);
  race.resolve(false);
  await new Promise(setImmediate);
  assert.equal(race.current(), true, 'Una respuesta inicial antigua no debe pisar un cambio reciente');
  race.cleanup();
  race.change(false);
  assert.equal(race.current(), true, 'No actualiza despues de desmontar');

  const failedRace = theme();
  failedRace.change(true);
  failedRace.reject(new Error('Consulta nativa fallida'));
  await new Promise(setImmediate);
  assert.equal(failedRace.current(), true, 'El fallback no debe ignorar una preferencia real recibida por evento');
  failedRace.cleanup();
}

checkAccessibility().then(() => {
  console.log('OK: eventos de pulsación, scale/opacidad/desplazamiento, bloqueo, accesibilidad, fallos nativos y cambios de preferencia (entorno controlado).');
}).catch(error => { console.error(error); process.exitCode = 1; });
