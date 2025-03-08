import { type MarkidownOptions, transform } from './core/index.js';
import { parse, type PreprocessorGroup } from 'svelte/compiler';
import { remarkSvelteEscape, remarkSvelteParse } from './plugins/index.js';
import type { Plugin } from 'unified';

export const LAYOUT_DATA_TOKEN = '__svemLayoutData';
export const LAYOUT_WRAP_TOKEN = 'MarkidownLayout';
export const LAYOUT_META_TOKEN = 'meta';

export type LayoutOptions = {
  default?: string;
} & {
  [key: string]: string;
};

export type SvelteMarkidownOptions = MarkidownOptions & {
  layout?: string;
  layouts?: LayoutOptions;
  annotateScript?: boolean;
  annotateOpen?: string;
  annotateClose?: string;
};

export const svem = (options?: SvelteMarkidownOptions): PreprocessorGroup => {
  const { extensions = ['.svem', '.svx'] } = options ?? {};

  return {
    name: 'svem',
    async markup({ content, filename }: Record<string, string>) {
      if (extensions.some((ext) => filename.endsWith(ext))) {
        const layouts = await resolveLayouts(options);

        if (options?.annotateScript) {
          content = transformScripts(content, options?.annotateOpen, options?.annotateClose);
        }

        // eslint-disable-next-line prefer-const
        let { code, data } = await transform(content, filename, {
          ...options,
          decoder: [remarkSvelteParse as Plugin, ...(options?.decoder ?? [])],
          encoder: [remarkSvelteEscape as Plugin, ...(options?.encoder ?? [])],
        });

        code = wrapLayout(code, layouts, data);

        if (code.match(/\$svem\(\)/g)) {
          code = code.replace(/globalThis\.\$svem\(\)/g, LAYOUT_DATA_TOKEN).replace(/\$svem\(\)/g, LAYOUT_DATA_TOKEN);
        }

        return { code };
      }
    },
  };
};

type LayoutRef = {
  tag: string;
  openingTag: string;
  closingTag: string;
  path: string;
  script: string;
};

type Layouts = {
  default: LayoutRef;
} & {
  [key: string]: LayoutRef;
};

function wrapLayout(code: string, layouts: Layouts, data: Record<string, unknown>) {
  const outputData = { ...data, ...(data[LAYOUT_META_TOKEN] as Record<string, unknown>) };
  delete outputData[LAYOUT_META_TOKEN];

  const layout = layouts[(data?.[LAYOUT_META_TOKEN] as Record<string, string>)?.layout as string] ?? layouts.default;

  let output = code;
  const ast = parse(output);
  const template = output.slice(ast.html.start, ast.html.end);

  const { start = 0, end = 0 } = ast.module ?? {};

  let outScript = '<script lang="ts" module>\n</script>';
  let rawScript = '';

  if (end > start) {
    rawScript = output.slice(start, end);
    outScript = rawScript;
  }

  outScript = outScript.replace(/<\/script>$/, (match) => {
    return `const ${LAYOUT_DATA_TOKEN} = ${JSON.stringify(outputData)};\n${match}`;
  });

  if (layout) {
    const openingTag = `<${layout.tag} {...${LAYOUT_DATA_TOKEN}}>`;
    const closingTag = `</${layout.tag}>`;

    const wrapped = `${openingTag}\n${template}\n${closingTag}`;
    output = output.replace(template, wrapped);

    outScript = outScript.replace(/^<script(?:\s+lang="(?:ts|js)")?(?:\s+module)?\s*>/, (match) => {
      return `${match}\n${layout.script}`;
    });
  }

  if (rawScript) {
    output = output.replace(rawScript, outScript);
  } else {
    output = `${outScript}\n${output}`;
  }

  return output;
}

async function resolveLayouts(options: SvelteMarkidownOptions = {}) {
  const { layout: layoutInput, layouts: layoutInputs = {} } = (options ?? {}) as SvelteMarkidownOptions;
  const layouts: Layouts = {} as never;

  if (layoutInput) {
    layoutInputs.default = layoutInput;
  }

  for (const [name, path] of Object.entries(layoutInputs)) {
    if (typeof path === 'string') {
      const tag = `${LAYOUT_WRAP_TOKEN}${toTitleCase(name)}`;

      layouts[name] = {
        tag,
        path,
        script: `import ${tag} from '${path}';\n`,
        openingTag: `<${tag}>`,
        closingTag: `</${tag}>`,
      };
    }
  }

  return layouts;
}

function toTitleCase(text: string): string {
  const words = text.match(/\w+/g) ?? [];
  return words.map((word) => word.replace(/^\w/, (c) => c.toUpperCase())).join('');
}

function annotationOpenRegex(open = '--', close = '--'): RegExp {
  return new RegExp(`${open}(script|style)(?:\\s+[^${close}]+)?\\s*${close}`, 'i');
}

function annotationCloseRegex(open = '--', close = '--'): RegExp {
  return new RegExp(`${open}/(script|style)${close}`, 'i');
}

function transformScripts(content: string, open = '--', close = '--') {
  return content
    .replace(annotationOpenRegex(open, close), (match) => {
      return match.replace(new RegExp(`^${open}`), '<').replace(new RegExp(`${close}$`), '>');
    })
    .replace(annotationCloseRegex(open, close), (match) => {
      return match.replace(new RegExp(`^${open}`), '<').replace(new RegExp(`${close}$`), '>');
    });
}
