const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const source = fs.readFileSync(path.join(__dirname, "../src/lib/bounded-reply.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const utility = {};
new Function("exports", compiled)(utility);
const { boundReply } = utility;

function withinLimits(reply, words, chars) {
  assert.ok(reply.length <= chars);
  assert.ok(reply.split(" ").length <= words);
}

test("live ModelGate response retains its complete opening sentence", () => {
  const liveCutoff = "ModelGate is my model-release system. It trains real geometry classifiers, checks their behavior under several distribution shifts, and only";
  const fullReply = `${liveCutoff} promotes candidates that meet every gate.`;
  // Reproduce the exact observed output of the previous word/character clamp.
  assert.equal(
    fullReply.split(" ").slice(0, 24).join(" ").slice(0, 140).trim(),
    liveCutoff,
  );
  const reply = boundReply(fullReply, 24, 140);
  assert.equal(reply, "ModelGate is my model-release system.");
  withinLimits(reply, 24, 140);
});

test("already-short replies stay intact with normalized whitespace", () => {
  assert.equal(boundReply("  I built\nModelGate.  ", 22, 120), "I built ModelGate.");
  assert.equal(boundReply("The classifier reached 99.6% accuracy.", 22, 120), "The classifier reached 99.6% accuracy.");
});

test("a single long sentence ends at the word budget with an ellipsis", () => {
  const reply = boundReply("I built a release gate that rejects weak slices before a model is promoted.", 6, 140);
  assert.equal(reply, "I built a release gate that…");
  withinLimits(reply, 6, 140);
});

test("character budget never splits a word and reserves room for the ellipsis", () => {
  const reply = boundReply("Geometry classifiers evaluate rotated shapes.", 24, 20);
  assert.equal(reply, "Geometry…");
  withinLimits(reply, 24, 20);
  assert.equal(boundReply("Unbreakableword", 24, 5), "…");
});

test("multiple complete sentences survive when the next sentence will not fit", () => {
  assert.equal(
    boundReply("It passed. One slice failed. The model was blocked because the weakest class regressed.", 22, 35),
    "It passed. One slice failed.",
  );
});
