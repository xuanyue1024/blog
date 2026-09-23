import { visit } from "unist-util-visit";

/**
 * 将 ```html-demo 代码块转换为受控 iframe 演示块。
 *
 * 设计目标：
 * 1. 只处理 html-demo，不影响普通 html 代码块的展示。
 * 2. 直接在构建阶段把 demo 转成 iframe srcdoc，避免运行时再解析 Markdown。
 * 3. 支持从站点配置传入可选 cssUrl；为空时不注入任何外部样式。
 * 4. iframe 内主动回传内容高度，外层页面据此撑开，避免内部滚动条。
 */
export function remarkHtmlDemoBlocks(options = {}) {
	const enable = options.enable !== false;
	const cssUrl = typeof options.cssUrl === "string" ? options.cssUrl.trim() : "";

	return (tree) => {
		if (!enable) {
			// 关闭时将 html-demo 降级为 html，确保仍然以普通代码块方式展示。
			visit(tree, "code", (node) => {
				const lang = node.lang?.trim().toLowerCase();
				if (lang === "html-demo") {
					node.lang = "html";
				}
			});
			return;
		}

		visit(tree, "code", (node, index, parent) => {
			if (!parent || index == null) {
				return;
			}

			const lang = node.lang?.trim().toLowerCase();
			if (lang !== "html-demo") {
				return;
			}

			const source = typeof node.value === "string" ? node.value : "";
			const demoId = `html-demo-${index}-${Math.random().toString(36).slice(2)}`;
			const srcdoc = buildSrcdoc(source, cssUrl, demoId);

			parent.children[index] = {
				type: "paragraph",
				data: {
					hName: "div",
					hProperties: {
						className: ["html-demo-block", "not-prose"],
					},
					hChildren: [
						{
							type: "element",
							tagName: "iframe",
							properties: {
								className: ["html-demo-iframe"],
								"data-html-demo-id": demoId,
								title: "html-demo",
								loading: "lazy",
								sandbox: "allow-scripts",
								referrerPolicy: "no-referrer",
								srcdoc,
							},
							children: [],
						},
						{
							type: "element",
							tagName: "details",
							properties: {
								className: ["html-demo-fallback"],
							},
							children: [
								{
									type: "element",
									tagName: "summary",
									properties: {},
									children: [{ type: "text", value: "查看示例源码" }],
								},
								{
									type: "element",
									tagName: "pre",
									properties: {},
									children: [
										{
											type: "element",
											tagName: "code",
											properties: {},
											children: [{ type: "text", value: source }],
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

/**
 * 组装 iframe 的 srcdoc 内容。
 *
 * 说明：
 * - 统一注入基础 meta，保证移动端缩放和字符编码正常。
 * - cssUrl 非空时才拼接 link 标签，满足“为空则不拼 CSS”的要求。
 * - 内嵌一个极小的高度上报脚本，让主页面能够把 iframe 撑开到内容高度。
 */
function buildSrcdoc(source, cssUrl, demoId) {
	const linkTag = cssUrl
		? `<link rel="stylesheet" href="${escapeHtmlAttribute(cssUrl)}">`
		: "";
	const escapedDemoId = escapeHtmlAttribute(demoId);
	const autoHeightScript = [
		"<script>",
		"(function(){",
		`  var demoId='${escapedDemoId}';`,
		"  function postHeight(){",
		"    var body=document.body;",
		"    var doc=document.documentElement;",
		"    var height=Math.max(",
		"      body?body.scrollHeight:0,",
		"      body?body.offsetHeight:0,",
		"      doc?doc.scrollHeight:0,",
		"      doc?doc.offsetHeight:0",
		"    );",
		"    parent.postMessage({type:'html-demo-height',id:demoId,height:height}, '*');",
		"  }",
		"  window.addEventListener('load', postHeight);",
		"  window.addEventListener('resize', postHeight);",
		"  if('ResizeObserver' in window){",
		"    var ro=new ResizeObserver(postHeight);",
		"    ro.observe(document.documentElement);",
		"    if(document.body) ro.observe(document.body);",
		"  }",
		"  setTimeout(postHeight, 0);",
		"})();",
		"</script>",
	].join("");

	return [
		"<!doctype html>",
		"<html>",
		"<head>",
		'<meta charset="utf-8">',
		'<meta name="viewport" content="width=device-width,initial-scale=1">',
		"<style>html,body{margin:0;overflow:hidden;}</style>",
		linkTag,
		"</head>",
		"<body>",
		source,
		autoHeightScript,
		"</body>",
		"</html>",
	].join("");
}

/**
 * 对 HTML 属性值进行最小转义，避免链接中的引号破坏属性结构。
 */
function escapeHtmlAttribute(value) {
	return value.replace(/&/g, "&amp;").replace(/\"/g, "&quot;");
}