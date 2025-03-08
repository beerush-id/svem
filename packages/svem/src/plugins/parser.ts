import type { Plugin } from 'unified';
import type { XNode } from './attribute.js';
import { visit } from 'unist-util-visit';

export const remarkDeepParse: Plugin<[], XNode> = () => {
  return (tree) => {
    visit(tree, 'text', (node: XNode) => {
      const hasMarkup = /<[a-zA-Z0-9_]+([^>].*)(>)/.test(node.value ?? '');

      if (hasMarkup) {
        node.type = 'html';
      }
    });
  };
};
