import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import { dirname, resolve } from 'path';
import { existsSync, readFileSync } from 'node:fs';
import type { XNode } from './attribute.js';
import type { XCodeNode } from './code-highlight.js';

export type CodeImportOptions = {
  cwd?: string;
  fileAsTitle?: boolean;
  transform?: (code: string) => string;
};
export const remarkCodeImport: Plugin<[CodeImportOptions | undefined], XNode> = (options) => {
  return (tree, file) => {
    visit(tree, 'code', (node: XCodeNode) => {
      if (typeof node.attributes?.file === 'string') {
        const baseDir = dirname(options?.cwd ?? file.path);
        const filePath = resolve(baseDir, node.attributes.file);

        if (existsSync(filePath)) {
          if (options?.fileAsTitle && !node.attributes.title) {
            node.attributes.title = node.attributes.file;
          }

          node.value = readFileSync(filePath, 'utf-8').trim();

          if (options?.transform) {
            node.value = options.transform(node.value);
          }

          delete node.attributes.file;
        } else {
          console.warn(`⚠️ [CODE-IMPORT-ERROR] File not found: ${filePath}`);
        }
      }
    });
  };
};
