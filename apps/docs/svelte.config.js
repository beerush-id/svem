import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { svem } from 'svem';

const dev = process.env.NODE_ENV === 'development';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess(), svem()],

	kit: {
		paths: {
			base: dev ? '' : '/svem'
		},
		adapter: adapter()
	}
};

export default config;
