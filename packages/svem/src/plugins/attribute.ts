import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Node } from 'mdast';

export type XMultiAttributes = Array<string | boolean | number>;
export type XAttributes = Record<string, string | boolean | number | XMultiAttributes>;

export type XNode = Node & {
  type: string;
  attributes: XAttributes;
  name?: string;
  meta?: string;
  value?: string;
  children?: XNode[];
};

export const remarkAttributes: Plugin<[], XNode> = () => {
  return (tree) => {
    visit(tree, (node: XNode) => {
      node.attributes = getAttributes(node.meta ?? '');
    });
  };
};

export const getAttributes = (meta: string): XAttributes => {
  const parts = meta.match(/(\w+)(?:="([^"]*)")?/g) ?? [];
  const attributes: XAttributes = {};

  parts.forEach((part) => {
    const [key, value = ''] = part.split('=');
    const match = value.match(/"([^"]+)"$/);

    if (match) {
      attributes[key] = match[1]; // e.g., { id: "my-id" }
    } else {
      attributes[key] = true;
    }
  });

  return attributes;
};
