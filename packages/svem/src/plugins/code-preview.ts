import type { Plugin } from 'unified';
import type { XNode } from './attribute.js';
import { type XCodeNode } from './code-highlight.js';
import { visit } from 'unist-util-visit';
import { createTab } from './tab.js';

export const remarkCodePreview: Plugin<[], XNode> = () => {
  return (tree) => {
    visit(tree, 'directive', (node: XNode) => {
      if (node.name !== 'code-preview') {
        return;
      }

      if (!node.children) {
        node.children = [];
      }

      const preview = node.children
        .filter((child) => {
          return (
            child.type !== 'code' &&
            !child.attributes?.hidden &&
            !child.attributes?.excluded &&
            !child.attributes?.norender
          );
        })
        .map((child) => {
          if (child.children?.length) {
            return child.children.map((child) => child.value ?? '').join('');
          }

          return child.value ?? '';
        })
        .filter(Boolean)
        .join('\n');

      const code = node.children
        .map((child) => {
          if (child.children?.length) {
            return child.children.map((child) => child.value ?? '').join('');
          }

          return child.value ?? '';
        })
        .filter(Boolean)
        .join('\n\n');

      const nodes: XNode[] = [
        {
          type: 'html',
          attributes: {
            id: 'preview',
            label: 'Preview',
            class: ['preview-panel'],
            active: node.attributes?.active === 'preview',
          },
          value: preview,
        },
        {
          type: 'code',
          lang: (node.attributes?.lang as string) ?? 'html',
          value: code,
          attributes: {
            id: 'code',
            label: 'Code',
            class: ['code-panel'],
            active: node.attributes?.active === 'code',
          },
        } as XCodeNode,
      ];

      if (nodes.every((node) => node.attributes?.active !== true)) {
        nodes[0].attributes.active = true;
      }

      const tab = createTab(nodes, node.attributes);
      Object.assign(node, tab);
    });
  };
};
