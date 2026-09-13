import assert from "node:assert/strict";
import test from "node:test";
import {
  initialize,
  updateProperties,
} from "../dist/editor/document/commands/index.js";
import { editSchema } from "../dist/editor/document/schema-edit.js";
import {
  schemaTree,
  filterSchemaTree,
} from "../dist/editor/document/schema-tree.js";
import { inspectorDefinition } from "../dist/editor/inspector/definition.js";

test("layout conversion preserves children, options, rules and identity", () => {
  const doc = initialize({
    uischema: {
      type: "HorizontalLayout",
      elements: [{ type: "Label", text: "Hello" }],
      options: { custom: true },
      rule: {
        effect: "HIDE",
        condition: { scope: "#", schema: { const: null } },
      },
    },
  });
  const next = updateProperties(doc, [], { layoutType: "VerticalLayout" });
  assert.deepEqual(next.uischema, { ...doc.uischema, type: "VerticalLayout" });
  assert.equal(doc.uischema!.type, "HorizontalLayout");
});
test("filter retains ancestors and exposes field descriptions and required markers", () => {
  const root = schemaTree({
    type: "object",
    properties: {
      person: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", description: "Contact address" },
          age: { type: "integer" },
        },
      },
    },
  });
  const match = filterSchemaTree(root, "contact");
  assert.equal(match?.children[0].children.length, 1);
  assert.equal(match?.children[0].children[0].required, true);
  assert.equal(filterSchemaTree(root, "missing"), undefined);
});
test("union types expose applicable constraints and schema-driven help", () => {
  const doc = initialize({
    schema: {
      type: "object",
      properties: { value: { type: ["string", "integer", "array", "object"] } },
    },
    uischema: { type: "Control", scope: "#/properties/value" },
  });
  const form = inspectorDefinition(doc, doc.uischema!);
  for (const key of [
    "minLength",
    "exclusiveMinimum",
    "minItems",
    "maxProperties",
    "schemaExamples",
    "schemaDefault",
  ])
    assert.ok(form.fields.find((field) => field.key === key)?.description, key);
  assert.equal(
    form.uischema.elements.some((group) => group.label === "Schema"),
    false,
  );
});
test("JSON values round trip without converting null, arrays or objects into strings", () => {
  const doc = initialize({
    schema: {
      type: "object",
      properties: { value: { type: "object", custom: true } },
    },
    uischema: { type: "Control", scope: "#/properties/value" },
  });
  const next = updateProperties(doc, [], {
    schemaDefault: '{"a":1}',
    schemaExamples: '[{"a":2},null]',
    "keyword:additionalProperties": "false",
  });
  assert.deepEqual((next.schema as any).properties.value, {
    type: "object",
    custom: true,
    default: { a: 1 },
    examples: [{ a: 2 }, null],
    additionalProperties: false,
  });
  assert.throws(() => updateProperties(doc, [], { schemaExamples: "{}" }));
  assert.throws(() =>
    updateProperties(doc, [], { "keyword:minContains": "-1" }),
  );
  assert.throws(() =>
    updateProperties(doc, [], { "keyword:properties": "42" }),
  );
});
test("delete cascades through definitions, controls, rules, data and registered UI schemas", () => {
  const doc = initialize({
    schema: {
      type: "object",
      definitions: { A: { type: "string" }, B: { $ref: "#/definitions/A" } },
      properties: {
        value: { $ref: "#/definitions/B" },
        other: { type: "string" },
      },
      required: ["value"],
      dependentRequired: { other: ["value"] },
    },
    data: { value: "gone", other: "keep" },
    uischema: {
      type: "VerticalLayout",
      elements: [
        { type: "Control", scope: "#/properties/value" },
        {
          type: "Control",
          scope: "#/properties/other",
          rule: {
            effect: "HIDE",
            condition: { scope: "#/properties/value", schema: { const: "x" } },
          },
        },
      ],
    },
    uischemas: [{ uischema: { type: "Control", scope: "#/properties/value" } }],
  });
  const next = editSchema(doc, {
    action: "delete",
    pointer: "#/definitions/A",
  });
  assert.deepEqual(next.data, { other: "keep" });
  assert.deepEqual(next.uischema!.elements, [
    { type: "Control", scope: "#/properties/other" },
  ]);
  assert.deepEqual(next.uischemas, []);
  assert.deepEqual((next.schema as any).definitions, {});
  assert.deepEqual((next.schema as any).dependentRequired, { other: [] });
  assert.equal((next.schema as any).required, undefined);
  assert.equal((doc.data as any).value, "gone");
});
test("deleting a definition field cleans bindings through aliases, without treating literal data as references", () => {
  const doc = initialize({
    schema: {
      type: "object",
      definitions: {
        A: { type: "object", properties: { secret: { type: "string" } } },
      },
      properties: { home: { $ref: "#/definitions/A" } },
    },
    data: { home: { secret: "remove" } },
    uischema: {
      type: "VerticalLayout",
      elements: [
        { type: "Control", scope: "#/properties/home/properties/secret" },
        {
          type: "Label",
          text: "Keep",
          rule: {
            effect: "HIDE",
            condition: {
              scope: "#",
              schema: { const: { scope: "#/definitions/A/properties/secret" } },
            },
          },
        },
      ],
    },
  });
  const next = editSchema(doc, {
    action: "delete",
    pointer: "#/definitions/A/properties/secret",
  });
  assert.deepEqual(next.data, { home: {} });
  assert.equal(next.uischema!.elements!.length, 1);
  assert.deepEqual(next.uischema!.elements![0], doc.uischema!.elements![1]);
});
test("generic enum edits take precedence over unchanged choice rows", () => {
  const doc = initialize({
    schema: {
      type: "object",
      properties: { value: { type: "string", enum: ["a", "b"] } },
    },
    uischema: { type: "Control", scope: "#/properties/value" },
  });
  const values = inspectorDefinition(doc, doc.uischema!).data;
  const next = updateProperties(doc, [], {
    ...values,
    schemaEnum: '["c","d"]',
  });
  assert.deepEqual((next.schema as any).properties.value.enum, ["c", "d"]);
});
