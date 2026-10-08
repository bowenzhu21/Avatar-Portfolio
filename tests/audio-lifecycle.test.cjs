const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const tick = () => new Promise(setImmediate);
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function loadSource(file, globals = {}, imports = {}) {
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(source, {
    module, exports: module.exports, require: (id) => imports[id] ?? require(id),
    URL, DOMException, AbortController, setTimeout, clearTimeout, performance,
    process: { env: { NODE_ENV: "test" } }, ...globals,
  }, { filename: file });
  return module.exports;
}
function microphoneHarness() {
  const streams = [], sockets = [], contexts = [];
  let requests = 0;
  const permission = deferred();
  class Socket {
    static CONNECTING = 0; static OPEN = 1; static CLOSED = 3;
    readyState = 0;
    constructor() { sockets.push(this); }
    open() { this.readyState = 1; this.onopen?.(); }
    send(data) {
      const message = typeof data === "string" ? JSON.parse(data) : null;
      if (message?.type === "Finalize") this.onmessage?.({ data: JSON.stringify({ type: "Results", is_final: true, from_finalize: true, channel: { alternatives: [{ transcript: "" }] } }) });
    }
    close() { this.readyState = 3; this.onclose?.(); }
  }
  class AudioContext {
    state = "running"; sampleRate = 16000;
    constructor() { contexts.push(this); }
    createMediaStreamSource() { return { connect() {}, disconnect() {} }; }
    createScriptProcessor() { return { connect() {}, disconnect() {}, onaudioprocess: null }; }
    async resume() { this.state = "running"; }
    async close() { this.state = "closed"; }
  }
  const globals = {
    window: { AudioContext }, WebSocket: Socket,
    navigator: { mediaDevices: { getUserMedia() { requests++; return permission.promise; } } },
    fetch: async () => ({ ok: true, json: async () => ({ token: "test-token" }) }),
  };
  const create = () => new (loadSource("src/lib/deepgram.ts", globals).DeepgramRealtimeClient)();
  function grant() {
    const track = { stopped: false, stop() { this.stopped = true; } };
    const stream = { getTracks: () => [track] };
    streams.push(stream);
    permission.resolve(stream);
    return track;
  }
  return { globals, create, grant, streams, sockets, contexts, get requests() { return requests; } };
}

test("cancelling a pending permission request releases late microphone access", async () => {
  const h = microphoneHarness(), client = h.create();
  const starting = client.startListening();
  await client.stopListening();
  const track = h.grant();
  await starting;
  assert.equal(track.stopped, true);
  assert.equal(h.sockets.length, 0);
  assert.equal(client.getState().session.status, "idle");
});

test("repeated microphone starts share one permission request and one connection", async () => {
  const h = microphoneHarness(), client = h.create();
  const first = client.startListening(), second = client.startListening();
  assert.equal(h.requests, 1);
  const track = h.grant();
  await tick();
  assert.equal(h.sockets.length, 1);
  h.sockets[0].open();
  await Promise.all([first, second]);
  assert.equal(client.getState().isListening, true);
  await client.stopListening();
  assert.equal(track.stopped, true);
  assert.equal(h.contexts[0].state, "closed");
});

test("stopping while a voice token loads aborts the request and microphone", async () => {
  const h = microphoneHarness();
  let signal;
  h.globals.fetch = (_, init) => new Promise((resolve, reject) => {
    signal = init.signal;
    signal.addEventListener("abort", () => reject(new DOMException("Cancelled", "AbortError")));
  });
  const client = h.create(), starting = client.startListening();
  const track = h.grant();
  await tick();
  await client.stopListening();
  await starting;
  assert.equal(signal.aborted, true);
  assert.equal(track.stopped, true);
  assert.equal(h.sockets.length, 0);
});

test("stopping a connecting websocket settles startup and closes capture", async () => {
  const h = microphoneHarness(), client = h.create();
  const starting = client.startListening(), track = h.grant();
  await tick();
  assert.equal(h.sockets[0].readyState, 0);
  await client.stopListening();
  await starting;
  assert.equal(h.sockets[0].readyState, 3);
  assert.equal(track.stopped, true);
  assert.equal(client.getState().session.status, "idle");
});

test("an unexpected connection close releases the microphone and audio context", async () => {
  const h = microphoneHarness(), client = h.create();
  const starting = client.startListening(), track = h.grant();
  await tick(); h.sockets[0].open(); await starting;
  h.sockets[0].close(); await tick();
  assert.equal(track.stopped, true);
  assert.equal(h.contexts[0].state, "closed");
  assert.equal(client.getState().isListening, false);
  assert.equal(client.getState().session.status, "error");
});

