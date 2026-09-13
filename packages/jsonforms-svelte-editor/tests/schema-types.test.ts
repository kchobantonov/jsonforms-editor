import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialize,
  insert,
  designRoot,
  updateProperties,
  clone,
} from "../dist/editor/document/commands/index.js";
import { editSchema } from "../dist/editor/document/schema-edit.js";
import { inspectorDefinition } from "../dist/editor/inspector/definition.js";
import { applyDrop, canDrop } from "../dist/editor/dnd/drop-handler.js";
import { elementId } from "../dist/editor/document/identity.js";

test("schema-only documents stay schema-only until authoring a control", () => {
  const model = {
    schema: { type: "object", properties: { text: { type: "string" } } },
  };
  const doc = initialize(model);
  assert.deepEqual(clone(doc), model);
  const root = designRoot(doc);
  assert.deepEqual(root.elements, []);
  const next = applyDrop(
    doc,
    { kind: "schema-property", pointer: "#/properties/text" },
    elementId(root),
    0,
  );
  assert.equal(next.uischema?.scope, "#/properties/text");
  assert.equal(doc.uischema, undefined);
  const preset = applyDrop(doc, { kind: "palette-item", preset: "text" }, elementId(root), 0);
  assert.equal(preset.uischema?.type, "Control");
  assert.equal(preset.uischema?.elements, undefined);
  const payload = { kind: "palette-item" as const, preset: "text" };
  assert.equal(canDrop(preset, payload, elementId(preset.uischema!)), false);
  assert.throws(() => applyDrop(preset, payload, elementId(preset.uischema!), 0), /compatible container/);
  for (const type of ["VerticalLayout", "HorizontalLayout", "Group", "Categorization"]) {
    const layout = applyDrop(doc, { kind: "palette-item", preset: type }, elementId(root), 0);
    assert.equal(layout.uischema?.type, type);
    assert.equal(layout.uischema?.elements?.length, type === "Categorization" ? 1 : 0);
    if (type !== "Categorization") {
      const filled = applyDrop(layout, payload, elementId(layout.uischema!), 0);
      assert.equal(filled.uischema?.elements?.[0].type, "Control");
    }
  }
});

test("visual schema authoring and inspector preserve single and union types", () => {
  let doc = editSchema(initialize({}), {
    action: "add",
    pointer: "#",
    name: "value",
    type: ["string", "number"],
  });
  assert.deepEqual(doc.schema.properties.value.type, ["string", "number"]);
  doc = insert(doc, [], {
    type: "Control",
    scope: "#/properties/value",
    options: { multi: true },
  });
  assert.deepEqual(
    inspectorDefinition(doc, doc.uischema.elements[0]).data.schemaTypes,
    ["string", "number"],
  );
  doc = updateProperties(doc, [0], {
    label: "Value",
    multi: false,
    required: false,
    schemaTypes: ["boolean"],
  });
  assert.equal(doc.schema.properties.value.type, "boolean");
  assert.equal(doc.uischema.elements[0].options?.multi, undefined);
});
