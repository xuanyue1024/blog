# 动态主题取色功能

## 概述

基于 Material Design 3 的 **Dynamic Color** 规范，本博客现已支持从 banner 壁纸**自动提取主要颜色**作为主题色，无需手动配置。

## 工作原理

1. **自动提取**：当 banner 图像加载完成时，系统自动从 banner 的实际可见区域中采样像素
2. **颜色转换**：将采样到的 RGB 颜色转换为 HSL 色相值
3. **应用主题**：将提取的色相值应用到整个页面的主题系统
4. **持久化保存**：色相值保存到浏览器 `localStorage`，页面刷新后自动恢复

## 功能特性

✅ **自动提取** - 无需手动指定颜色，从 banner 自动生成
✅ **实时应用** - banner 加载完成后立即应用新主题
✅ **Material Design 3** - 与 M3 色彩体系完美集成
✅ **智能去噪** - 自动忽略过亮、过暗、透明的像素
✅ **可控开关** - 通过配置 `themeColor.fixed` 轻松禁用
✅ **浏览器兼容** - 支持所有现代浏览器的 Canvas API

## 配置

在 `src/config.ts` 中配置：

```typescript
export const siteConfig: SiteConfig = {
	// ... 其他配置
	themeColor: {
		hue: 235,           // 默认色相（提取失败时使用）
		fixed: false,       // false = 启用动态取色，true = 禁用（使用固定色相）
	},
	banner: {
		enable: true,
		src: "https://bing.img.run/1920x1080.php",
		// ...
	},
	// ...
};
```

### 配置说明

| 配置项 | 说明 | 取值 |
|------|-----|-----|
| `themeColor.fixed` | 是否锁定主题色为固定值 | `true` / `false` |
| `themeColor.hue` | 主题色默认色相（0-360） | 数字 |
| `banner.enable` | 是否显示 banner | `true` / `false` |
| `banner.src` | banner 图像 URL | URL 字符串 |

**关键点**：
- 仅当 `banner.enable: true` 且 `themeColor.fixed: false` 时，动态取色才会激活
- 如果提取失败，会自动回退到 `themeColor.hue` 的默认值

## 使用场景

### 场景 1：启用动态取色（默认）
```typescript
themeColor: {
	hue: 235,
	fixed: false,  // ✅ 启用动态取色
},
banner: {
	enable: true,
	src: "...",
}
```
→ 每次加载页面，主题色会根据 banner 自动调整

### 场景 2：禁用动态取色
```typescript
themeColor: {
	hue: 235,
	fixed: true,   // ❌ 禁用动态取色
},
```
→ 主题色始终为配置的 `hue: 235`

### 场景 3：无 banner 的情况
```typescript
banner: {
	enable: false,  // ❌ 无 banner
	src: "...",
}
```
→ 动态取色自动禁用，使用固定 `hue` 值

## 实现细节

### 涉及文件

| 文件 | 说明 |
|-----|-----|
| [src/utils/color-utils.ts](../src/utils/color-utils.ts) | 颜色提取与转换核心算法 |
| [src/components/DynamicThemeExtractor.svelte](../src/components/DynamicThemeExtractor.svelte) | 客户端取色组件 |
| [src/layouts/MainGridLayout.astro](../src/layouts/MainGridLayout.astro) | 集成动态取色组件 |

### 提取算法

1. **裁剪与降采样**：先按 banner 的可见区域和 `object-position` 计算裁剪窗口，再缩小到 50×50px 以提高性能
2. **采样过滤**：
   - 忽略 alpha < 128 的透明像素
   - 忽略亮度 < 30 或 > 225 的极端像素
   - 计算剩余像素的平均 RGB 值
3. **颜色转换**：RGB → HSL，提取色相分量 H (0-360)
4. **应用主题**：
   - 更新 CSS 变量 `--hue`
   - 保存到 `localStorage['hue']`

### Canvas 跨域限制

由于使用 Canvas API 读取像素数据，banner 图像必须支持 CORS。

**补充说明**：动态取色现在只针对页面上实际展示出来的 banner 可见区域，不会对整张原图盲采样。

**推荐的图像来源**：
- ✅ Bing 每日壁纸 (`https://bing.img.run/...`)
- ✅ 同域图像 (`/images/...`)
- ✅ 配置了 `Access-Control-Allow-Origin` 的 CDN

**不支持的来源**：
- ❌ 未配置 CORS 的第三方域名

## 浏览器兼容性

| 浏览器 | 支持 | 说明 |
|------|-----|-----|
| Chrome/Edge | ✅ | 完全支持 |
| Firefox | ✅ | 完全支持 |
| Safari | ✅ | 完全支持（15+） |
| IE | ❌ | 不支持 Canvas API |

## 调试

打开浏览器开发者工具的控制台，可以看到取色过程的日志：

```
[DynamicTheme] Applied hue: 235
```

如果出现错误：

```
[DynamicTheme] Failed to extract theme color from banner: Error: Failed to load image
```

### 常见问题排查

| 问题 | 原因 | 解决方案 |
|------|------|--------|
| "Failed to load image" | CORS 限制 | 检查图像 URL 是否支持 CORS |
| "Failed to get canvas context" | 浏览器不支持 | 升级浏览器到最新版本 |
| 色相未变化 | 提取失败或被忽略 | 检查 banner 是否成功加载 |

## 性能考虑

- ⚡ **采样尺寸**：50×50px（可在 `color-utils.ts` 中调整）
- 📊 **计算耗时**：通常 < 5ms
- 💾 **内存占用**：极小（仅一个 50px² 的 canvas）

## 未来优化方向

- [ ] 支持多种颜色提取算法（如 k-means 聚类）
- [ ] 亮度自适应调整（根据图像整体亮度调整色相）
- [ ] 色彩和谐优化（使用 WCAG 对比度检查）
- [ ] 预加载优化（提前加载 banner 以加快提取）

## 参考资源

- [Material Design 3 - Dynamic Color](https://m3.material.io/styles/color/dynamic-color/overview)
- [Canvas API - ImageData](https://developer.mozilla.org/en-US/docs/Web/API/ImageData)
- [HSL 色彩空间](https://en.wikipedia.org/wiki/HSL_and_HSV)
