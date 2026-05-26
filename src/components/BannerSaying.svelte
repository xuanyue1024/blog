<script lang="ts">
	import { onMount } from "svelte";

	export let api = "https://uapis.cn/api/v1/saying";

	let sayingText = "";

	type SayingResponse = {
		text?: string;
	};

	/**
	 * 功能概述：从一言接口拉取文案并渲染到横幅中央。
	 * 输入：api（一言接口地址）。
	 * 输出：更新组件内部 sayingText 状态用于界面展示。
	 * 边界条件：接口异常、超时、返回结构不合法时不展示任何文本。
	 * 副作用：发起一次网络请求并读取远端响应。
	 */
	async function loadSaying(): Promise<void> {
		const controller = new AbortController();
		const timeoutId = window.setTimeout(() => controller.abort(), 3500);

		try {
			const response = await fetch(api, {
				method: "GET",
				signal: controller.signal,
			});

			if (!response.ok) {
				return;
			}

			const data = (await response.json()) as SayingResponse;
			const text = typeof data.text === "string" ? data.text.trim() : "";
			sayingText = text;
		} catch {
			sayingText = "";
		} finally {
			window.clearTimeout(timeoutId);
		}
	}

	onMount(() => {
		void loadSaying();
	});
</script>

{#if sayingText}
	<div class="banner-saying-mask pointer-events-none" aria-live="polite">
		<p class="banner-saying-text">{sayingText}</p>
	</div>
{/if}

<style>
	.banner-saying-mask {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		padding: 0 1.25rem;
		z-index: 20;
	}

	.banner-saying-text {
		margin: 0;
		max-width: min(90vw, 54rem);
		text-align: center;
		line-height: 1.75;
		letter-spacing: 0.03em;
		font-size: clamp(1rem, 1.4vw, 1.35rem);
		font-weight: 600;
		color: rgb(255 255 255 / 0.96);
		text-shadow:
			0 2px 8px rgb(0 0 0 / 0.38),
			0 1px 1px rgb(0 0 0 / 0.3);
		padding: 0.7rem 1.05rem;
		border-radius: 0.75rem;
		background: linear-gradient(120deg, rgb(0 0 0 / 0.2), rgb(0 0 0 / 0.12));
		backdrop-filter: blur(1.5px);
	}

	@media (max-width: 768px) {
		.banner-saying-text {
			line-height: 1.6;
			font-size: clamp(0.95rem, 3.3vw, 1.1rem);
		}
	}
</style>
