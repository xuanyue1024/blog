---
author: 竹林听雨
tags:
  - 博客
title: hexo搭建参考
abbrlink: a068d060
published: 2025-01-31 00:00:00
---

【【零成本】Hexo个人博客搭建教程 | 无需服务器-哔哩哔哩】 https://b23.tv/GVuJ7EB

[404 Page not found](https://blog.fiveth.cc/p/bb32.html)

[朋友圈页面配置 | 安知鱼主题官方文档](https://docs.anheyu.com/page/fcircle.html)

[Obsidian+Git完美维护Hexo博客 - 知乎](https://zhuanlan.zhihu.com/p/554333805)

[在 GitHub Pages 上部署 Hexo | Hexo](https://hexo.io/zh-cn/docs/github-pages)

[# 将 Hexo 部署到 Cloudflare Workers Site 上的趟坑记录](https://blog.skk.moe/post/deploy-blog-to-cf-workers-site/)

使用hexo generate生成静态文件后，可以观察到图片已经拷贝到了对应的目录下。但是现在浏览的时候还不能够看到图片，因为我们插入的时候用的是包含了一个与Markdown文件同名文件夹的相对路径，而生成的静态文件夹下没有那个同名文件夹所以造成了访问404。

我们可以使用hexo-simple-image插件来解决这个问题

```bash
npm install hexo-simple-image --save
```

或者
使用github:7ym0n/hexo-asset-image
## 主题推荐
[Hexo Fluid 用户手册](https://hexo.fluid-dev.com/docs/) 
[hexo-theme-fluid的gittalk使用 - rPniu](https://rpniu.github.io/2025/03/26/hexo-theme-fluid%E7%9A%84%E4%BD%BF%E7%94%A8/?)

[Hexo Stellar 主题装修笔记 - YOLOのBLOG](https://felicxfoster.github.io/4199909915.html#%E6%B7%BB%E5%8A%A0%E6%8D%90%E8%B5%A0%E5%9B%BE%E6%A0%87) 
[Stellar：开始您全新的博客之旅 - XAOXUU](https://xaoxuu.com/wiki/stellar/)
[stellar主题深色模式设置 - BoBoBlog](https://blog.bxzdyg.cn/p/stellar-dark-mode/) 
[Stellar：侧边栏组件的配置与使用（9个） - XAOXUU](https://xaoxuu.com/wiki/stellar/widgets/)
[使用 GitHub Actions 自动部署 Vercel 教程 | 变量人生](https://www.bianliangrensheng.cn/blog/github-actions-auto-vercel)
[Vercel 加速，快，不止更快 | Mystic Stars](https://www.mysticstars.cn/archives/speed-vercel)