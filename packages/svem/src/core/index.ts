import { type Plugin, type Settings, unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMatter from 'remark-frontmatter';
import remarkRehype from 'remark-rehype';
import rehypeCallouts from 'rehype-callouts';
import rehypeStringify from 'rehype-stringify';
import { VFile } from 'vfile';
import {
  type CodeHighlightOptions,
  type CodeImportOptions,
  type HeadingLinkOptions,
  remarkAttributes,
  remarkCallout,
  remarkCodeGroup,
  remarkCodeHighlight,
  remarkCodeImport,
  remarkCodePreview,
  remarkDeepParse,
  remarkDirective,
  remarkDirectiveEject,
  remarkFlatMatter,
  remarkHeadingLink,
  remarkHeadingSection,
  type SectionOptions,
} from '../plugins/index.js';
import { remarkHtmlNodes } from '../plugins/html.js';

export type SvemOptions = {
  decoder?: Array<[Plugin, Settings] | Plugin>;
  encoder?: Array<[Plugin, Settings] | Plugin>;
  remark?: Array<[Plugin, Settings] | Plugin>;
  rehype?: Array<[Plugin, Settings] | Plugin>;
  codeImport?: CodeImportOptions;
  codeHighlight?: CodeHighlightOptions & {
    theme?: string;
  };
  headingLinks?: HeadingLinkOptions;
  headingSections?: SectionOptions | boolean;
  extensions?: string[];
  brandAlias?: string;
};

const defaultHighlightOptions: CodeHighlightOptions = {
  langs: [
    'javascript',
    'typescript',
    'jsx',
    'html',
    'css',
    'json',
    'bash',
    'shell',
    'yaml',
    'markdown',
    'mdx',
    'svelte',
    'sql',
  ],
  themes: {
    light: 'catppuccin-latte',
    dark: 'catppuccin-mocha',
  },
};

const defaultHeadingLinkOptions: HeadingLinkOptions = {
  depths: [2, 3],
};

const rehypeOptions = {
  allowDangerousHtml: true,
  allowDangerousCharacters: true,
  entities: {
    useNamedReferences: true,
  },
};

export async function transform(content: string, filename: string, options?: SvemOptions) {
  if (options?.codeHighlight?.theme) {
    options.codeHighlight.themes = {
      light: options.codeHighlight.theme,
    };
  }

  const remark = unified()
    .use(remarkParse) // Parse markdown.
    .use(remarkDeepParse)
    .use(remarkFlatMatter) // Extract frontmatter into file.data.
    .use(remarkDirective) // Custom directive support.
    .use(remarkAttributes); // Parse meta attributes.

  if (Array.isArray(options?.decoder)) {
    for (const plugin of options?.decoder ?? []) {
      if (Array.isArray(plugin)) {
        remark.use(plugin[0], plugin[1] as never);
      } else {
        remark.use(plugin);
      }
    }
  }

  remark
    .use(remarkMatter) // Frontmatter support.
    .use(remarkGfm) // GitHub Flavored Markdown support.
    .use(remarkCodeImport, options?.codeImport) // Import code block from file.
    .use(remarkCodePreview) // Code preview directive.
    .use(remarkCodeGroup)
    .use(remarkCallout)
    .use(remarkCodeHighlight, {
      ...defaultHighlightOptions,
      ...options?.codeHighlight,
    }) // Highlight code blocks.
    .use(remarkHeadingLink, {
      ...defaultHeadingLinkOptions,
      ...options?.headingLinks,
    });

  if (Array.isArray(options?.remark)) {
    for (const plugin of options?.remark ?? []) {
      if (Array.isArray(plugin)) {
        remark.use(plugin[0], plugin[1] as never);
      } else {
        remark.use(plugin);
      }
    }
  }

  // Add heading sections support.
  if (options?.headingSections) {
    remark.use(remarkHeadingSection, typeof options.headingSections === 'object' ? options.headingSections : undefined);
  }

  remark
    .use(remarkDirectiveEject) // Eject directive nodes to flatten them back.
    .use(remarkHtmlNodes, { brandAlias: options?.brandAlias }); // Flatten HTML nodes.

  if (Array.isArray(options?.encoder)) {
    for (const plugin of options?.encoder ?? []) {
      if (Array.isArray(plugin)) {
        remark.use(plugin[0], plugin[1] as never);
      } else {
        remark.use(plugin);
      }
    }
  }

  const rehype = remark
    .use(remarkRehype, rehypeOptions)
    .use(rehypeCallouts)
    .use(() => {
      return () => {
        // console.log(tree);
      };
    });

  if (Array.isArray(options?.rehype)) {
    for (const plugin of options?.rehype ?? []) {
      if (Array.isArray(plugin)) {
        rehype.use(plugin[0], plugin[1] as never);
      } else {
        rehype.use(plugin);
      }
    }
  }

  rehype.use(rehypeStringify, rehypeOptions);

  const file = new VFile({ value: content, path: filename });
  // eslint-disable-next-line prefer-const
  let { value: code, data } = (await rehype.process(file)) as { value: string; data: Record<string, unknown> };

  code = code.replace(/&#x26;/g, '&').replace(/&#38\s?/g, '&');

  return { code, data } as { code: string; data: Record<string, unknown> };
}
