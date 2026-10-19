# 宁跃教育 · 在线考试平台

可通过 GitHub Pages 部署的静态题库网站，支持汽车、市场营销、英语三个科目组。无需构建步骤或外部 CDN。

## 科目与练习

| 科目 | 题库与规则 |
| --- | --- |
| 汽车 | 796 题；默认 40 道单选、20 道多选、20 道判断，共 80 题、100 分、60 分钟 |
| 市场营销 | 800 题；默认 40 道单选、20 道多选、20 道判断，共 80 题、100 分、60 分钟 |
| 英语 | 672 小题；语音辨析、交际对话、词汇与语法、图文理解、完形填空、阅读理解、书面表达七个板块；支持分项练习和自定义模拟 |

英语题目由提供的七份扫描 PDF 导入，使用原题裁图保留语音下划线、图表和跨页材料，作答图片中已移除答案。点击图片可放大。阅读部分含判断题；书面表达为按材料选择补全内容。交际对话、完形、阅读及书面表达按完整材料组抽取；设置无法由完整题组组成的题数时，会提示可选数量。

英语按每小题 2 分计算练习成绩，总分由实际抽取题数决定。当前没有设定正式考试的固定题型配比。各科支持计时、漏题提醒、补答去红、重新开始清除旧标红、到时自动交卷、成绩下载、打印及本地进度恢复。

## 本地预览

在仓库根目录运行：

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

浏览器打开 `http://127.0.0.1:8765/`。名单校验使用浏览器 Web Crypto，线上须使用 HTTPS，本地可用 localhost 或 127.0.0.1；普通局域网 HTTP 地址不支持。

## 名单维护

`whitelist.js` 使用 v2 名单格式。每条记录只有 `salt`、`hash`、`enabled`，不包含 `name` 或 `phone`。姓名和手机号经统一规范化后，以 PBKDF2-SHA-256 计算校验值，迭代 600000 次；每个人在每个科目的记录都使用独立随机盐。这里只保存用于匹配的校验值，不是可解密还原的姓名、手机号密文。

在仓库根目录使用本地维护工具。命令只带操作和科目；姓名、手机号在交互提示中输入，不写进命令行参数或公开文件。

```sh
node scripts/manage-whitelist.mjs add auto
node scripts/manage-whitelist.mjs add marketing
node scripts/manage-whitelist.mjs add english
node scripts/manage-whitelist.mjs disable english
node scripts/manage-whitelist.mjs enable english
```

`add` 添加对应科目的记录，`disable` 停用，`enable` 恢复启用；三个操作均支持 `auto`、`marketing`、`english`。工具自动更新本地 `whitelist.js`，检查后再提交发布。不要手工添加姓名、手机号字段，也不要把输入名单保存或提交到仓库。

首次升级须同时发布六个 HTML 页面、`access.js` 和 `whitelist.js`，不要只替换其中一个文件。之后名单日常维护只需发布更新后的 `whitelist.js`。原有会话和答题进度沿用；已停用的记录仍会失去相应科目访问资格。本机浏览器为识别考生和恢复进度，仍保存当前考生本人的姓名、手机号及作答数据。

普通练习和教师功能验证入口的记录互相隔离，学员和科目之间也互相隔离。首页底部的“教师工具”提供验证入口，仍须完成对应科目的名单验证。

名单校验值会随静态网页下载。随机盐和迭代计算提高批量猜测成本，但不能保证无法破解，也不能阻止前端入口被绕过；需要真实身份认证时应使用服务端方案。本次更改不清理 Git 历史，也不改变仓库的公开或私有状态；提交 `f49b6a6` 中已有的明文记录仍存在于历史中。

## 文件结构

```text
index.html                 三科首页
login.html                 分科目名单验证
auto-exam.html             汽车题库及考试
marketing-exam.html        市场营销题库及考试
english-exam.html          英语练习页面
english-exam.js            英语计时、作答、恢复及成绩界面
english-exam-core.js       英语题库校验、完整题组抽取、评分
english-exam.css           英语页面样式
data/english-bank.js       英语结构化题目、材料关联及答案
assets/english/            已移除答案的英语原题裁图
access.js / whitelist.js   分科目入口验证和 v2 名单校验值
brand.js                   品牌与公开联系方式
guide.html                 考试须知和数据说明
scripts/manage-whitelist.mjs 本地名单添加、停用与启用
scripts/                   导入及回归检查工具
docs/                      导入核对及检查报告
```

## 检查与发布

```sh
node scripts/test-exams.mjs
node scripts/test-roster.mjs
node scripts/test-whitelist-tool.mjs
```

回归检查覆盖原题库结构、名单兼容、跨科拦截、进度隔离、英语资源、完整组卷、计分和恢复；结果写入 `docs/english-regression.json`。浏览器验收另记录于 `docs/english-browser-checks.json`。

名单检查覆盖哈希登录、旧会话恢复、同步计时接口、身份篡改、停用撤销及维护工具。此次迁移的数量和实际登录核对见 `docs/roster-migration-checks.json`。逐条随机盐会使登录耗时随名单人数增长；本次仅测量了本机 Node Web Crypto，尚未验证低端手机性能。

GitHub Pages 发布目录为仓库根目录时，保留 `.nojekyll`，上传 HTML、JS、CSS、`data/` 和 `assets/`，不能遗漏英语图片目录。源扫描 PDF 和中间 OCR 文件不需要发布。

## 使用边界

本项目是静态学习与模拟练习工具。网站在当前浏览器使用名单校验值匹配输入，不提供短信验证、手机归属验证或服务端身份认证。校验值和题库答案随前端资源加载，入口校验可被绕过；不要把原始名单或其他敏感信息加入公开文件。

成绩和进度只保存在当前浏览器，不自动汇总给老师。清理浏览器数据或更换设备后无法自动找回。题库答案按提供的资料录入，专业内容和争议题目仍需教师复核。
