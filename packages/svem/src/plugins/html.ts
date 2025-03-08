import type { XNode } from './attribute.js';
import type { Plugin } from 'unified';

export type XHTMLNode = XNode & {
  type: 'html-node';
  tagName: string;
  escape?: boolean;
  children?: Array<XHTMLNode | XNode>;
};

export type HTMLOptions = {
  brandAlias?: string;
};

// HTML Node Plugin.
export const remarkHtmlNodes: Plugin<[HTMLOptions | undefined], XNode> = (options) => {
  return (tree) => {
    for (const node of [...(tree.children ?? [])]) {
      if (node.type === 'html-node') {
        if (options?.brandAlias) {
          [node as XHTMLNode, ...findNodes(node as XHTMLNode, (n) => n.type === 'html-node')].forEach((n) => {
            if (n.type === 'html-node' && n.attributes?.class) {
              if (typeof n.attributes.class === 'string') {
                n.attributes.class = n.attributes.class.split(' ');
              }

              n.attributes.class = (n.attributes.class as string[]).map((c) => `${options.brandAlias}-${c}`);
            }
          });
        }

        flattenHtmlNodes(node as XHTMLNode, tree as XHTMLNode);
      }
    }
  };
};

export const findNode = (node: XHTMLNode, fn: (n: XNode | XHTMLNode) => boolean | void) => {
  return findNodes(node, fn)[0];
};

export const findNodes = (node: XHTMLNode, fn: (n: XNode | XHTMLNode) => boolean | void) => {
  const results: Array<XHTMLNode | XNode> = [];

  for (const child of node.children ?? []) {
    const match = fn(child);

    if (match) {
      results.push(child);
    }

    if (child.children) {
      results.push(...findNodes(child as XHTMLNode, fn));
    }
  }

  return results;
};

export const flattenHtmlNodes = (node: XHTMLNode, parent: XHTMLNode, indent = 0) => {
  const attributes = Object.entries(node.attributes ?? {})
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}="${value.join(' ')}"`;
      }

      return value && (value === true ? key : `${key}="${value}"`);
    })
    .filter(Boolean);

  const space = '  '.repeat(indent);
  (node as XNode).type = 'html';

  if (node.children?.length) {
    node.value = `${space}<${node.tagName} ${attributes.join(' ')}>`;

    for (const child of node.children) {
      if (child.type === 'html-node') {
        flattenHtmlNodes(child as XHTMLNode, node, indent + 1);
      }
    }

    parent.children?.splice(parent.children.indexOf(node) + 1, 0, {
      type: 'html',
      value: `${space}</${node.tagName}>`,
    } as XNode);

    parent.children?.splice(parent.children.indexOf(node) + 1, 0, ...node.children);
  } else if (typeof node.value === 'string') {
    if (node.escape) {
      node.value = escapeHtml(node.value);
    }

    node.value = [`${space}<${node.tagName} ${attributes.join(' ')}>`, node.value, `</${node.tagName}>`].join('\n');
  } else {
    node.value = '';
  }
};

export const escapeHtml = (value: string) => {
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\{/g, '&#123;')
    .replace(/}/g, '&#125;')
    .replace(/\[/g, '&#91;')
    .replace(/]/g, '&#93;')
    .replace(/`/g, '&#96;');
};
