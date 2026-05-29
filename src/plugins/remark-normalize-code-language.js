import { visit } from "unist-util-visit";

/**
 * 将 Markdown 代码块的语言标识归一化为小写，避免诸如 `Java`、`Python` 这类大小写不一致
 * 的写法导致高亮器无法识别。
 *
 * 说明：只处理 fenced code block 的 `lang` 字段，不改动代码内容本身；这样既能兼容
 * Expressive Code 的语言匹配，也能让语言徽标保持稳定输出。
 */
export function remarkNormalizeCodeLanguage() {
	return (tree) => {
		visit(tree, "code", (node) => {
			if (typeof node.lang !== "string") {
				return;
			}

			const normalizedLang = node.lang.trim().toLowerCase();
			if (normalizedLang.length === 0) {
				return;
			}

			node.lang = normalizedLang;
		});
	};
}