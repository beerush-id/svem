import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { XSection } from './directive.js';
import type { Root } from 'mdast';
import { findNodes } from './html.js';
import { createTab } from './tab.js';

export const remarkCodeGroup: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'directive', (node: XSection) => {
      if (node.name !== 'code-group') {
        return;
      }

      const { children = [] } = node;

      if (!children.find((child) => child.attributes.active)) {
        children[0].attributes.active = true;
      }

      children.forEach((child, index) => {
        if (!child.attributes.label) {
          child.attributes.label = child.attributes.id ?? `Tab ${index}`;
        }

        if (!child.attributes.id) {
          child.attributes.id = index;
        }
      });

      const tab = createTab(children, node.attributes);

      findNodes(tab, (n) => {
        if (!Array.isArray(n.attributes.class)) {
          n.attributes.class = [];
        }

        if (n.name === 'tab-list') {
          n.attributes.class.push('code-group-tab');
        }

        if (n.name === 'tab-button-list') {
          n.attributes.class.push('code-group-tab-button-list');
        }

        if (n.name === 'tab-button') {
          n.attributes.class.push('code-group-tab-button');
        }

        if (n.name === 'tab-content') {
          n.attributes.class.push('code-group-tab-content');
        }
      });

      Object.assign(node, tab);
    });
  };
};
