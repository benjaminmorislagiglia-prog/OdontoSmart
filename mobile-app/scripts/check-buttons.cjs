/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const filename = path.join(__dirname, '../src/components/AppButton.js');
const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  fileName: 'AppButton.jsx',
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

// Verifica eventos, bloqueo y reducción de movimiento sin simular una pantalla nativa.
function render(props = {}, reduceMotion = false) {
  const effects = [];
  const timings = [];
  const value = { value: 1, stopped: 0, setValue(next) { this.value = next; }, stopAnimation() { this.stopped++; } };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', source)(name => {
    if (name === 'react') return { useEffect: fn => effects.push(fn) };
    if (name === 'react-native') return {
      ActivityIndicator: 'ActivityIndicator', Pressable: 'Pressable', Text: 'Text', useAnimatedValue: () => value,
      Animated: { View: 'AnimatedView', timing: (node, options) => {
        timings.push(options);
        return { start: () => node.setValue(options.toValue) };
      } },
    };
    if (name === '../context/ThemeContext') return { useTheme: () => ({ colors: {}, reduceMotion }) };
    return require(name);
  }, module, module.exports);
  const element = module.exports.default({ title: 'Guardar', onPress: () => {}, ...props });
  const cleanups = effects.map(effect => effect()).filter(Boolean);
  return { button: element.props.children.props, value, timings, cleanup: () => cleanups.forEach(fn => fn()) };
}

let presses = 0;
const normal = render({ onPress: () => presses++ });
normal.button.onPressIn();
assert.equal(normal.value.value, 0.96);
normal.button.onPressOut();
assert.equal(normal.value.value, 1);
normal.button.onPress();
assert.equal(presses, 1);
assert.ok(normal.timings.every(options => options.useNativeDriver && options.duration <= 150));
assert.equal(normal.button.accessibilityRole, 'button');
normal.button.onPressIn();
normal.button.onPressOut();
assert.equal(normal.value.value, 1);
normal.cleanup();
assert.ok(normal.value.stopped > 0);

for (const props of [{ disabled: true }, { loading: true }]) {
  const blocked = render(props);
  assert.equal(blocked.button.disabled, true);
  assert.equal(blocked.button.accessibilityState.disabled, true);
  blocked.button.onPressIn();
  blocked.button.onPressOut();
  assert.equal(blocked.value.value, 1);
  assert.equal(blocked.timings.length, 0);
  blocked.cleanup();
}
const reduced = render({}, true);
reduced.button.onPressIn();
reduced.button.onPressOut();
assert.equal(reduced.value.value, 1);
assert.equal(reduced.timings.length, 0);
reduced.cleanup();
console.log('OK: botones, presión/liberación, bloqueo al guardar, accesibilidad y reducción de movimiento (eventos controlados).');
