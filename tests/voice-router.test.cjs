const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const modules = new Map();

// Exercise the real handler and registry without a network request or API key.
// The model returns no result so these cases verify deterministic routing.
function loadSource(filename) {
  if (!path.extname(filename)) filename += ".ts";
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  if (filename.endsWith(".json")) {
    module.exports = JSON.parse(fs.readFileSync(filename, "utf8"));
    return module.exports;
  }
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  function importSource(request) {
    if (request === "@/lib/structured-llm.server") {
      return { generateStructuredJson: async () => null };
    }
    if (request.startsWith("@/")) {
      return loadSource(path.join(root, "src", request.slice(2)));
    }
    if (request.startsWith(".")) {
      return loadSource(path.resolve(path.dirname(filename), request));
    }
    return require(request);
  }
  new Function("exports", "require", "module", compiled)(module.exports, importSource, module);
  return module.exports;
}

const { POST } = loadSource(path.join(root, "app/api/voice-router/route.ts"));

for (const id of ["modelgate", "flightdeck", "clearinghouse"]) {
  for (const section of ["", " architecture"]) {
    test(`opens ${id}${section} from another portfolio page`, async () => {
      const response = await POST(new Request("http://localhost/api/voice-router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: `Open ${id}${section}`,
          activeEntityId: "heygen",
          activeRoute: "/experience/heygen",
          activeCard: "overview",
        }),
      }));
      const result = await response.json();
      assert.equal(response.status, 200);
      assert.equal(result.entity?.id, id);
      assert.equal(result.route, `/projects/${id}`);
      if (section) assert.equal(result.section, "architecture");
      assert.ok(result.spokenResponse.length > 0);
    });
  }
}

for (const scenario of [
  { name: "an explicit Matrix section overrides the open HeyGen page", transcript: "Matrix architecture", current: "heygen", expected: "matrix" },
  { name: "an unnamed section stays with the open HeyGen page", transcript: "architecture", current: "heygen", expected: "heygen" },
  { name: "naming the current Matrix preserves its section follow-up", transcript: "Matrix architecture", current: "matrix", expected: "matrix" },
]) {
  test(scenario.name, async () => {
    const currentRoute = scenario.current === "matrix" ? "/projects/matrix" : "/experience/heygen";
    const request = new Request("http://localhost/api/voice-router", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: scenario.transcript,
        activeEntityId: scenario.current,
        activeRoute: currentRoute,
        activeCard: "overview",
      }),
    });
    const response = await POST(request);
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.equal(result.entity.id, scenario.expected);
    assert.equal(result.route, scenario.expected === "matrix" ? "/projects/matrix" : "/experience/heygen");
    assert.equal(result.card, "architecture");
    assert.equal(result.section, "architecture");
    if (scenario.current === scenario.expected) assert.equal(result.intent, "answer");
  });
}
