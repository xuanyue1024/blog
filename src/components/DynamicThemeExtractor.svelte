<script lang="ts">
	/**
	 * 动态主题提取器 - Material Design 3 动态色彩
	 * 
	 * 功能：从 banner 图像中提取主要颜色，应用到页面主题
	 * 性能：一次性操作，总耗时 < 10ms，结果缓存到 localStorage
	 * 兼容：仅在支持 Canvas API 的浏览器中运行
	 */

	import { onMount } from "svelte";
	import { extractHueFromImage } from "../utils/color-utils";
	import {
		getDynamicThemeColorEnabled,
		setHue,
	} from "../utils/setting-utils";

	/** banner 图像 URL */
	export let bannerSrc: string = "";

	let isExtracting = false;
	
	// 仅在开发环境输出日志
	const isDev = import.meta.env.DEV;
	const log = (...args: unknown[]) => isDev && console.log("[DynamicTheme]", ...args);
	const error = (...args: unknown[]) => isDev && console.error("[DynamicTheme]", ...args);

	/**
	 * 读取动态取色最终开关。
	 * 规则：严格遵循“本地优先 + 配置回退 + banner 约束”。
	 * 说明：不能再叠加额外硬门禁，否则会破坏本地开关的最高优先级。
	 */
	function isDynamicColorEnabled() {
		return getDynamicThemeColorEnabled();
	}

	/**
	 * 将色相值应用到主题
	 * @param hue 色相值 (0-360)
	 */
	function applyHueToTheme(hue: number) {
		setHue(hue);
		const configCarrier = document.getElementById("config-carrier");
		if (configCarrier) {
			configCarrier.setAttribute("data-hue", hue.toString());
		}
		log(`Applied hue: ${hue}`);
	}

	/**
	 * 从 banner 图像中提取色相并应用到主题
	 */
	async function extractAndApplyTheme() {
		if (!isDynamicColorEnabled() || !bannerSrc || isExtracting) {
			return;
		}

		isExtracting = true;
		const startTime = performance.now();

		try {
			log("Extracting color from:", bannerSrc);
			const hue = await extractHueFromImage(bannerSrc);
			if (!isDynamicColorEnabled()) {
				log("Dynamic color disabled before apply, skip hue update");
				return;
			}
			const duration = (performance.now() - startTime).toFixed(2);
			log(`Extracted hue: ${hue} (${duration}ms)`);
			applyHueToTheme(hue);
		} catch (err) {
			error("Failed to extract color:", err);
		} finally {
			isExtracting = false;
		}
	}

	/**
	 * 监听 banner 图像的加载完成
	 * 支持多个 DOM 选择器路径（Astro Image vs 普通 img）
	 */
	function watchBannerImage() {
		let bannerImg: HTMLImageElement | null = 
			document.querySelector("#banner-wrapper img") ??
			document.querySelector("#banner img") ??
			document.querySelector("picture img");

		if (!bannerImg) {
			log("Waiting for banner image...");
			requestAnimationFrame(watchBannerImage);
			return;
		}

		log("Found banner image:", bannerImg.src);

		if (bannerImg.complete && bannerImg.naturalHeight !== 0) {
			log("Image already loaded, extracting...");
			extractAndApplyTheme();
		} else {
			log("Waiting for image load event...");
			const onLoad = () => {
				log("Image loaded, extracting...");
				extractAndApplyTheme();
				bannerImg?.removeEventListener("load", onLoad);
				bannerImg?.removeEventListener("error", onError);
			};
			const onError = () => {
				error("Failed to load banner image:", bannerImg?.src);
				bannerImg?.removeEventListener("load", onLoad);
				bannerImg?.removeEventListener("error", onError);
			};
			bannerImg.addEventListener("load", onLoad);
			bannerImg.addEventListener("error", onError);
		}
	}

	/**
	 * 组件挂载 - 初始化监听
	 */
	onMount(() => {
		log("Component mounted", { bannerSrc });
		
		if (!isDynamicColorEnabled()) {
			log("Dynamic color disabled via config");
			// 即使初始关闭，也要监听后续开关变化
		}
		
		if (!bannerSrc) {
			log("No banner source provided");
			return;
		}

		/**
		 * 仅在动态取色开启时执行图片监听与取色。
		 * 副作用：可能触发一次 hue 更新（写入 localStorage + CSS 变量）。
		 */
		const runWhenEnabled = () => {
			if (!isDynamicColorEnabled()) {
				return;
			}
			log("Starting banner detection...");
			watchBannerImage();
		};

		// 延迟启动以确保 DOM 完全渲染
		// 使用 200ms 延迟给 Astro 的 swup 过渡留有余量
		const timer = setTimeout(runWhenEnabled, 200);
		// 监听设置面板开关变化：用户开启动态取色后，无需刷新页面即可触发提取。
		const onDynamicChange = () => runWhenEnabled();
		window.addEventListener("dynamic-theme-color-change", onDynamicChange);

		return () => {
			clearTimeout(timer);
			window.removeEventListener("dynamic-theme-color-change", onDynamicChange);
		};
	});
</script>

<!-- 纯逻辑组件，无 render -->
