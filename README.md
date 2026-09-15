# t1ar / 游戏策划作品集

以 `../docs/PORTFOLIO_MASTER_SPEC.md` 为内容主规范。原件保留在原位置；网站只使用副本。现有项目：乱世执棋、万朝战域；研究：无畏契约残局。

## 本地运行

使用已安装的 Node.js 22.13+：`npm install`，`npm run dev`。生产检查：`npm exec tsc -- --noEmit`、`node scripts/validate-content.mjs`、`npm run build`。

## 新增游戏

1. 复制 `content/templates/project.json.example` 到 `content/projects/你的项目.json`。
2. 设置唯一英文 slug、中文名称、摘要、本人职责、团队、当前状态与已有成果。不要把计划写成成果。
3. `visibility: "draft"` 保持草稿；准备好展示时改为 `"public"`。草稿不会进入页面、筛选和站点地图；客户端只收到公开记录。
4. 封面放在 `public/projects/项目名/` 并填写 `/projects/项目名/cover.jpg`；没有图片时保留 `cover: null`，使用文字封面。`diagram` 仅在明确需要三阵营概念图时设为 `three-faction-map`。
5. 新项目自动拥有 `/zh/projects/slug` 和 `/en/projects/slug`，无需修改页面或导航。

`status` 支持 idea / design / prototype / development / playable / released / paused。`genre` 为类型标识，列表选项从内容生成。`results` 可以为空，不据状态推断成果。英文暂缺时留空，英文项目页会给出提示与中文入口。

## 更新制作记录、状态与精选

在项目 `devlog` 数组追加 `{ "date":"2026-09-07", "title":{"zh":"本次标题","en":"Title"}, "description":{"zh":"实际完成内容","en":"What changed"}, "evidence":"/projects/my-game/evidence.png", "next":{"zh":"下一步","en":"Next"} }`。证据可省略，不能使用虚构链接。更新 `status` 与 `updatedAt`；保持成果与状态独立。

`featured: null` 表示仅进入全部作品；非负整数决定首页顺序。目前 0 为小伢的江、1 为乱世执棋、2 为万朝战域，新增作品不自动打乱该顺序。

项目正文的每个 section 可使用 `images: [{ src, caption: { zh, en }, long: true }]` 添加带双语说明的过程图片。`long` 用于分镜长图，放大后可滚动阅读，并提供原图入口。图注应区分设计方案、实机、现场照片和风格化插画，避免将团队美术误写为个人贡献。

## 新增拆解

复制 `content/templates/analysis.json.example` 到 `content/analysis/`，正文放在 `content/articles/`，素材放在 `public/analysis/`。设置 `body`、`assetBase`、`imageCredits`、类型、主题、来源样本规模与版本。正文支持标题、段落、加粗、列表、引文、HTTPS 链接和 `![图注](assets/image.jpg)`。正文支持 Markdown 表格并渲染为原生 HTML 表格。需要同结构双语证据表时，在 content/tables/ 新建 JSON（参考 valorant.json）并设置 tablesFile；完整来源在 content/sources/ 新建 JSON 并设置 sourcesFile。无需修改页面组件。

可选 `englishBody` 指向英文摘要 Markdown；没有英文正文时展示英文摘要与中文全文入口。`tablesFile` / `sourcesFile` 决定各自的证据与来源，避免新文章混用旧研究内容。首页精选拆解由 content/site.json 的 featuredAnalysis 单独指定。游戏类型、研究主题和游戏筛选来自公开元数据，查询保存在 URL。

## 更新 PDF

网页图片使用 `content/image-variants.json` 中的 WebP 衍生图，原件保留供灯箱查看和下载。更换图片后，可用 `node scripts/optimize-images.mjs <sharp模块路径>` 更新衍生图；提交 public/optimized 和图片清单，不需要线上图片服务。作品卡片可通过 `cardHighlight` 提供简明且可核实的成果，未填写时沿用第一项 results。PDF 在展开预览后才开始加载。

放入 `public/pdf/`，然后在 `content/downloads.json` 添加 id、group、双语 title、url、size、version、updatedAt。简历 group 为 `resume`，万朝文档为 `wanchao-zhanyu`，无畏契约为 `valorant`。新文章可使用自己的 `downloadGroup`，默认使用 slug。只登记真实可打开的 PDF。桌面支持按需展开预览，手机提供打开/下载。

## 品牌、联系与发布

交互与视觉：`app/art-direction.css` 延续青蓝标识，采用深色作品展台与浅色正文。首页 `HeroShowcase` 手动切换精选作品，支持方向键和 Home/End，不自动轮播。`ReadingNav` 根据阅读位置高亮章节，手机端折叠目录；灯箱支持适应窗口、原始尺寸和独立滚动。正文无需滚动动画触发即可阅读，动效遵循减少动态效果设置。项目详情沿用所属一级导航高亮。

站内页面跳转使用原生 `<a>`。当前 Vinext 生产包的 `next/link` 动态导航导出会丢失，导致点击报 `TypeError: e is not a function`；不要在未验证生产点击流程前改回。筛选仍使用可工作的 router.replace。`scripts/verify-interactions.mjs` 导出 verifyInteractions(context, origin)，接收 Playwright context，覆盖中英文导航、项目入口、搜索、语言切换、灯箱、移动菜单和声音开关；部署凭据由调用方仅在内存中配置。

个人信息在 `content/profile.json`，术语在 `content/glossary.json`，视觉在 `app/portfolio.css`。所有当前字体均采用系统字体回退，无远程字体依赖。交互音为本地 Web Audio 合成，默认关闭并记住选择；无背景音乐。图示是策划示意，不代表引擎实机。

`.openai/hosting.json` 绑定现有 Sites 项目。使用 Sites 保存版本并私密发布；正式公开前完成 `../docs/IMPLEMENTATION_STATUS.md` 中仍待确认的素材。不要将个人关机脚本或本地工具放入网站，相关文件仅位于 `../docs/local-tools/`。

## 2026-09-15 品牌定稿接入

使用用户提供的标志定稿：星光符号、组合标和签名，搭配银黑冰蓝配色。页面中的标志以原设计图视窗呈现，不重新绘制几何。`public/brand/logo-board.png` 保留原件，WebP 用于显示；`scripts/prepare-brand.mjs` 生成格式副本与嵌入标志视窗的 favicon。`components/brand-identity.tsx` 维护各标志的显示范围。

按用户最新要求，个人角色形象暂时搁置，不在本版展示。角色资料保存在网站之外的 `../docs/shelved-brand/`。原有作品、试玩入口、阅读导航、简历资料和作品切换保留。
