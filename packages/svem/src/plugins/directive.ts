import { visit } from 'unist-util-visit';
import { getAttributes, type XNode } from './attribute.js';
import type { Plugin } from 'unified';
import type { XHTMLNode } from './html.js';

export type XSection = XNode & {
  type: 'directive';
  name: string;
};

/**
 * A remark plugin to parse directive blocks.
 * @returns {(tree) => void}
 */
export const remarkDirective: Plugin<[], XNode> = () => {
  return (tree) => {
    visit(tree, 'paragraph', (node: XSection, index = 0, parent: XNode) => {
      if (!isSectionOpen(node)) {
        return;
      }

      wrapDirective(node, index, parent);
    });
  };
};

const wrapDirective = (node: XNode, index = 0, parent: XNode) => {
  const children = [];
  const initNode = node.children?.[0];

  if (!initNode?.value) {
    return node;
  }

  const [name, ...rest] = initNode.value
    .replace(/:::\s?/, '')
    .trim()
    .split(/\s+/);
  const meta = rest.join(' ');

  node.type = 'directive';
  node.name = name.trim();
  node.meta = meta.trim();
  node.attributes = getAttributes(meta);

  if (!node.name && node.attributes?.name) {
    node.name = node.attributes.name as string;
  }

  if (parent.children?.length) {
    let done = false;

    while (!done) {
      const child = parent.children.splice(index + 1, 1)[0];

      if (!child || isSectionClose(child)) {
        done = true;
        break;
      }

      if (isSectionOpen(child)) {
        wrapDirective(child, index, parent);
      }

      children.push(child);
    }
  }

  node.children = children;
  return node;
};

/**
 * A remark plugin to eject directive blocks.
 * @returns {(tree) => void}
 */
export const remarkDirectiveEject: Plugin<[], XNode> = () => {
  return (tree) => {
    // visit(tree, 'directive', (node: XSection, index = 0, parent: XNode) => {
    //   if (Array.isArray(node.children)) {
    //     for (let i = 0; i < node.children?.length; i++) {
    //       parent.children?.splice(index + i, 0, node.children[i]);
    //     }
    //   }
    //   parent.children?.splice(parent.children?.indexOf(node), 1);
    // });

    visit(tree, 'directive', (node: XHTMLNode) => {
      node.type = 'html-node';
      node.tagName = 'div';

      if (!node.attributes) {
        node.attributes = {};
      }

      if (!Array.isArray(node.attributes.class)) {
        node.attributes.class = [node.attributes.class].filter(Boolean);
      }

      node.attributes.class.push('directive', (node as never as XSection).name);
    });
  };
};

const isSectionOpen = (node: XNode) => {
  if (node.type === 'text' && /^:::/.test(node.value ?? '')) {
    return true;
  }

  if (node.type !== 'paragraph') {
    return false;
  }

  const firstChild = node.children?.[0];

  if (firstChild?.type === 'text' && /^:::/.test(firstChild?.value ?? '')) {
    return true;
  }
};

const isSectionClose = (node: XNode) => {
  if (node.type === 'text' && /^:::$/.test(node.value?.trim() ?? '')) {
    return true;
  }

  if (node.type !== 'paragraph') {
    return false;
  }

  const firstChild = node.children?.[0];

  if (firstChild?.type === 'text' && /^:::$/.test(firstChild?.value?.trim() ?? '')) {
    return true;
  }
};
