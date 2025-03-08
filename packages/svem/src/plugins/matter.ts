import { matter } from 'vfile-matter';
import type { Plugin } from 'unified';
import type { XNode } from './attribute.js';

export const remarkFlatMatter: Plugin<[], XNode> = () => {
  return (tree, file) => {
    matter(file);

    Object.assign(file.data, file.data.matter ?? {});
    delete file.data.matter;
  };
};
