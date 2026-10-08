const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const modules = new Map();

function loadSource(filename) {
  if (!fs.existsSync(filename)) filename += ".ts";
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const importSource = (request) => request.startsWith("@/")
    ? loadSource(path.join(root, "src", request.slice(2)))
    : require(request);
  new Function("exports", "require", "module", compiled)(module.exports, importSource, module);
  return module.exports;
}

const { derivePhoneScreen, resolvePhoneScreen, createPhoneListScreen, getPhoneParent } = loadSource(path.join(root, "src/utils/phone.ts"));

test("direct project and experience loads resolve before the Home store synchronizes", () => {
  const home = derivePhoneScreen({ route: "/" });
  for (const [route, id] of [["/projects/modelgate", "modelgate"], ["/projects/flightdeck", "flightdeck"], ["/projects/clearinghouse", "clearinghouse"], ["/experience/heygen", "heygen"]]) {
    const firstPaint = resolvePhoneScreen(route, "/", home);
    assert.equal(firstPaint.view, "detail");
    assert.equal(firstPaint.entityId, id);
    assert.equal(firstPaint.route, route);
  }
});

test("browser Back and Forward override the previous detail or transient contact screen", () => {
  const detail = derivePhoneScreen({ route: "/projects/modelgate" });
  assert.equal(resolvePhoneScreen("/projects", detail.route, detail).view, "list");
  const folder = derivePhoneScreen({ route: "/projects" });
  assert.equal(resolvePhoneScreen("/projects/modelgate", folder.route, folder).entityId, "modelgate");
  const contact = { ...derivePhoneScreen({ route: "/phone" }), route: null, contactId: "bowen", callMode: "voice" };
  assert.equal(resolvePhoneScreen("/projects/flightdeck", "/projects/modelgate", contact).entityId, "flightdeck");
  assert.equal(resolvePhoneScreen("/", "/projects/modelgate", detail).view, "home");
});

test("synchronized voice-selected cards and contact targets retain their identity", () => {
  const detail = derivePhoneScreen({ route: "/experience/heygen", card: "architecture" });
  assert.equal(resolvePhoneScreen(detail.route, detail.route, detail), detail);
  const contact = { ...derivePhoneScreen({ route: "/phone" }), route: null, contactId: "bowen", callMode: "voice" };
  assert.equal(resolvePhoneScreen("/projects/modelgate", "/projects/modelgate", contact), contact);
});

test("a mismatched routed screen is replaced even when activeRoute already changed", () => {
  const old = derivePhoneScreen({ route: "/projects/modelgate" });
  const next = resolvePhoneScreen("/experience/heygen", "/experience/heygen", old);
  assert.equal(next.entityId, "heygen");
  assert.equal(next.app, "experience");
});

test("folder screens carry URLs and every detail has the correct parent", () => {
  for (const [app, detail, title] of [["projects", "/projects/modelgate", "Projects"], ["experience", "/experience/heygen", "Experience"], ["primitives", "/primitives/apollo", "Gods' Hands"]]) {
    const list = createPhoneListScreen(app);
    assert.equal(list.route, `/${app}`);
    assert.equal(list.view, "list");
    assert.deepEqual(getPhoneParent(derivePhoneScreen({ route: detail })), { route: `/${app}`, title });
    assert.equal(getPhoneParent(list), null);
  }
  assert.equal(getPhoneParent(derivePhoneScreen({ route: "/" })), null);
  assert.equal(getPhoneParent(derivePhoneScreen({ route: "/phone" })), null);
});
