import { type CollectionEntry, getCollection } from "astro:content";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getCategoryUrl } from "@utils/url-utils.ts";

/**
 * 从 post.id 中提取分类路径。
 * post.id 是相对于 src/content/posts/ 的路径，例如 "编程/Java/HashMap.md"。
 * 取最后一个 "/" 之前的部分作为分类，得到 "编程/Java"。
 * 文章若直接放在 posts 根目录下则返回 null（未分类）。
 */
export function getCategoryFromId(id: string): string | null {
	const lastSlash = id.lastIndexOf("/");
	if (lastSlash <= 0) return null;
	return id.substring(0, lastSlash);
}

// 按发布日期降序排列所有文章（草稿在生产环境中排除）
async function getRawSortedPosts() {
	const allBlogPosts = await getCollection("posts", ({ data }) => {
		// 生产环境过滤掉草稿，开发环境显示全部
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	// 处理 URL slug 生成逻辑
	// 默认情况下，Astro 使用文件名作为 slug。
	// 这里我们增加逻辑：如果文章 frontmatter 中定义了 abbrlink 且不为空，则优先使用它。
	allBlogPosts.forEach((post) => {
		if (post.data.abbrlink && post.data.abbrlink.trim() !== "") {
			post.slug = post.data.abbrlink.trim();
		}
	});

	const sorted = allBlogPosts.sort((a, b) => {
		// 优先按 sticky 降序排列：sticky 值越大越靠前
		// 有 sticky 的文章排在无 sticky 的文章前面
		const stickyA = a.data.sticky ?? -Infinity;
		const stickyB = b.data.sticky ?? -Infinity;
		if (stickyA !== stickyB) {
			return stickyB > stickyA ? 1 : -1;
		}

		// sticky 相同（包括都没有）时，按发布日期降序排列（越新越前）
		const dateA = new Date(a.data.published);
		const dateB = new Date(b.data.published);
		return dateA > dateB ? -1 : 1;
	});
	return sorted;
}

// 获取带上下篇导航信息的完整文章列表
export async function getSortedPosts() {
	const sorted = await getRawSortedPosts();

	// 为每篇文章注入"下一篇"信息（发布时间更晚的那篇）
	for (let i = 1; i < sorted.length; i++) {
		sorted[i].data.nextSlug = sorted[i - 1].slug;
		sorted[i].data.nextTitle = sorted[i - 1].data.title;
	}
	// 为每篇文章注入"上一篇"信息（发布时间更早的那篇）
	for (let i = 0; i < sorted.length - 1; i++) {
		sorted[i].data.prevSlug = sorted[i + 1].slug;
		sorted[i].data.prevTitle = sorted[i + 1].data.title;
	}

	return sorted;
}

// 用于列表展示的简化文章类型（附加计算出的 category 字段）
export type PostForList = {
	slug: string;
	data: CollectionEntry<"posts">["data"] & { category: string | null };
};

/**
 * 获取用于列表页展示的文章数据。
 * 注入从目录路径计算出的 category 字段（如 "编程/Java"），供前端过滤使用。
 */
export async function getSortedPostsList(): Promise<PostForList[]> {
	const sortedFullPosts = await getRawSortedPosts();

	return sortedFullPosts.map((post) => ({
		slug: post.slug,
		data: {
			...post.data,
			// 从文件路径推断分类，放在根目录的文章 category 为 null
			category: getCategoryFromId(post.id),
		},
	}));
}

export type Tag = {
	name: string;
	count: number;
};

// 获取所有标签及其文章数量，按名称字母序排列
export async function getTagList(): Promise<Tag[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	const countMap: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { tags: string[] } }) => {
		post.data.tags.forEach((tag: string) => {
			if (!countMap[tag]) countMap[tag] = 0;
			countMap[tag]++;
		});
	});

	// sort tags
	const keys: string[] = Object.keys(countMap).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	return keys.map((key) => ({ name: key, count: countMap[key] }));
}

// 分类数据结构，name 为 "/" 分隔的路径字符串，如 "编程" 或 "编程/Java"
export type Category = {
	name: string;
	count: number;
	url: string;
};

/**
 * 获取所有分类及其文章数量，支持多级目录。
 *
 * 文章放在 posts/编程/Java/xxx.md，分类路径为 "编程/Java"。
 * 同时统计每个祖先分类（"编程"、"编程/Java"），
 * 这样点击父级 "编程" 时能聚合展示所有子目录的文章数。
 *
 * 排序规则：按路径逐级字母序排列，父级始终在子级上方。
 */
export async function getCategoryList(): Promise<Category[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	const count: { [key: string]: number } = {};

	allBlogPosts.forEach((post) => {
		const categoryPath = getCategoryFromId(post.id);

		if (!categoryPath) {
			// 放在 posts 根目录的文章归入"未分类"，直接用 null 作 key 的占位符
			// URL 由 getCategoryUrl(null) 生成 ?uncategorized=true，不走普通分类路径
			const ucKey = "__uncategorized__";
			count[ucKey] = (count[ucKey] ?? 0) + 1;
			return;
		}

		// 对路径的每一级祖先（含自身）都累加计数
		// 例如 "编程/Java/集合" 会让 "编程"、"编程/Java"、"编程/Java/集合" 各 +1
		const parts = categoryPath.split("/");
		for (let i = 1; i <= parts.length; i++) {
			const key = parts.slice(0, i).join("/");
			count[key] = (count[key] ?? 0) + 1;
		}
	});

	// 按层级路径排序：逐级字母序比较，前缀相同时父级（较短）排在前
	const lst = Object.keys(count).sort((a, b) => {
		const partsA = a.split("/");
		const partsB = b.split("/");
		const minLen = Math.min(partsA.length, partsB.length);
		for (let i = 0; i < minLen; i++) {
			const cmp = partsA[i].toLowerCase().localeCompare(partsB[i].toLowerCase());
			if (cmp !== 0) return cmp;
		}
		// 前缀相同时，层级少的（父级）排在前面
		return partsA.length - partsB.length;
	});

	return lst.map((c) => {
		// 未分类条目单独处理：显示国际化文本，URL 指向 ?uncategorized=true
		if (c === "__uncategorized__") {
			return {
				name: i18n(I18nKey.uncategorized),
				count: count[c],
				url: getCategoryUrl(null),
			};
		}
		return {
			name: c,
			count: count[c],
			url: getCategoryUrl(c),
		};
	});
}
