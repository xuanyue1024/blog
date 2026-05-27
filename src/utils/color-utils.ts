import {
	blueFromArgb,
	greenFromArgb,
	Hct,
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

type BannerPosition = "top" | "center" | "bottom";

/**
 * 裁剪区域描述。
 * 这里存的是原图坐标系中的矩形，而不是屏幕坐标。
 * 这样后续无论是画到 canvas 还是做其他图像处理，都可以直接复用这个结果。
 */
interface CropRect {
	x: number;
	y: number;
	width: number;
	height: number;
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
async function extractMonetSourceColorFromImage(
	imageUrl: string,
): Promise<number> {
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
 * 将图片在页面上的可见区域，换算成“原图里应该截取哪一块”的矩形。
 *
 * 为什么要单独拆出来：
 * - 取色逻辑关心的是“看得到的部分”，不是展示过程本身；
 * - 这里的计算会同时被宽高、缩放比例、object-position 影响，逻辑偏密集，单独封装后更容易验证。
 *
 * 输入：
 * - image: 已加载完成的原图。
 * - viewportWidth / viewportHeight: 页面上 banner 实际可见区域的尺寸。
 * - position: 纵向对齐方式，只处理 top / center / bottom。
 *
 * 输出：
 * - 原图坐标系中的裁剪矩形。
 *
 * 边界：
 * - 图片未加载或容器尺寸无效时直接抛错；
 * - 由上层统一捕获并回退默认色相。
 */
function calculateVisibleBannerCropRect(
	image: HTMLImageElement,
	viewportWidth: number,
	viewportHeight: number,
	position: BannerPosition = "center",
): CropRect {
	if (!image.naturalWidth || !image.naturalHeight) {
		throw new Error("Image is not loaded or has no intrinsic size.");
	}

	if (viewportWidth <= 0 || viewportHeight <= 0) {
		throw new Error("Viewport size is invalid.");
	}

	// banner 使用 object-cover：先按“填满容器”的规则求缩放比例，
	// 之后再根据对齐方式，决定原图裁剪窗口应该从哪里开始。
	const scale = Math.max(
		viewportWidth / image.naturalWidth,
		viewportHeight / image.naturalHeight,
	);
	const renderedWidth = image.naturalWidth * scale;
	const renderedHeight = image.naturalHeight * scale;

	// 由于 cover 会超出容器，超出的部分就是实际没有显示出来的区域。
	const overflowX = Math.max(0, renderedWidth - viewportWidth);
	const overflowY = Math.max(0, renderedHeight - viewportHeight);

	// 当前实现只支持纵向 top / center / bottom，所以水平方向默认居中。
	const offsetX = overflowX / 2;
	const offsetY =
		position === "top" ? 0 : position === "bottom" ? overflowY : overflowY / 2;

	return {
		x: offsetX / scale,
		y: offsetY / scale,
		width: viewportWidth / scale,
		height: viewportHeight / scale,
	};
}

/**
 * 从 Monet 生成的 source color 推导最终要用的色相。
 *
 * 这个 helper 的存在主要是为了消除重复：
 * - 先把 source color 交给 Material Color Utilities；
 * - 再读取 primary tonal palette 的 hue；
 * - 最后做一次归一化，保证结果落在 [0, 360) 区间。
 */
function getNormalizedHueFromSourceColor(sourceColor: number): number {
	const monetTheme = themeFromSourceColor(sourceColor);
	const hue = Math.round(monetTheme.palettes.primary.hue);
	return ((hue % 360) + 360) % 360;
}

/**
 * 将 HTMLImageElement 的“可见区域”裁剪出来，并按同样的色彩流程提取 source color。
 * 输入：已加载的图片、可视区域尺寸、object-position 方向。
 * 输出：ARGB 整数。
 * 边界：当尺寸非法或图片尚未加载完成时抛错，由上层降级处理。
 */
async function extractMonetSourceColorFromVisibleImage(
	image: HTMLImageElement,
	viewportWidth: number,
	viewportHeight: number,
	position: BannerPosition = "center",
): Promise<number> {
	const cropRect = calculateVisibleBannerCropRect(
		image,
		viewportWidth,
		viewportHeight,
		position,
	);

	const sampleCanvas = document.createElement("canvas");
	sampleCanvas.width = 50;
	sampleCanvas.height = 50;
	// 这里选择固定 50×50 的采样画布，是为了把像素分析成本稳定压到很低。
	// 真实图片可能很大，但动态取色只需要一个“代表性颜色”，不需要逐像素处理整张图。
	const context = sampleCanvas.getContext("2d", { willReadFrequently: true });

	if (!context) {
		throw new Error("Failed to get canvas context.");
	}

	context.drawImage(
		image,
		cropRect.x,
		cropRect.y,
		cropRect.width,
		cropRect.height,
		0,
		0,
		sampleCanvas.width,
		sampleCanvas.height,
	);

	const imageData = context.getImageData(
		0,
		0,
		sampleCanvas.width,
		sampleCanvas.height,
	);
	const pixels = imageData.data;

	let totalWeight = 0;
	let redTotal = 0;
	let greenTotal = 0;
	let blueTotal = 0;

	for (let index = 0; index < pixels.length; index += 4) {
		const alpha = pixels[index + 3];
		if (alpha < 128) {
			continue;
		}

		const red = pixels[index];
		const green = pixels[index + 1];
		const blue = pixels[index + 2];
		const brightness = (red + green + blue) / 3;
		if (brightness < 30 || brightness > 225) {
			continue;
		}

		const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);
		const weight = Math.max(1, saturation);
		redTotal += red * weight;
		greenTotal += green * weight;
		blueTotal += blue * weight;
		totalWeight += weight;
	}

	if (totalWeight === 0) {
		throw new Error("No valid pixels found in visible banner area.");
	}

	const averageRed = Math.round(redTotal / totalWeight);
	const averageGreen = Math.round(greenTotal / totalWeight);
	const averageBlue = Math.round(blueTotal / totalWeight);

	return (
		((255 << 24) | (averageRed << 16) | (averageGreen << 8) | averageBlue) >>> 0
	);
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
	const red = r / 255;
	const green = g / 255;
	const blue = b / 255;

	const max = Math.max(red, green, blue);
	const min = Math.min(red, green, blue);
	const l = (max + min) / 2;

	if (max === min) {
		return { h: 0, s: 0, l: l * 100 };
	}

	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

	let h = 0;
	switch (max) {
		case red:
			h = ((green - blue) / d + (green < blue ? 6 : 0)) / 6;
			break;
		case green:
			h = ((blue - red) / d + 2) / 6;
			break;
		case blue:
			h = ((red - green) / d + 4) / 6;
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
 * 从“可见的 banner 区域”提取主要色相值。
 * 输入：已加载图片、banner 显示区域尺寸、object-position 方向。
 * 输出：色相值 (0-360)。
 * 边界：失败时回退到默认色相，避免阻塞页面主题渲染。
 */
export async function extractHueFromVisibleImage(
	image: HTMLImageElement,
	viewportWidth: number,
	viewportHeight: number,
	position: BannerPosition = "center",
): Promise<number> {
	try {
		const sourceColor = await extractMonetSourceColorFromVisibleImage(
			image,
			viewportWidth,
			viewportHeight,
			position,
		);
		return getNormalizedHueFromSourceColor(sourceColor);
	} catch (error) {
		console.error("Failed to extract hue from visible image:", error);
		return 235;
	}
}

/**
 * 从图像 URL 中提取主要色相值
 * @param imageUrl 图像 URL
 * @returns Promise<number> 返回色相值 (0-360)
 */
export async function extractHueFromImage(imageUrl: string): Promise<number> {
	try {
		const sourceColor = await extractMonetSourceColorFromImage(imageUrl);
		return getNormalizedHueFromSourceColor(sourceColor);
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
	lightness: number,
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
