<script lang="ts">
	import { onMount } from 'svelte';

	let mounted = false;

	onMount(() => {
		mounted = true;

		// 加载 giscus 脚本
		const script = document.createElement('script');
		script.src = 'https://giscus.app/client.js';
		script.setAttribute('data-repo', 'xuanyue1024/xuanyue1024.github.io');
		script.setAttribute('data-repo-id', 'R_kgDONx7jdQ');
		script.setAttribute('data-category', 'Announcements');
		script.setAttribute('data-category-id', 'DIC_kwDONx7jdc4CrpVg');
		script.setAttribute('data-mapping', 'pathname');
		script.setAttribute('data-strict', '1');
		script.setAttribute('data-reactions-enabled', '1');
		script.setAttribute('data-emit-metadata', '0');
		script.setAttribute('data-input-position', 'top');
		script.setAttribute('data-theme', isDarkMode() ? 'dark' : 'light');
		script.setAttribute('data-lang', 'zh-CN');
		script.setAttribute('crossorigin', 'anonymous');
		script.async = true;

		document.getElementById('giscus-container')?.appendChild(script);

		// 监听主题变化
		const observer = new MutationObserver(() => {
			updateGiscusTheme();
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class'],
		});

		return () => {
			observer.disconnect();
		};
	});

	function isDarkMode(): boolean {
		return document.documentElement.classList.contains('dark');
	}

	function updateGiscusTheme() {
		const isDark = isDarkMode();
		const giscusFrame = document.querySelector('iframe.giscus-frame');
		if (giscusFrame) {
			giscusFrame.contentWindow.postMessage(
				{ giscus: { setConfig: { theme: isDark ? 'dark' : 'light' } } },
				'https://giscus.app'
			);
		}
	}
</script>

<div id="giscus-container" />
