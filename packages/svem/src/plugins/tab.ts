import type { XAttributes, XNode } from './attribute.js';
import type { XHTMLNode } from './html.js';

let tabIndex = 0;

export function createTab(children: XNode[], attrId?: string | number | XAttributes): XHTMLNode {
  if (typeof attrId !== 'object') {
    attrId = { id: attrId } as XAttributes;
  }

  if (typeof attrId.class === 'string') {
    attrId.class = attrId.class.split(' ');
  }

  const tabId = attrId.id ?? `tab-${tabIndex++}`;

  return {
    name: 'tab-list',
    type: 'html-node',
    tagName: 'div',
    attributes: {
      ...attrId,
      id: tabId,
      role: 'tablist',
      class: ['tab-list', ...((attrId.class ?? []) as string[])],
    },
    children: [
      {
        name: 'tab-button-list',
        type: 'html-node',
        tagName: 'div',
        attributes: {
          class: ['tab-button-list'],
        },
        children: children.map((child) => {
          return {
            name: 'tab-button',
            type: 'html-node',
            tagName: 'button',
            value: child.attributes.label ?? '',
            attributes: {
              id: `${tabId}-${child.attributes.id ?? ''}-button`,
              role: 'tab',
              class: ['tab-button'],
              'aria-label': child.attributes.label ?? '',
              'aria-controls': `${tabId}-${child.attributes.id ?? ''}-panel`,
              'aria-selected': child.attributes.active ? 'true' : 'false',
              'data-tab': tabId,
              'data-tab-active': child.attributes.active,
            },
          } as XHTMLNode;
        }),
      },
      ...children.map((child, i) => {
        return {
          name: 'tab-content',
          type: 'html-node',
          tagName: 'div',
          attributes: {
            id: `${tabId}-${child.attributes.id ?? i}-panel`,
            role: 'tabpanel',
            class: [
              'tab-content',
              !child.attributes.active ? 'hidden' : '',
              (child.attributes?.class as string[])?.join(' ') ?? '',
            ].filter(Boolean),
            'aria-labelledby': `${tabId}-${child.attributes.id ?? i}-button`,
            'aria-hidden': child.attributes.active ? 'false' : 'true',
            'data-tab': tabId,
            'data-tab-active': child.attributes.active,
          },
          children: [child],
        };
      }),
    ],
  };
}
