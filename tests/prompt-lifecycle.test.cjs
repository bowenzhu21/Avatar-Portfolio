const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const flush = () => new Promise(resolve => setImmediate(resolve));

function createHarness() {
  const modules = new Map();
  const hooks = [];
  let hookIndex = 0;
  let effects = [];
  const calls = [];
  const navigations = [];
  const audioCalls = { interrupt: 0, unlock: 0, speak: 0 };
  const router = { push: route => navigations.push(route) };
  const audio = {
    isSpeaking: false,
    interrupt: async () => { audioCalls.interrupt += 1; },
    unlockAudio: async () => { audioCalls.unlock += 1; },
    speak: async () => { audioCalls.speak += 1; },
  };

  function load(filename) {
    if (!fs.existsSync(filename) && fs.existsSync(filename + '.ts')) filename += '.ts';
    if (modules.has(filename)) return modules.get(filename).exports;
    const module = { exports: {} };
    modules.set(filename, module);
    if (filename.endsWith('.json')) {
      module.exports = JSON.parse(fs.readFileSync(filename, 'utf8'));
      return module.exports;
    }
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    }).outputText;
    function importSource(request) {
      if (request === 'react') return {
        useRef(value) {
          const index = hookIndex++;
          return hooks[index] ?? (hooks[index] = { current: value });
        },
        useEffect(callback, dependencies) {
          const index = hookIndex++;
          const previous = hooks[index];
          if (!previous || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) {
            hooks[index] = { dependencies, cleanup: previous?.cleanup };
            effects.push(() => {
              hooks[index].cleanup?.();
              hooks[index].cleanup = callback();
            });
          }
        },
      };
      if (request === 'zustand') return { create: initialize => {
        let state;
        const store = selector => selector(state);
        store.getState = () => state;
        store.setState = update => { state = { ...state, ...(typeof update === 'function' ? update(state) : update) }; };
        state = initialize(store.setState, store.getState);
        return store;
      } };
      if (request === 'next/navigation') return { useRouter: () => router };
      if (request === '@/hooks/useAvatarSpeech') return { useAvatarSpeech: () => audio };
      if (request === '@/hooks/useRealtimeSTT') return { stopRealtimeSTTListening: async () => {} };
      if (request === '@/lib/orchestrator') return {
        routeVoiceIntent(payload, signal) {
          // Deliberately allow an aborted request to finish, as a remote service can.
          return new Promise((resolve, reject) => calls.push({ payload, signal, resolve, reject }));
        },
        orchestrateWithGemini: async ({ routerResult }) => ({ spokenResponse: routerResult.spokenResponse }),
      };
      if (request.startsWith('@/')) return load(path.join(root, 'src', request.slice(2)));
      if (request.startsWith('.')) return load(path.resolve(path.dirname(filename), request));
      return require(request);
    }
    new Function('exports', 'require', 'module', source)(module.exports, importSource, module);
    return module.exports;
  }

  const { VoiceRouterProvider } = load(path.join(root, 'src/components/providers/voice-router-provider.tsx'));
  const { usePortfolioStore: store } = load(path.join(root, 'src/store/usePortfolioStore.ts'));
  const { usePromptFeedback: feedback } = load(path.join(root, 'src/hooks/usePromptFeedback.ts'));
  const { cancelPendingPortfolioPrompt: cancel } = load(path.join(root, 'src/lib/prompt-request.ts'));
  const { portfolioEntityMap } = load(path.join(root, 'src/data/portfolio.ts'));
  function render() {
    hookIndex = 0;
    effects = [];
    VoiceRouterProvider();
    effects.forEach(effect => effect());
  }
  function reply(id) {
    const entity = portfolioEntityMap.get(id);
    return { intent: 'navigate_and_answer', entity, route: entity.route, card: 'overview', section: null, spokenResponse: `${entity.title} is ready.`, followUpSuggestions: [], confidence: 1 };
  }
  function destroy() { hooks.forEach(hook => hook.cleanup?.()); }
  render();
  return { store, feedback, calls, navigations, audioCalls, cancel, render, reply, destroy };
}

global.window = { setTimeout, clearTimeout };
global.document = { hidden: false };

test('typed turns navigate through the existing router and remain silent', async () => {
  const h = createHarness();
  try {
    h.store.getState().submitUtterance('Show ModelGate', 'text');
    h.render();
    await flush();
    h.calls[0].resolve(h.reply('modelgate'));
    await flush();
    assert.deepEqual(h.navigations, ['/projects/modelgate']);
    assert.equal(h.store.getState().latestSpokenResponse, 'ModelGate is ready.');
    assert.equal(h.store.getState().pendingUtterance, null);
    assert.equal(h.audioCalls.unlock, 0);
    assert.equal(h.audioCalls.speak, 0);
  } finally { h.destroy(); }
});

test('a superseded turn is aborted and cannot navigate or overwrite the later reply', async () => {
  const h = createHarness();
  try {
    h.store.getState().submitUtterance('Show ModelGate', 'text');
    h.render();
    await flush();
    h.store.getState().submitUtterance('Show FlightDeck', 'text');
    h.render();
    await flush();
    assert.equal(h.calls[0].signal.aborted, true);
    h.calls[1].resolve(h.reply('flightdeck'));
    await flush();
    h.calls[0].resolve(h.reply('modelgate'));
    await flush();
    assert.deepEqual(h.navigations, ['/projects/flightdeck']);
    assert.equal(h.store.getState().latestSpokenResponse, 'FlightDeck is ready.');
    assert.equal(h.feedback.getState().requestError, null);
  } finally { h.destroy(); }
});

test('cancel aborts an in-flight turn and suppresses any late navigation or speech', async () => {
  const h = createHarness();
  try {
    h.store.getState().submitUtterance('Show ModelGate', 'voice');
    h.render();
    await flush();
    h.cancel();
    assert.equal(h.calls[0].signal.aborted, true);
    h.calls[0].resolve(h.reply('modelgate'));
    await flush();
    assert.deepEqual(h.navigations, []);
    assert.equal(h.store.getState().pendingUtterance, null);
    assert.equal(h.store.getState().interactionPhase, 'idle');
    assert.equal(h.audioCalls.speak, 0);
  } finally { h.destroy(); }
});

test('a failed request keeps its prompt available for a quiet retry', async () => {
  const h = createHarness();
  try {
    h.store.getState().submitUtterance('Show Clearinghouse', 'text');
    h.render();
    await flush();
    h.calls[0].reject(new Error('Offline'));
    await flush();
    assert.equal(h.store.getState().pendingUtterance, null);
    assert.equal(h.store.getState().interactionPhase, 'idle');
    assert.equal(h.feedback.getState().failedPrompt, 'Show Clearinghouse');
    assert.equal(h.feedback.getState().inputExpanded, true);
    assert.match(h.feedback.getState().requestError, /try again/);
    assert.equal(h.audioCalls.speak, 0);
  } finally { h.destroy(); }
});
