import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { XNode } from './attribute.js';
import type { XCodeNode } from './code-highlight.js';

// Fix for Svelte syntax detection as the parser detects it as a code block.
export const remarkSvelteParse: Plugin<[], XNode> = () => {
  return (tree) => {
    visit(tree, 'code', (node: XNode) => {
      if ((node as XCodeNode).lang) return;

      const patterns = ['{#', '{@'];
      const isSvelte = patterns.some((pattern) => node.value?.startsWith(pattern));

      if (isSvelte) {
        node.type = 'html';
      }
    });
  };
};

export const remarkSvelteEscape: Plugin<[], XNode> = () => {
  return (tree) => {
    visit(tree, 'html-code', (node: XCodeNode) => {
      escapeCode(node);
    });

    visit(tree, 'code', (node: XNode) => {
      escapeCode(node);
    });

    visit(tree, 'inlineCode', (node: XNode) => {
      escapeCode(node);
    });
  };
};

const escapeCode = (node: XNode) => {
  if (node.value?.startsWith('{@html')) return;

  (node as XNode).type = 'html';
  (node as XNode).value = `{@html \`${node.value}\`}`;
};
