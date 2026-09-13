import TextCursorInput from "@lucide/svelte/icons/text-cursor-input";
import AlignLeft from "@lucide/svelte/icons/align-left";
import Hash from "@lucide/svelte/icons/hash";
import ToggleLeft from "@lucide/svelte/icons/toggle-left";
import List from "@lucide/svelte/icons/list";
import Braces from "@lucide/svelte/icons/braces";
import Rows3 from "@lucide/svelte/icons/rows-3";
import Columns3 from "@lucide/svelte/icons/columns-3";
import Square from "@lucide/svelte/icons/square";
import PanelsTopLeft from "@lucide/svelte/icons/panels-top-left";
import Type from "@lucide/svelte/icons/type";
import Image from "@lucide/svelte/icons/image";
import Minus from "@lucide/svelte/icons/minus";
import Link from "@lucide/svelte/icons/link";
import MousePointer2 from "@lucide/svelte/icons/mouse-pointer-2";

const names: Record<string, string> = {
  VerticalLayout: "Vertical Layout",
  HorizontalLayout: "Horizontal Layout",
  ImageView: "Image View",
  text: "Text Field",
  textarea: "Text Area",
  number: "Number",
  checkbox: "Checkbox",
  Label: "Text / Label",
};
export const elementLabel = (type: string) => names[type] ?? type;
export function elementIcon(type: string) {
  switch (type) {
    case "VerticalLayout":
      return Rows3;
    case "HorizontalLayout":
      return Columns3;
    case "Group":
    case "object":
      return Braces;
    case "Categorization":
    case "Category":
      return PanelsTopLeft;
    case "string":
    case "text":
    case "Control":
      return TextCursorInput;
    case "textarea":
      return AlignLeft;
    case "number":
    case "integer":
      return Hash;
    case "boolean":
    case "checkbox":
      return ToggleLeft;
    case "array":
    case "Select":
    case "Checkbox group":
    case "Radio group":
      return List;
    case "Label":
      return Type;
    case "ImageView":
    case "Image View":
      return Image;
    case "Separator":
    case "Spacer":
    case "null":
      return Minus;
    case "reference":
      return Link;
    case "Button":
      return MousePointer2;
    default:
      return Square;
  }
}
