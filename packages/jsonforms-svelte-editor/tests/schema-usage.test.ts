import assert from "node:assert/strict";
import { test } from "node:test";
import { schemaTree } from "../dist/editor/document/schema-tree.js";
import {
  schemaOccurrences,
  unusedSchemaTree,
} from "../dist/editor/document/schema-usage.js";
test("usage preserves duplicate placements and unused descendants of used containers", () => {
  const scope = "#/properties/person";
  const root = schemaTree({
    type: "object",
    properties: {
      person: { type: "object", properties: { name: { type: "string" } } },
      active: { type: "boolean" },
    },
  });
  const occurrences = schemaOccurrences({
    type: "VerticalLayout",
    elements: [
      { type: "Control", scope },
      { type: "Group", label: "Other", elements: [{ type: "Control", scope }] },
    ],
  });
  assert.deepEqual(
    occurrences.map((item) => item.path),
    [[0], [1, 0]],
  );
  assert.notEqual(occurrences[0].label, occurrences[1].label);
  const filtered = unusedSchemaTree(
    root,
    new Set([scope, "#/properties/active"]),
  )!;
  assert.equal(filtered.children.length, 1);
  assert.equal(filtered.children[0].bindable, false);
  assert.equal(filtered.children[0].children[0].bindable, true);
  assert.equal(
    unusedSchemaTree(
      root,
      new Set(["#", scope, scope + "/properties/name", "#/properties/active"]),
    ),
    undefined,
  );
});

test("bound root objects use generated fields, while explicit details leave omitted fields unused", async () => {
  const { usedSchemaScopes } = await import("../dist/editor/document/schema-usage.js");
  const root = schemaTree({
    type: "object", default: "tesgt",
    properties: {
      firstName1: { type: "string" }, enabled: { type: "boolean" },
      person: { type: "object", properties: { name: { type: "string" }, age: { type: "integer" } } },
      "a/b~c": { type: "string" },
    },
  });
  const bound = (options = {}) => ({ type: "HorizontalLayout", elements: [{ type: "Control", scope: "#", options }] });
  for (const options of [{ columns: 16 }, { detail: "GENERATE" }]) {
    const used = usedSchemaScopes(root, bound(options));
    assert.ok(used.has("#/properties/firstName1"));
    assert.ok(used.has("#/properties/person/properties/name"));
    assert.equal(unusedSchemaTree(root, used), undefined);
  }
  const explicit = bound({ detail: { type: "VerticalLayout", elements: [
    { type: "Control", scope: "#/properties/enabled" },
    { type: "Control", scope: "#/properties/a~1b~0c" },
    { type: "Control", scope: "#/properties/person", options: { detail: { type: "VerticalLayout", elements: [{ type: "Control", scope: "#/properties/name" }] } } },
  ] } });
  const used = usedSchemaScopes(root, explicit);
  assert.ok(used.has("#/properties/person/properties/name"));
  assert.ok(!used.has("#/properties/person/properties/age"));
  const filtered = unusedSchemaTree(root, used);
  assert.deepEqual(filtered.children.map(child => child.label), ["firstName1", "person"]);
  assert.deepEqual(filtered.children[1].children.map(child => child.label), ["age"]);
  assert.equal(filtered.children[1].bindable, false);
  assert.equal(usedSchemaScopes(root, undefined).size, 0);
  const nested = usedSchemaScopes(root, { type: "Control", scope: "#/properties/person" });
  assert.ok(nested.has("#/properties/person/properties/age"));
  assert.ok(!nested.has("#/properties/enabled"));
  assert.deepEqual([...usedSchemaScopes(root, bound({ detail: { type: "VerticalLayout", elements: [] } }))], ["#"]);
});
