import {
	Hct,
	blueFromArgb,
	greenFromArgb,
	redFromArgb,
	sourceColorFromImage,
	themeFromSourceColor,
} from "@material/material-color-utilities";

/**
 * 颜色工具函数 - 基于 Google Material Color Utilities（Monet）提取主题色。
 *
 * 设计目标：
 * - 一致性：与 Material Design 3 的动态色生成逻辑保持一致。
 * - 兼容性：对外仍保留旧函数签名，避免影响现有调用方。
 * - 可维护性：将“图像 -> source color -> theme palette”链路集中在本文件。
 *
 * 限制条件：
 * - 需要 CORS 支持的图像源（或同域图像）。
 * - 需要浏览器环境（HTMLImageElement + Canvas 读取能力）。
 */

/**
 * RGB 颜色值接口
 */
interface RGB {
	r: number;
	g: number;
	b: number;
}

/**
 * HSL 颜色值接口
 */
interface HSL {
	h: number;
	s: number;
	l: number;
}

/**
 * 加载图像元素并确保可用于跨域像素读取。
 * 输入：图像 URL。
 * 输出：已加载完成的 HTMLImageElement。
 * 边界：加载失败时抛出错误，由上层统一降级。
 */
async function loadImageElement(imageUrl: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";

		img.onload = () => resolve(img);
		img.onerror = () => {
			reject(new Error(`Failed to load image: ${imageUrl}`));
		};

		img.src = imageUrl;
	});
}

/**
 * 基于 Monet 的 source color 提取流程。
 * 输入：图像 URL。
 * 输出：ARGB 整数（Material Color Utilities 使用的颜色表示）。
 * 边界：跨域受限或图像不可读时抛错。
 */
async function extractMonetSourceColorFromImage(imageUrl: string): Promise<number> {
	const image = await loadImageElement(imageUrl);
	try {
		return await sourceColorFromImage(image);
	} catch {
		throw new Error(
			"CORS error: Cannot read image pixels. Image must support cross-origin access.",
		);
	}
}

/**
 * 将 RGB 转换为 HSL 颜色空间
 * 使用标准 RGB → HSL 转换算法
 * 
 * @param r 红色分量 (0-255)
 * @param g 绿色分量 (0-255)
 * @param b 蓝色分量 (0-255)
 * @returns HSL 对象，h: 0-360, s: 0-100, l: 0-100
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;

	if (max === min) {
		return { h: 0, s: 0, l: l * 100 };
	}

	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

	let h = 0;
	switch (max) {
		case r:
			h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
			break;
		case g:
			h = ((b - r) / d + 2) / 6;
			break;
		case b:
			h = ((r - g) / d + 4) / 6;
			break;
	}

	return {
		h: Math.round(h * 360),
		s: Math.round(s * 100),
		l: Math.round(l * 100),
	};
}

/**
 * 从图像 URL 中提取主要颜色
 * 
 * 算法：
 * 1. 下载图像并缩小到 50×50px
 * 2. 获取所有像素数据
 * 3. 过滤掉极端像素（透明、过亮、过暗）
 * 4. 计算平均 RGB 值
 * 
 * 性能：
 * - 采样：< 1ms
 * - 像素处理：< 3ms
 * - 总计：< 5ms
 * 
 * @param imageUrl 图像 URL（必须支持 CORS 或同域）
 * @returns Promise<RGB> 返回提取的 RGB 颜色
 */
export async function extractColorFromImage(imageUrl: string): Promise<RGB> {
	const sourceColor = await extractMonetSourceColorFromImage(imageUrl);
	return {
		r: redFromArgb(sourceColor),
		g: greenFromArgb(sourceColor),
		b: blueFromArgb(sourceColor),
	};
}

/**
 * 从图像 URL 中提取主要色相值
 * @param imageUrl 图像 URL
 * @returns Promise<number> 返回色相值 (0-360)
 */
export async function extractHueFromImage(imageUrl: string): Promise<number> {
	try {
		// Monet 流程：图像 -> source color -> theme -> primary tonal palette hue
		const sourceColor = await extractMonetSourceColorFromImage(imageUrl);
		const monetTheme = themeFromSourceColor(sourceColor);
		const hue = Math.round(monetTheme.palettes.primary.hue);

		// 防御式归一化，保证 hue 始终在 [0, 360) 区间。
		return ((hue % 360) + 360) % 360;
	} catch (error) {
		console.error("Failed to extract hue from image:", error);
		// 返回默认色相
		return 235;
	}
}

/**
 * 判断颜色是否过于饱和或淡化，如果是则调整色相
 * @param hue 色相值
 * @param saturation 饱和度
 * @param lightness 亮度
 * @returns 调整后的色相值
 */
export function adjustHueIfNeeded(
	hue: number,
	saturation: number,
	lightness: number
): number {
	// 兼容旧调用场景：当外部仍按 HSL 做约束时，保留原逻辑。
	// 如果饱和度过低（灰色），使用默认蓝色
	if (saturation < 15) {
		return 235;
	}

	// 如果亮度过高或过低，稍微调整色相使其更适合作为主题色
	if (lightness > 85 || lightness < 15) {
		// 略微增加饱和度效果，保持原色相
		return hue;
	}

	return hue;
}

/**
 * 获取 Monet 的 HCT 色相值。
 * 输入：ARGB 颜色整数。
 * 输出：HCT hue（0-360）。
 */
export function getHctHueFromArgb(argb: number): number {
	return Hct.fromInt(argb).hue;
}
