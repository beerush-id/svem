import type { Plugin } from 'unified';
import type { XAttributes, XNode } from './attribute.js';
import type { XHeading, XHTMLHeading } from './heading.js';

export type SectionOptions = {
  attributes?: XAttributes;
};

export const remarkHeadingSection: Plugin<[SectionOptions | undefined], XNode> = (options) => {
  const { attributes = {} } = (options ?? {}) as { attributes: XAttributes };

  return (tree) => {
    if (typeof attributes.class === 'string') {
      attributes.class = attributes.class.split(' ');
    }

    if (!attributes.class) {
      attributes.class = [];
    }

    if (Array.isArray(tree.children)) {
      for (const node of [...tree.children]) {
        if (node.type === 'heading') {
          const index = tree.children.indexOf(node);
          const section: XHTMLHeading = {
            type: 'html-node',
            depth: (node as XHeading).depth,
            tagName: 'section',
            attributes: {
              ...attributes,
              class: ['section-block', ...(attributes.class as string[])],
              'data-depth': (node as XHeading).depth,
            },
            children: [node],
          };

          const children = wrap(tree.children.slice(index + 1), (n) => n.type === 'heading');
          section.children?.push(...children);

          tree.children.splice(index, 0, section);

          for (const child of section.children ?? []) {
            tree.children.splice(tree.children.indexOf(child), 1);
          }
        }
      }
    }
  };
};

export const wrap = (children: XNode[], isStop: (n: XNode) => boolean) => {
  const output: XNode[] = [];

  for (const child of children) {
    if (isStop(child)) {
      break;
    }

    output.push(child);
  }

  return output;
};
