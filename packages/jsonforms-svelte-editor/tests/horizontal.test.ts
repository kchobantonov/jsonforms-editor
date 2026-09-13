import { test } from "node:test";
import assert from "node:assert/strict";
import { initialize, updateProperties } from "../dist/editor/document/commands/index.js";
import { inspectorDefinition } from "../dist/editor/inspector/definition.js";
test("Columns is contextual and belongs to the UI placement only", () => {
  const document = initialize({
    schema: { type: "object", properties: { text: { type: "string" } } },
    uischema: { type: "HorizontalLayout", elements: [
      { type: "Control", scope: "#/properties/text" },
      { type: "Control", scope: "#/properties/text" },
      { type: "Group", elements: [] },
    ] },
  });
  assert.ok(inspectorDefinition(document, document.uischema!.elements![0]).fields.some(f => f.key === "columns"));
  assert.equal(inspectorDefinition(document, document.uischema!).fields.some(f => f.key === "columns"), false);
  const sized = updateProperties(document, [0], { columns: 4 });
  assert.deepEqual(sized.schema, document.schema);
  assert.deepEqual(sized.uischema!.elements![0].options, { columns: 4 });
  assert.equal(sized.uischema!.elements![1].options, undefined);
  const cleared = updateProperties(sized, [0], { columns: "auto" });
  assert.equal(cleared.uischema!.elements![0].options, undefined);
  assert.throws(() => updateProperties(document, [0], { columns: 17 }));
  assert.equal(inspectorDefinition(document, document.uischema!.elements![2]).uischema.elements.filter(g => g.label === "Layout").length, 1);
});
