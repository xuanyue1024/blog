import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: "Yu’s Blog",
	subtitle: "🎉",
	lang: "zh_CN", // 语言代码，例如 'en', 'zh_CN', 'ja' 等。
	themeColor: {
		hue: 285, // 主题颜色的默认色相，范围 0 到 360。例如：红色: 0, 青色: 200, 蓝绿色: 250, 粉色: 345
		fixed: false, // 对访问者隐藏主题颜色选择器
	},
	banner: {
		enable: false,
		src: "assets/images/demo-banner.png", // 相对于 /src 目录。如果以 '/' 开头，则相对于 /public 目录
		position: "center", // 等同于 object-position，仅支持 'top', 'center', 'bottom'。默认为 'center'
		credit: {
			enable: false, // 显示横幅图片的署名文字
			text: "", // 要显示的署名文字
			url: "", // (可选) 原始作品或艺术家页面的链接
		},
	},
	toc: {
		enable: true, // 在文章右侧显示目录
		depth: 3, // 目录中显示的最大标题深度，范围 1 到 3
	},
	favicon: [
		{
			src: 'https://foruda.gitee.com/avatar/1671549130798899777/8687215_xuanyue03_1671549130.png!avatar200',
		}
		// 留空此数组以使用默认 favicon
		// {
		//   src: '/favicon/icon.png',    // favicon 的路径，相对于 /public 目录
		//   theme: 'light',              // (可选) 'light' 或 'dark'，仅当你在浅色和深色模式下有不同的 favicon 时设置
		//   sizes: '32x32',              // (可选) favicon 的尺寸，仅当你有不同尺寸的 favicon 时设置
		// }
	],
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		LinkPreset.About,
		{
      name: '统计',
      url: 'https://cloud.umami.is/analytics/us/share/bv965ko6FIRUoWem',
      external: true,
    },
		{
			name: "GitHub",
			url: "https://github.com/xuanyue1024", // 内部链接不应包含基础路径，因为它会自动添加
			external: true, // 显示外部链接图标并在新标签页中打开
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "https://foruda.gitee.com/avatar/1671549130798899777/8687215_xuanyue03_1671549130.png!avatar200", // 相对于 /src 目录。如果以 '/' 开头，则相对于 /public 目录
	name: "竹林听雨",
	bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
	links: [
		{
			name: "Twitter",
			icon: "fa6-brands:twitter", // 访问 https://icones.js.org/ 获取图标代码
			// 如果尚未包含对应的图标集，你需要安装它
			// `pnpm add @iconify-json/<图标集名称>`
			url: "https://twitter.com",
		},
		{
			name: "Steam",
			icon: "fa6-brands:steam",
			url: "https://store.steampowered.com",
		},
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/xuanyue1024",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// 注意：某些样式（如背景颜色）正在被覆盖，请参阅 astro.config.mjs 文件。
	// 请选择一个深色主题，因为此博客主题目前仅支持深色背景颜色
	theme: "github-dark",
};