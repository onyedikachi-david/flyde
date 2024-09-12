import { MacroNode } from "@flyde/core";

export interface InlineValueConfig {
  type: "string" | "boolean" | "number" | "json";
  value: string;
}

export const InlineValue: MacroNode<InlineValueConfig> = {
  id: "InlineValue",
  displayName: "Value",
  defaultStyle: {
    icon: "pen",
  },
  description: "A static value or JS expression",
  runFnBuilder: (config) => {
    return (_, outputs) => {
      outputs.value.next(config.value);
    };
  },
  definitionBuilder: (config) => {
    return {
      defaultStyle: {
        size: "small",
        icon: "pen",
      },
      displayName: JSON.stringify(config.value),
      description: `Emits the value \`${JSON.stringify(config.value)}\``,
      inputs: {},
      outputs: {
        value: {
          displayName: "Value",
          description: "Emits the value configured",
        },
      },
    };
  },
  defaultData: {
    type: "string",
    value: "Hello",
  },
  editorConfig: {
    type: "custom",
    editorComponentBundlePath: "../../dist/ui/InlineValue.js",
  },
};
