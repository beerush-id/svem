import {
  transformerNotationDiff,
  type TransformerNotationDiffOptions,
  transformerRenderWhitespace,
} from '@shikijs/transformers';
import { visit } from 'unist-util-visit';
import { type Plugin, unified } from 'unified';
import { getSingletonHighlighter, type Highlighter } from 'shiki';
import type { XAttributes, XNode } from './attribute.js';
import { escapeHtml, type XHTMLNode } from './html.js';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';

import ClipboardIcon from '../icons/clipboard.js';
import rehypeSanitize from 'rehype-sanitize';
import rehypePresetMinify from 'rehype-preset-minify';

export type XCodeNode = XNode & {
  type: 'code';
  lang: string;
  value: string;
};

export type CodeAttributes = XAttributes & {
  file?: string;
  title?: string;
};

export type CodeBlockTheme = {
  light: string;
  dark?: string;
};

export type CreateBlockOptions = {
  lang: string;
  themes: CodeBlockTheme;
  diffOptions?: TransformerNotationDiffOptions | false;
};

export type CodeHighlightOptions = Omit<CreateBlockOptions, 'lang'> & {
  langs: string[];
  themes: CodeBlockTheme;
  embedRaw?: boolean;
  transform?: (code: string) => string;
};

const inlineLang = /\{:[a-zA-Z0-9_]+}$/;
/**
 * Wrap and highlight code blocks with shiki.
 * @param {(Omit<CreateBlockOptions, 'lang'> & {langs: string[], themes: CodeBlockTheme, embedRaw?: boolean, transform?: (code: string) => string}) | void} options
 * @returns {(tree) => Promise<void>}
 */
export const remarkCodeHighlight: Plugin<[CodeHighlightOptions | void], XNode> = (options) => {
  const { themes, langs, embedRaw = false } = (options ?? {}) as CodeHighlightOptions;

  return async (tree) => {
    const hg = await getSingletonHighlighter({
      langs,
      themes: Object.entries(themes).map(([, name]) => name),
    });

    visit(tree, 'code', (node: XCodeNode) => {
      if (typeof node.attributes?.lang === 'string') {
        node.lang = node.attributes.lang;
        delete node.attributes.lang;
      }

      if (!node.lang) {
        node.lang = 'text';
      }

      if (options?.transform) {
        node.value = options.transform(node.value);
      }

      const output = highlight(hg, node.value, {
        lang: node.lang,
        themes,
      });
      const block = createWrapper(output, node.lang, node.attributes, embedRaw ? node.value : undefined);

      Object.assign(node, block);
    });

    visit(tree, 'inlineCode', (node: XNode) => {
      if (!node.value) return;

      node.type = 'html-code';

      if (!inlineLang.test(node.value)) {
        node.value = `<code class="inline-code">${escapeHtml(node.value)}</code>`;
        return;
      }

      const pattern = node.value.match(inlineLang)?.[0] ?? '';

      if (pattern) {
        const lang = pattern.slice(2, -1);
        node.value = highlight(hg, node.value.replace(pattern, '').trim(), {
          lang,
          themes,
        });
        node.value = node.value.replace(/<pre class="shiki/, '<pre class="shiki shiki-inline');
      }
    });
  };
};

export const createWrapper = (code: string, lang: string, attributes: CodeAttributes, rawCode?: string): XHTMLNode => {
  const { title, ...props } = attributes;
  const rawCodeId = `${new Date().getTime()}-${Math.random().toString(36).slice(2)}`;

  return {
    type: 'html-node',
    tagName: 'div',
    attributes: {
      ...props,
      class: 'code-block',
    },
    children: [
      {
        type: 'html-node',
        tagName: 'div',
        attributes: {
          class: 'code-block-header',
          standalone: !title,
        },
        children: [
          {
            type: 'html-node',
            tagName: 'span',
            value: title ?? '',
            attributes: {
              class: 'code-block-title',
            },
          },
          {
            type: 'html-node',
            tagName: 'div',
            attributes: {
              class: 'code-block-actions',
            },
            children: [
              {
                type: 'html-node',
                tagName: 'span',
                value: lang ?? 'text',
                attributes: {
                  class: 'code-block-lang',
                },
              },
              {
                type: 'html-node',
                tagName: 'button',
                value: ClipboardIcon,
                attributes: {
                  class: 'code-block-copy',
                  hidden: !rawCode,
                  title: 'Copy code',
                  'aria-label': 'Copy code',
                  'data-raw-code-copy': rawCodeId,
                },
              },
            ],
          },
        ],
      },
      {
        type: 'html-code',
        value: code,
        attributes: {},
      },
      {
        type: 'html-node',
        tagName: 'div',
        value: rawCode,
        escape: true,
        attributes: {
          'data-raw-code': rawCodeId,
          hidden: true,
        },
      },
    ],
  };
};

export function highlight(shiki: Highlighter, code: string, options: CreateBlockOptions): string {
  const { lang, themes } = options ?? {};
  const transformers = [transformerRenderWhitespace()];

  if (options.diffOptions !== false) {
    transformers.push(transformerNotationDiff(options.diffOptions));
  }

  const output = shiki.codeToHtml(code, {
    lang,
    themes,
    transformers,
  });

  const hast = unified().use(rehypeParse).use(rehypeSanitize).parse(output);
  escapeNodes((hast.children ?? []) as XNode[]);

  return unified().use(rehypePresetMinify).use(rehypeStringify, { allowDangerousHtml: true }).stringify(hast);
}

function escapeNodes(nodes: XNode[]) {
  for (const node of nodes) {
    if (node.type === 'element' && Array.isArray(node.children)) {
      escapeNodes(node.children);
    } else if (node.type === 'text') {
      node.value = escapeHtml(node.value ?? '');
    }
  }
}
