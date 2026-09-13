/** Descriptions are JSON Schema annotations, translated when the inspector is rendered. */
export const fieldHelp: Record<string, string> = {
  label:
    "Text shown for this element. Leave empty to use the field title or name.",
  action: "Action identifier emitted when this button is activated.",
  height: "Space reserved by this element, in pixels.",
  src: "URL of the image to display.",
  alt: "Text alternative describing the image for people using a screen reader.",
  layoutType: "Arrange the existing child elements vertically or horizontally.",
  itemTypes: "Allowed JSON value types for each array item. Select multiple types to allow a union.",
  schemaTypes:
    "Allowed JSON value types. Select more than one to allow a union, such as string and null.",
  schemaTitle:
    "A short, readable title for this field, used as its default label.",
  schemaDescription: "Explain what this field is for and how to fill it in.",
  schemaDefault:
    "Suggested value when no value is supplied. JSON Schema does not insert this value automatically.",
  schemaExamples:
    "An array of example values documenting how this field can be used.",
  schemaReadOnly:
    "Marks data that is supplied by the application and should not be edited.",
  schemaWriteOnly: "Marks data intended for input only, such as a password.",
  schemaDeprecated:
    "Marks this field as deprecated while preserving compatibility with existing data.",
  schemaConst: "The only JSON value accepted by this field.",
  schemaEnum: "An array containing every allowed JSON value.",
  schemaRef: "Reference to another schema, for example #/definitions/Address.",
  schemaComment:
    "A note for schema authors; it is not displayed as help in the form.",
  readonly:
    "Prevent editing this control in the form without changing the field schema.",
  multi: "Display a text area for multiple lines of text.",
  required:
    "Require this property to be present in its parent object. Empty values are controlled separately.",
  minLength: "Minimum number of characters allowed in a string.",
  maxLength: "Maximum number of characters allowed in a string.",
  pattern:
    "Regular expression the text must match. Use ^ and $ to match the entire value.",
  format:
    "Semantic format such as email, date, date-time or uri. Validation depends on the configured validator.",
  minimum: "Smallest allowed number, including this boundary.",
  maximum: "Largest allowed number, including this boundary.",
  exclusiveMinimum: "The value must be greater than this number.",
  exclusiveMaximum: "The value must be less than this number.",
  multipleOf: "Require a multiple of this positive number.",
  minItems: "Minimum number of entries in an array.",
  maxItems: "Maximum number of entries in an array.",
  uniqueItems: "Require every array entry to be distinct.",
  minProperties: "Minimum number of properties present in an object.",
  maxProperties: "Maximum number of properties present in an object.",
  columns:
    "Width within a horizontal layout, from 2 to 16 columns. Auto shares the remaining space.",
  collapsible: "Allow the user to expand and collapse this group.",
  collapsed: "Start the group collapsed when the form is opened.",
  showDataIndicator: "Show an indicator when this group contains data.",
  i18n: "Translation key used to look up this element's label and description.",
  translatedLabel: "Label or text displayed for this language.",
  translatedDescription: "Field help displayed for this language.",
  rule: "Show, hide, enable or disable this element when a condition matches.",
  choiceMode:
    "Store choices as enum values or as oneOf values with readable titles.",
  choiceWidget: "Display the choices as a dropdown or radio buttons.",
  choiceRows: "Allowed values and their optional display titles.",
};
