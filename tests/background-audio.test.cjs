const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const tick = () => new Promise(setImmediate);

function loadSource(file, globals = {}, imports = {}) {
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  vm.runInNewContext(source, {
    module, exports: module.exports,
    require: (id) => imports[id] ?? require(id),
    DOMException, ...globals,
  }, { filename: file });
  return module.exports;
}

function audioHarness({ blocked = false } = {}) {
  const { usePortfolioStore } = loadSource("src/store/usePortfolioStore.ts", {}, {
    "@/data/spotify": { defaultSpotifyTrackId: "first-track" },
    "@/utils/phone": { derivePhoneScreen: () => ({ app: "home" }) },
  });
  const document = Object.assign(new EventTarget(), { hidden: false });
  const window = new EventTarget();
  const audio = {
    paused: true, attempts: 0, volume: 0,
    async play() {
      this.attempts++;
      if (blocked) throw new DOMException("Gesture required", "NotAllowedError");
      this.paused = false;
    },
    pause() { this.paused = true; },
  };
  let effects = [], cleanups = [];
  const { BackgroundAudioPlayer } = loadSource("src/components/BackgroundAudioPlayer.tsx", {
    document, window,
  }, {
    react: {
      useRef: (current) => ({ current }),
      useEffect: (effect) => effects.push(effect),
    },
    "react/jsx-runtime": {
      jsx: (_, props) => { props.ref.current = audio; return null; },
    },
    "@/data/spotify": { getSpotifyTrackById: () => ({ audioSrc: "/test.mp3" }) },
    "@/store/usePortfolioStore": { usePortfolioStore: (selector) => selector(usePortfolioStore.getState()) },
  });
  function render(patch = {}) {
    for (const cleanup of cleanups) cleanup?.();
    effects = [];
    usePortfolioStore.setState(patch);
    BackgroundAudioPlayer();
    cleanups = effects.map((effect) => effect());
  }
  return {
    audio, document, window, render,
    get state() { return usePortfolioStore.getState(); },
    allowPlayback() { blocked = false; },
    cleanup() { for (const cleanup of cleanups) cleanup?.(); },
  };
}

test("opening the portfolio attempts music playback at the configured quiet volume", async () => {
  const h = audioHarness();
  h.render();
  await tick();
  assert.equal(h.state.isSpotifyPaused, false);
  assert.equal(h.audio.attempts, 1);
  assert.equal(h.audio.paused, false);
  assert.ok(Math.abs(h.audio.volume - 0.08) < 0.000001);
  h.cleanup();
});

test("a mobile tap retries blocked autoplay, and manual pause prevents later retries", async () => {
  const h = audioHarness({ blocked: true });
  h.render();
  await tick();
  assert.equal(h.audio.paused, true);
  h.allowPlayback();
  h.window.dispatchEvent(new Event("pointerup"));
  await tick();
  assert.equal(h.audio.attempts, 2);
  assert.equal(h.audio.paused, false);

  h.render({ isSpotifyPaused: true });
  h.window.dispatchEvent(new Event("pointerup"));
  await tick();
  assert.equal(h.audio.attempts, 2);
  assert.equal(h.audio.paused, true);
  h.cleanup();
});

test("backgrounding pauses music and returning resumes only when music is enabled", async () => {
  const h = audioHarness();
  h.render();
  await tick();
  h.document.hidden = true;
  h.document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(h.audio.paused, true);
  h.document.hidden = false;
  h.document.dispatchEvent(new Event("visibilitychange"));
  await tick();
  assert.equal(h.audio.paused, false);

  h.render({ isSpotifyPaused: true });
  h.document.dispatchEvent(new Event("visibilitychange"));
  await tick();
  assert.equal(h.audio.paused, true);
  h.cleanup();
});

test("voice interactions and phone calls pause music without losing the music preference", async () => {
  const h = audioHarness();
  h.render({ interactionPhase: "speaking" });
  await tick();
  assert.equal(h.audio.attempts, 0);
  h.render({ interactionPhase: "idle", phoneScreen: { app: "phone" } });
  await tick();
  assert.equal(h.audio.attempts, 0);
  h.render({ phoneScreen: { app: "home" } });
  await tick();
  assert.equal(h.audio.paused, false);
  assert.equal(h.state.isSpotifyPaused, false);
  h.cleanup();
});
