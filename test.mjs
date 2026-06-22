import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';

// --- minimal DOM/browser stubs ---
const makeEl = () => ({
  innerHTML: '', textContent: '', value: '', checked: false, disabled: false,
  scrollTop: 0, dataset: {}, style: {},
  classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
  querySelectorAll() { return []; },
  set onclick(_) {}, set onchange(_) {},
});
const elements = {};
const getEl = (id) => (elements[id] ||= makeEl());

const sandbox = {
  console,
  document: {
    getElementById: getEl,
    querySelectorAll: () => [],
    addEventListener: () => {},
    documentElement: {},
    body: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } },
  },
  getComputedStyle: () => ({ getPropertyValue: () => '#888888' }),
  setInterval: () => 0,
  clearInterval: () => {},
};
sandbox.window = sandbox;      // in browsers window === globalThis, so window.App becomes global App
sandbox.globalThis = sandbox;

const courseFiles = readdirSync('js/courses')
  .filter((f) => f.endsWith('.js'))
  .sort()
  .map((f) => `js/courses/${f}`);
const files = [
  'js/core/registry.js',
  'js/core/helpers.js',
  ...courseFiles,
  'js/core/engine.js',
];
let bundle = files.map((f) => readFileSync(f, 'utf8')).join('\n;\n');

// test epilogue runs inside the same shared scope
bundle += `
;(function(){
  const App = window.App;
  let total = 0, fails = 0;
  for (const course of App.getCourses()) {
    for (let i = 0; i < course.beats.length; i++) {
      const b = course.beats[i];
      total++;
      const fn = (course.scenes || {})[b.scene];
      if (typeof fn !== 'function') { fails++; console.log('MISSING scene "' + b.scene + '" in course ' + course.key + ' beat ' + i); continue; }
      try {
        const html = fn(b.sub);
        if (typeof html !== 'string' || html.length < 5) { fails++; console.log('EMPTY render: ' + course.key + '/' + b.scene + ' beat ' + i); }
      } catch (e) {
        fails++;
        console.log('THREW: ' + course.key + '/' + b.scene + ' beat ' + i + ' -> ' + e.message);
      }
    }
  }
  console.log('Courses: ' + App.getCourses().map(c=>c.key+'('+c.beats.length+')').join(', '));
  console.log('Rendered ' + total + ' beats, ' + fails + ' failures.');
  globalThis.__RESULT__ = { total, fails };
})();
`;

vm.createContext(sandbox);
vm.runInContext(bundle, sandbox, { filename: 'bundle.js' });
const r = sandbox.__RESULT__;
process.exit(r && r.fails === 0 ? 0 : 1);