function speechHarness(fetch) {
  const synthesis = { cancelled: 0, utterances: [], cancel() { this.cancelled++; }, getVoices: () => [], speak(utterance) { this.utterances.push(utterance); utterance.onstart?.(); } };
  const document = { hidden: false };
  const globals = { document, fetch, SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } }, window: { speechSynthesis: synthesis, requestAnimationFrame: () => 1, cancelAnimationFrame() {} } };
  const client = new (loadSource("src/lib/avatar-speech.ts", globals).AvatarSpeechClient)();
  return { client, synthesis, document };
}

test("interrupting speech aborts generation without starting browser fallback", async () => {
  let signal;
  const h = speechHarness((_, init) => new Promise((resolve, reject) => {
    signal = init.signal;
    signal.addEventListener("abort", () => reject(new DOMException("Cancelled", "AbortError")));
  }));
  const speaking = h.client.speak("A short response.");
  await h.client.interrupt(); await speaking;
  assert.equal(signal.aborted, true);
  assert.equal(h.synthesis.utterances.length, 0);
  assert.equal(h.client.getState().status, "idle");
});

test("a new reply cancels browser speech before generating its replacement", async () => {
  const h = speechHarness(async () => ({ ok: false, json: async () => ({ error: "Unavailable" }) }));
  await h.client.speak("First reply.");
  const first = h.synthesis.utterances[0];
  assert.equal(h.client.getState().provider, "browser");
  const cancellations = h.synthesis.cancelled;
  const next = h.client.speak("Second reply.");
  assert.ok(h.synthesis.cancelled > cancellations);
  assert.equal(first.onstart, null);
  assert.equal(first.onend, null);
  await next;
  assert.equal(h.synthesis.utterances.length, 2);
  await h.client.interrupt();
});

test("a response arriving in a hidden tab never requests or plays audio", async () => {
  let requests = 0;
  const h = speechHarness(async () => { requests++; throw new Error("Should not run"); });
  h.document.hidden = true;
  await h.client.speak("This remains available as text.");
  assert.equal(requests, 0);
  assert.equal(h.synthesis.utterances.length, 0);
});

test("multiple STT hook consumers commit each final once and discard cancelled turns", async () => {
  const cleanups = [];
  let client, submissions = 0, starts = 0, stops = 0;
  class SharedClient {
    listeners = new Set();
    state = { session: { status: "idle" }, isListening: false, partialTranscript: "", lastFinalTranscript: "" };
    constructor() { client = this; }
    getState() { return this.state; }
    subscribe(callback) { this.listeners.add(callback); callback(this.state); return () => this.listeners.delete(callback); }
    emit(patch) { this.state = { ...this.state, ...patch }; for (const listener of this.listeners) listener(this.state); }
    clearCommittedTranscript() { this.emit({ lastFinalTranscript: "" }); }
    async startListening() { starts++; }
    async stopListening() { stops++; }
  }
  const store = {
    interactionPhase: "idle", partialTranscript: "",
    setInteractionPhase(value) { this.interactionPhase = value; },
    setPartialTranscript(value) { this.partialTranscript = value; },
    submitUtterance() { submissions++; this.interactionPhase = "thinking"; },
  };
  const { useRealtimeSTT, stopRealtimeSTTListening } = loadSource("src/hooks/useRealtimeSTT.ts", {
    document: { hidden: false, addEventListener() {}, removeEventListener() {} },
    window: { addEventListener() {}, removeEventListener() {} },
  }, {
    react: { useCallback: (fn) => fn, useState: (initial) => [initial(), () => {}], useEffect: (fn) => cleanups.push(fn()) },
    "@/lib/deepgram": { DeepgramRealtimeClient: SharedClient },
    "@/lib/avatar-speech": { sharedAvatarSpeechClient: { interrupt: async () => {} } },
    "@/store/usePortfolioStore": { usePortfolioStore: { getState: () => store } },
  });
  useRealtimeSTT(); useRealtimeSTT();
  assert.equal(starts, 0);
  client.emit({ isListening: true, session: { status: "listening" } });
  client.emit({ lastFinalTranscript: "Show ModelGate" });
  assert.equal(submissions, 1);
  client.emit({ partialTranscript: "" });
  assert.equal(store.interactionPhase, "thinking");
  client.emit({ lastFinalTranscript: "Show ModelGate" });
  assert.equal(submissions, 2, "identical later utterances are still separate turns");
  assert.equal(starts, 0, "subscribing never opens the microphone");
  await stopRealtimeSTTListening({ discardTranscript: true });
  client.emit({ lastFinalTranscript: "Abandoned final result" });
  assert.equal(submissions, 2, "explicit cancellation discards late final transcripts");
  cleanups[0](); assert.equal(stops, 1);
  cleanups[1](); assert.equal(stops, 2);
});
