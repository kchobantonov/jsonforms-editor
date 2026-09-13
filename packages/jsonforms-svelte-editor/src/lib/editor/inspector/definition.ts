import { fieldHelp } from "./help.js";
import { advancedKeywords, jsonSchemaFields } from "./advanced.js";
import { formLanguages } from "../i18n/form-languages.js";
import { choiceDefinition } from "./choices.js";
import { translationValue } from "./translations.js";
import {
  object,
  resolve,
  type Document,
  type Node,
} from "../document/commands/index.js";
import { schemaFields } from "./fields.js";

type Field = {
  key: string;
  title: string;
  description?: string;
  type?: string;
  oneOf?: { const: string | number; title: string }[];
  minimum?: number;
  enum?: string[];
  items?: Record<string, unknown>;
  minItems?: number;
  uniqueItems?: boolean;
};
const field = (
  key: string,
  title: string,
  type = "string",
  minimum?: number,
): Field => ({
  key,
  title,
  type,
  description: fieldHelp[key.split(":")[0]],
  ...(minimum !== undefined ? { minimum } : {}),
});

/** Only expose properties implemented by the selected renderer/schema kind. */
export function inspectorDefinition(
  document: Document,
  node: Node,
  schemaOnly = false,
) {
  const groups: { label: string; fields: Field[] }[] = [];
  const schema =
    node.scope === "#"
      ? object(document.schema)
      : resolve(document.schema, node.scope);
  const options = object(node.options);
  const type = schema.type;
  const hasType = (kind: string) =>
    type === kind || (Array.isArray(type) && type.includes(kind));
  const dialect = String(object(document.schema).$schema ?? "");
  const modern = /2019-09|2020-12/.test(dialect);
  const latest = /2020-12/.test(dialect);
  const choices =
    node.type === "Control" ? choiceDefinition(schema) : undefined;
  const general: Field[] = [];
  if (["Control", "Group", "Category", "Label", "Button"].includes(node.type))
    general.push(field("label", node.type === "Label" ? "Text" : "Label"));
  if (node.type === "Button") general.push(field("action", "Action"));
  if (node.type === "Spacer")
    general.push(field("height", "Height (px)", "number", 0));
  if (node.type === "ImageView")
    general.push(field("src", "Image URL"), field("alt", "Alternative text"));
  if (["VerticalLayout", "HorizontalLayout"].includes(node.type))
    general.push({
      ...field("layoutType", "Layout type"),
      oneOf: [
        { const: "VerticalLayout", title: "Vertical Layout" },
        { const: "HorizontalLayout", title: "Horizontal Layout" },
      ],
    });
  if (general.length) groups.push({ label: "General", fields: general });
  if (node.type === "Control") {
    groups.push({
      label: "Field",
      fields: [
        {
          ...field("schemaTypes", "Type", "array"),
          minItems: 1,
          uniqueItems: true,
          items: {
            type: "string",
            enum: [
              "string",
              "number",
              "integer",
              "boolean",
              "object",
              "array",
              "null",
            ],
          },
        },
        ...(hasType("array") && (schema.items === undefined || (schema.items !== null && typeof schema.items === "object" && !Array.isArray(schema.items))) ? [{
          ...field("itemTypes", "Items type", "array"),
          minItems: 1,
          uniqueItems: true,
          items: { type: "string", enum: ["string", "number", "integer", "boolean", "object", "array", "null"] },
        }] : []),
        field("schemaTitle", "Title"),
        field("schemaDescription", "Description"),
        field("schemaDefault", "Default value"),
      ],
    });
    const appearance = [field("readonly", "Read only", "boolean")];
    if (
      !choices &&
      (type === "string" || (Array.isArray(type) && type.includes("string")))
    )
      appearance.push(field("multi", "Multiline", "boolean"));
    groups.push({ label: "Appearance", fields: appearance });
    if (choices)
      groups.push({
        label: "Choices",
        fields: [
          { ...field("choiceMode", "Choice schema"), enum: ["enum", "oneOf"] },
          ...(type === "array"
            ? []
            : [
                {
                  ...field("choiceWidget", "Selection display"),
                  enum: ["select", "radio"],
                },
              ]),
          {
            ...field("choiceRows", "Choices", "array"),
            minItems: 1,
            items: {
              type: "object",
              required: ["value"],
              properties: {
                value: { type: choices.type, title: "Value" },
                ...(choices.mode === "oneOf"
                  ? { title: { type: "string", title: "Title" } }
                  : {}),
              },
            },
          },
        ],
      });
    const validation: Field[] = [];
    if (
      typeof node.scope === "string" &&
      /\/properties\/[^/]+$/.test(node.scope)
    )
      validation.push(field("required", "Required", "boolean"));
    if (hasType("string"))
      validation.push(
        field("minLength", "Minimum length", "integer", 0),
        field("maxLength", "Maximum length", "integer", 0),
        field("pattern", "Pattern"),
        field("format", "Format"),
      );
    if (hasType("number") || hasType("integer"))
      validation.push(
        field("minimum", "Minimum", "number"),
        field("maximum", "Maximum", "number"),
        field("multipleOf", "Multiple of", "number", 0),
        field(
          "exclusiveMinimum",
          "Exclusive minimum",
          /draft-04/.test(dialect) ? "boolean" : "number",
        ),
        field(
          "exclusiveMaximum",
          "Exclusive maximum",
          /draft-04/.test(dialect) ? "boolean" : "number",
        ),
      );
    if (hasType("array"))
      validation.push(
        field("minItems", "Minimum items", "integer", 0),
        field("maxItems", "Maximum items", "integer", 0),
        field("uniqueItems", "Unique items", "boolean"),
      );
    if (hasType("object"))
      validation.push(
        field("minProperties", "Minimum properties", "integer", 0),
        field("maxProperties", "Maximum properties", "integer", 0),
      );
    validation.push(
      field("schemaConst", "Constant value"),
      field("schemaEnum", "Allowed values"),
    );
    if (validation.length)
      groups.push({ label: "Validation", fields: validation });
  }
  if (node.type === "Control") {
    groups.push({
      label: "Advanced",
      fields: [
        field("schemaExamples", "Examples"),
        field("schemaReadOnly", "Read only annotation", "boolean"),
        field("schemaWriteOnly", "Write only", "boolean"),
        ...(modern ? [field("schemaDeprecated", "Deprecated", "boolean")] : []),
        field("schemaRef", "Reference"),
        field("schemaComment", "Comment"),
        ...advancedKeywords
          .filter(([keyword, , , kind]) => {
            if (kind && !hasType(kind)) return false;
            if (
              [
                "dependentRequired",
                "dependentSchemas",
                "unevaluatedProperties",
                "unevaluatedItems",
                "minContains",
                "maxContains",
                "contentSchema",
                "$defs",
              ].includes(keyword) &&
              !modern
            )
              return Object.hasOwn(schema, keyword);
            if (keyword === "prefixItems" && !latest)
              return Object.hasOwn(schema, keyword);
            if (
              (keyword === "additionalItems" && latest) ||
              (["definitions", "dependencies"].includes(keyword) && modern)
            )
              return Object.hasOwn(schema, keyword);
            return true;
          })
          .map(([keyword, title, description]) => ({
            ...field(`keyword:${keyword}`, title),
            description,
          })),
      ],
    });
  }
  const parentOf = (root: Node | undefined): Node | undefined => {
    if (root?.elements?.includes(node)) return root;
    for (const child of root?.elements ?? []) {
      const found = parentOf(child);
      if (found) return found;
    }
  };
  if (!schemaOnly && parentOf(document.uischema)?.type === "HorizontalLayout")
    groups.push({
      label: "Layout",
      fields: [
        {
          key: "columns",
          title: "Columns",
          description: fieldHelp.columns,
          oneOf: [
            { const: "auto", title: "Auto" },
            ...Array.from({ length: 15 }, (_, i) => ({
              const: i + 2,
              title: String(i + 2),
            })),
          ],
        },
      ],
    });
  if (node.type === "Group") {
    let layout = groups.find((group) => group.label === "Layout");
    if (!layout) {
      layout = { label: "Layout", fields: [] };
      groups.push(layout);
    }
    layout.fields.push(
      field("collapsible", "Collapsible", "boolean"),
      field("collapsed", "Initially collapsed", "boolean"),
      field("showDataIndicator", "Show data indicator", "boolean"),
    );
  }
  if (["Control", "Group", "Category", "Label", "Button"].includes(node.type))
    groups.push({
      label: "Translations",
      fields: [
        field("i18n", "Translation key"),
        ...formLanguages(document.translations).flatMap((locale) => [
          field(
            `translatedLabel:${locale}`,
            `Translated label/text · ${locale}`,
          ),
          ...(node.type === "Control"
            ? [
                field(
                  `translatedDescription:${locale}`,
                  `Translated description · ${locale}`,
                ),
              ]
            : []),
        ]),
      ],
    });
  if (!schemaOnly && document.uischema)
    groups.push({ label: "Rules", fields: [field("rule", "Rule", "object")] });
  if (schemaOnly) {
    for (let i = groups.length - 1; i >= 0; i--)
      if (
        !["Field", "Validation", "Advanced", "Choices"].includes(
          groups[i].label,
        )
      )
        groups.splice(i, 1);
  }
  const fields = groups.flatMap((group) => group.fields);
  const data: Record<string, unknown> = {};
  for (const { key } of fields) {
    let value: unknown;
    if (key === "layoutType") value = node.type;
    else if (key in jsonSchemaFields) {
      const raw = schema[jsonSchemaFields[key]];
      value = raw === undefined ? undefined : JSON.stringify(raw, null, 2);
    } else if (key === "rule") value = node.rule;
    else if (key === "itemTypes") {
      const itemType = object(schema.items).type;
      value = Array.isArray(itemType) ? itemType : typeof itemType === "string" ? [itemType] : undefined;
    }
    else if (key === "schemaTypes")
      value = Array.isArray(type)
        ? type
        : typeof type === "string"
          ? [type]
          : undefined;
    else if (key === "choiceMode") value = choices?.mode;
    else if (key === "choiceRows") value = choices?.rows;
    else if (key === "choiceWidget")
      value = options.format === "radio" ? "radio" : "select";
    else if (key === "i18n") value = node.i18n;
    else if (
      key.startsWith("translatedLabel:") ||
      key.startsWith("translatedDescription:")
    )
      value =
        typeof node.i18n === "string"
          ? translationValue(
              document,
              key.split(":")[1],
              node.i18n,
              key.startsWith("translatedDescription:")
                ? "description"
                : node.type === "Label"
                  ? "text"
                  : "label",
            )
          : undefined;
    else if (key === "label")
      value = node.type === "Label" ? node.text : node.label;
    else if (key === "action") value = node.action;
    else if (key === "required") {
      const parts = String(node.scope).split("/");
      const owner =
        parts.length === 3
          ? object(document.schema)
          : resolve(document.schema, parts.slice(0, -2).join("/"));
      if (
        Array.isArray(owner.required) &&
        owner.required.includes(
          parts.at(-1)!.replace(/~1/g, "/").replace(/~0/g, "~"),
        )
      )
        value = true;
    } else if (key in schemaFields)
      value = schema[schemaFields[key as keyof typeof schemaFields]];
    else if (key === "columns") value = options.columns ?? "auto";
    else value = options[key];
    if (value !== undefined) data[key] = value;
  }
  return {
    fields,
    data,
    schema: {
      type: "object",
      properties: Object.fromEntries(
        fields.map(({ key, ...definition }) => [
          key,
          {
            ...definition,
            ...(key === "multipleOf" ? { exclusiveMinimum: 0 } : {}),
            ...(key === "pattern" ? { format: "regex" } : {}),
            ...(key === "translationLocale"
              ? { minLength: 1, pattern: "^[A-Za-z][A-Za-z0-9-]*$" }
              : {}),
          },
        ]),
      ),
    },
    uischema: {
      type: "VerticalLayout",
      elements: groups.map((group) => ({
        type: "Group",
        label: group.label,
        options: {
          collapsible: true,
          collapsed:
            group.label !== "General" &&
            group.label !== "Field" &&
            group.label !== "Rules",
          showDataIndicator: group.label !== "Translations",
        },
        elements: group.fields.map(({ key }) => ({
          type: "Control",
          scope: `#/properties/${key}`,
          ...(key in jsonSchemaFields
            ? { options: { editorControl: "json-value" } }
            : {}),
          ...((key === "schemaTypes" || key === "itemTypes")
            ? { options: { editorControl: "schema-type", multiple: true } }
            : {}),
          ...(key === "rule" ? { options: { editorControl: "rule" } } : {}),
          ...(key.startsWith("translated")
            ? {
                rule: {
                  effect: "ENABLE",
                  condition: {
                    scope: "#/properties/i18n",
                    schema: { type: "string", minLength: 1 },
                    failWhenUndefined: true,
                  },
                },
              }
            : {}),
          ...(key === "collapsed"
            ? {
                rule: {
                  effect: "SHOW",
                  condition: {
                    scope: "#/properties/collapsible",
                    schema: { const: true },
                    failWhenUndefined: true,
                  },
                },
              }
            : {}),
        })),
      })),
    },
  };
}
