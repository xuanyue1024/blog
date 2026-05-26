import {
	AUTO_MODE,
	DARK_MODE,
	DEFAULT_THEME,
	LIGHT_MODE,
} from "@constants/constants.ts";
import { expressiveCodeConfig } from "@/config";
import type { LIGHT_DARK_MODE } from "@/types/config";

const DYNAMIC_THEME_COLOR_STORAGE_KEY = "dynamicThemeColor";

/**
 * 将 localStorage 或 dataset 中的字符串布尔值解析为布尔类型。
 * 输入："true" / "false" / 其他字符串 / undefined。
 * 输出：true / false / null（无法识别时）。
 */
function parseBoolean(value: string | undefined): boolean | null {
	if (value === "true") {
		return true;
	}
	if (value === "false") {
		return false;
	}
	return null;
}

/**
 * 读取服务端注入到 DOM 的配置载体。
 * 副作用：无；仅访问当前文档中的 `#config-carrier`。
 */
function getConfigCarrier(): HTMLElement | null {
	return document.getElementById("config-carrier");
}

/**
 * 判断 banner 是否启用。
 * 边界：当配置载体不存在时，按 false 处理，避免误启用动态取色。
 */
function isBannerEnabled(): boolean {
	const configCarrier = getConfigCarrier();
	return configCarrier?.dataset.bannerEnabled === "true";
}

/**
 * 返回动态取色能力是否可用（当前由 banner 开关决定）。
 */
export function isDynamicThemeColorAvailable(): boolean {
	return isBannerEnabled();
}

export function getDefaultHue(): number {
	const fallback = "250";
	const configCarrier = getConfigCarrier();
	return Number.parseInt(configCarrier?.dataset.hue || fallback, 10);
}

export function getHue(): number {
	const stored = localStorage.getItem("hue");
	return stored ? Number.parseInt(stored, 10) : getDefaultHue();
}

export function setHue(hue: number): void {
	localStorage.setItem("hue", String(hue));
	const r = document.querySelector(":root") as HTMLElement;
	if (!r) {
		return;
	}
	r.style.setProperty("--hue", String(hue));
}

/**
 * 获取配置中的默认动态取色开关。
 * 仅当 banner.enable=true 时才允许动态取色。
 */
export function getDefaultDynamicThemeColorEnabled(): boolean {
	if (!isBannerEnabled()) {
		return false;
	}

	const configCarrier = getConfigCarrier();
	return configCarrier?.dataset.dynamicThemeColor === "true";
}

/**
 * 动态取色最终开关：本地存储优先；没有本地值时回退到配置值。
 * 同时强制受 banner.enable 约束。
 */
export function getDynamicThemeColorEnabled(): boolean {
	if (!isBannerEnabled()) {
		return false;
	}

	const stored = parseBoolean(
		localStorage.getItem(DYNAMIC_THEME_COLOR_STORAGE_KEY) ?? undefined,
	);
	return stored ?? getDefaultDynamicThemeColorEnabled();
}

/**
 * 设置动态取色开关并广播变更事件，供主题提取器即时响应。
 */
export function setDynamicThemeColorEnabled(enabled: boolean): void {
	localStorage.setItem(DYNAMIC_THEME_COLOR_STORAGE_KEY, String(enabled));
	window.dispatchEvent(
		new CustomEvent("dynamic-theme-color-change", {
			detail: { enabled },
		}),
	);
}

export function applyThemeToDocument(theme: LIGHT_DARK_MODE) {
	switch (theme) {
		case LIGHT_MODE:
			document.documentElement.classList.remove("dark");
			break;
		case DARK_MODE:
			document.documentElement.classList.add("dark");
			break;
		case AUTO_MODE:
			if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
				document.documentElement.classList.add("dark");
			} else {
				document.documentElement.classList.remove("dark");
			}
			break;
	}

	// Set the theme for Expressive Code
	document.documentElement.setAttribute(
		"data-theme",
		expressiveCodeConfig.theme,
	);
}

export function setTheme(theme: LIGHT_DARK_MODE): void {
	localStorage.setItem("theme", theme);
	applyThemeToDocument(theme);
}

export function getStoredTheme(): LIGHT_DARK_MODE {
	return (localStorage.getItem("theme") as LIGHT_DARK_MODE) || DEFAULT_THEME;
}
