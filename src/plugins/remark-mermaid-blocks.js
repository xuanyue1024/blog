import { visit } from "unist-util-visit";

/**
 * 将 ```mermaid 代码块转换为可由前端渲染器识别的占位节点。
 *
 * 说明：仅改写 mermaid 代码块，不影响其它语言代码块；保留原始源码到 `data-mermaid-source`，
 * 供客户端按需渲染。
 */
export function remarkMermaidBlocks() {
	return (tree) => {
		visit(tree, "code", (node, index, parent) => {
			if (!parent || index == null) {
				return;
			}

			const lang = node.lang?.trim().toLowerCase();
			if (lang !== "mermaid") {
				return;
			}

			const source = typeof node.value === "string" ? node.value : "";
			parent.children[index] = {
				type: "paragraph",
				data: {
					hName: "div",
					hProperties: {
						className: ["mermaid-diagram", "not-prose"],
						"data-mermaid-source": source,
					},
					hChildren: [
						{
							type: "element",
							tagName: "pre",
							properties: {
								className: ["mermaid-fallback"],
							},
							children: [
								{
									type: "element",
									tagName: "code",
									properties: {},
									children: [
										{
											type: "text",
											value: source,
										},
									],
								},
							],
						},
					],
				},
			};
		});
	};
}