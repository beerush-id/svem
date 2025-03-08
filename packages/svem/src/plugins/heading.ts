import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { XNode } from './attribute.js';
import type { XHTMLNode } from './html.js';

export type XHeading = XNode & {
  depth: number;
  children: XNode[];
};

export type XHTMLHeading = XHeading & XHTMLNode;

export type HeadLink = {
  text: string;
  slug: string;
  level: number;
};

export type HeadingLinkOptions = {
  depths: number[];
  lower?: boolean;
};

/**
 * Add a slug to headings and store them in the file data.
 * @param {HeadingLinkOptions} options
 * @returns {(tree, file) => void}
 */
export const remarkHeadingLink: Plugin<[HeadingLinkOptions], XNode> = (options) => {
  return (tree, file) => {
    const headings: HeadLink[] = [];

    visit(tree, 'heading', (node: XHeading) => {
      if (options.depths.includes(node.depth)) {
        const text = node.children
          .map((n) => {
            return (n as { value: string }).value;
          })
          .join('');

        const slug = slugify(text, options);
        headings.push({ text, slug, level: node.depth });

        node.data = node.data || {};
        node.data.hProperties = { id: slug };
      }
    });

    file.data.headings = headings;
  };
};

export function slugify(text: string, options?: { lower?: boolean }): string {
  const words = text.match(/\w+/g);
  let slug = (words ?? []).join('-');

  if (options?.lower ?? true) {
    slug = slug.toLowerCase();
  }

  return slug;
}
