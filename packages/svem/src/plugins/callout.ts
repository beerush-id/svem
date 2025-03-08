import type { Plugin } from 'unified';
import type { XSection } from './directive.js';
import { visit } from 'unist-util-visit';
import type { XHTMLNode } from './html.js';
import type { XNode } from './attribute.js';
import { Caution, ChevronRight, Important, Note, Tip, Warning } from '../icons/index.js';

const calloutTypes: {
  [key: string]: {
    text: string;
    icon: string;
  };
} = {
  note: {
    text: 'Note',
    icon: Note,
  },
  tip: {
    text: 'Tip',
    icon: Tip,
  },
  important: {
    text: 'Important',
    icon: Important,
  },
  warning: {
    text: 'Warning',
    icon: Warning,
  },
  caution: {
    text: 'Caution',
    icon: Caution,
  },
};

const calloutTypeKeys = Object.keys(calloutTypes);

export const remarkCallout: Plugin<[], XSection> = () => {
  return (tree) => {
    visit(tree, 'directive', (node: XSection) => {
      if (!calloutTypeKeys.includes(node.name.toLowerCase().replace(/-$/, ''))) {
        return;
      }

      let collapsible = node.attributes.collapsible ?? false;
      const { children = [] } = node;

      node.name = node.name.toLowerCase();

      if (node.name.endsWith('-')) {
        collapsible = true;
        node.name = node.name.slice(0, -1);
      }

      const head: XHTMLNode = {
        type: 'html-node',
        tagName: collapsible ? 'summary' : 'div',
        attributes: {
          class: ['callout-title'],
        },
        children: [
          {
            type: 'html-node',
            tagName: 'span',
            value: calloutTypes[node.name].icon,
            attributes: {
              class: ['callout-title-icon'],
            },
          },
          {
            type: 'html-node',
            tagName: 'span',
            value: (node.attributes?.title as string) ?? calloutTypes[node.name].text,
            attributes: {
              class: ['callout-title-text'],
            },
          },
        ],
      };

      if (collapsible) {
        head.children?.push({
          type: 'html-node',
          tagName: 'span',
          value: ChevronRight,
          attributes: {
            class: ['callout-fold-icon'],
          },
        });
      }

      const body: XHTMLNode = {
        type: 'html-node',
        tagName: 'div',
        attributes: {
          class: ['callout-content'],
        },
        children,
      };

      if (!Array.isArray(node.attributes.class)) {
        node.attributes.class = [node.attributes.class].filter(Boolean);
      }

      node.attributes.class.push('callout', node.name);

      Object.assign(node.attributes, {
        'data-callout': node.name,
        'data-collapsible': collapsible ? 'true' : 'false',
      });

      delete node.attributes.title;
      delete node.attributes.collapsible;

      (node as XNode).type = 'html-node';
      (node as never as XHTMLNode).tagName = collapsible ? 'details' : 'div';
      (node as XNode).children = [head, body];
    });
  };
};
