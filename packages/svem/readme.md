# Svem

Svem is a preprocessor for Svelte in Markdown. It allows you to write Svelte components in Markdown files. Insipired by Vitepress, Svem aims to provide a simple and easy way to write Svelte components in Markdown files.

[preview.webm](https://github.com/beerush-id/svem/blob/main/assets/preview.webm)

## Installation

```bash
bun add -d svem
```

## Usage

To use Svem, update your `svelte.config.js` file to to include `svem` in the preprocess array.

```javascript
import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { svem } from 'svem';

const config = {
	preprocess: [vitePreprocess(), svem()],
	kit: {
		adapter: adapter()
	},
	extensions: ['.svelte', '.svem', '.svx']
};

export default config;
```

## Features

- Supports Svelte syntax highlighting.
- Supports markdown syntax highlighting.
- Write Svelte components in Markdown files.
- Frontmatter.
- Code blocks.
- Code highlighting (using Shiki).
- Inline code highlighting.
- Code group blocks
- Code preview blocks
- Callout blocks (tip, note, important, warning, caution).
- Layouts.
- Heading links generation and injection.

> Note:
> Only one script tag is allowed in a Svem file.

To make working with Svem easier, you can use the [Svem VSCode extension](https://marketplace.visualstudio.com/items?itemName=beerush.svem). It provides syntax highlighting, snippets, and basic intellisense for Svem files.
