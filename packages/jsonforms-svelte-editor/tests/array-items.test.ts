import { test } from "node:test";
import assert from "node:assert/strict";
import { initialize, updateProperties } from "../dist/editor/document/commands/index.js";
import { inspectorDefinition } from "../dist/editor/inspector/definition.js";
test("array item types can be read and edited without losing item constraints", () => {
  const doc = initialize({ schema: { type: "array", items: { type: "string", minLength: 2, description: "An item" } }, uischema: { type: "Control", scope: "#" } });
  const definition = inspectorDefinition(doc, doc.uischema);
  assert.deepEqual(definition.data.itemTypes, ["string"]);
  assert.ok(definition.fields.some(f => f.key === "itemTypes"));
  const next = updateProperties(doc, [], { itemTypes: ["integer", "null"] });
  assert.deepEqual(next.schema.items, { type: ["integer", "null"], minLength: 2, description: "An item" });
  assert.deepEqual(updateProperties(next, [], { itemTypes: ["object"] }).schema.items.type, "object");
  assert.equal(updateProperties(next, [], { itemTypes: undefined }).schema.items.type, undefined);
  assert.deepEqual(doc.schema.items.type, "string");
  assert.throws(() => updateProperties(doc, [], { itemTypes: ["invalid"] }));
  for (const items of [false, [{ type: "string" }]]) {
    const special = initialize({ schema: { type: "array", items }, uischema: doc.uischema });
    assert.ok(!inspectorDefinition(special, special.uischema).fields.some(f => f.key === "itemTypes"));
  }
  const empty = initialize({ schema: { type: "array" }, uischema: doc.uischema });
  assert.deepEqual(updateProperties(empty, [], { itemTypes: ["boolean"] }).schema.items, { type: "boolean" });
  const scalar = initialize({ schema: { type: "string" }, uischema: doc.uischema });
  assert.ok(!inspectorDefinition(scalar, scalar.uischema).fields.some(f => f.key === "itemTypes"));
});
