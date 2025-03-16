<script lang="ts">
	import { svemScript } from 'svem/css';
	import { onDestroy, onMount } from 'svelte';
	let { children } = $props();

	const helper = svemScript();

	onMount(() => {
		helper?.subscribe();
	});

	onDestroy(() => {
		helper?.unsubscribe();
	});
</script>

<div class="blog-page min-h-screen w-full p-4">
	{@render children()}
</div>
