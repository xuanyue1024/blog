<script lang="ts">
	import { onMount } from "svelte";

	let loaded = false;

	/**
	 * 扫描当前文档中的 Mermaid 占位节点并执行渲染。
	 * 仅在文章页挂载该组件时才执行，避免全站页面无意义注入。
	 */
	async function renderMermaidBlocks() {
		const targets = Array.from(
			document.querySelectorAll<HTMLElement>(".mermaid-diagram[data-mermaid-source]"),
		);
		if (targets.length === 0) {
			return;
		}

		const { default: mermaid } = await import("mermaid");
		mermaid.initialize({
			startOnLoad: false,
			securityLevel: "loose",
			theme: document.documentElement.classList.contains("dark") ? "dark" : "default",
			themeVariables: {
				background: "transparent",
			},
		});

		for (const [index, element] of targets.entries()) {
			const source = element.dataset.mermaidSource?.trim();
			if (!source) {
				continue;
			}

			const fallback = element.querySelector<HTMLElement>(".mermaid-fallback");
			try {
				const id = `mermaid-${index}-${Math.random().toString(36).slice(2)}`;
				const { svg } = await mermaid.render(id, source);
				element.innerHTML = svg;
			} catch {
				if (fallback) {
					fallback.style.display = "block";
				}
			}
		}
	}

	onMount(() => {
		if (loaded) {
			return;
		}
		loaded = true;
		void renderMermaidBlocks();
	});
</script>
