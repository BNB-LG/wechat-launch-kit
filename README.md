# WeChat Launch Kit · 微信提审资料工具包

把真实代码、页面要求和版本证据，整理为可复制的微信小程序／小游戏提审资料。包含**离线填写工作台、Node CLI、源码核查辅助、截图重复检查、运营素材校验、广告／支付开通准备清单和可安装 Skill**。

> Local-first preparation toolkit for WeChat Mini Programs and Mini Games. No login, upload, auto-submission, or approval claims. Chinese workflow; MIT licensed.

## 5 分钟开始

1. 下载或克隆本仓库。直接用浏览器打开 `web/index.html`，无须安装依赖；也可运行 `npm start`，打开终端显示的本地地址。
2. 选择小游戏或小程序，填写名称、版本、实际功能和审核操作说明。可导入已有 manifest JSON。
3. 点击“检查并生成字段”，逐项复制；下载 JSON 以便继续编辑。网页不自动保存，不使用 Cookie、不上传资料。
4. 导出 HTML 复制台、Markdown 或 TXT，按当前账号后台逐项填写。
5. 用 CLI 核对截图和版本，分别记录保存、提交与审核结果。

没有源码证据时保留“待核查”，没有状态原文时保持“草稿”。**结构校验通过并不代表资料齐备、隐私合规、审核通过或上线。**

## CLI

需要 Node.js 22+；普通命令没有 npm 第三方依赖。

```sh
node bin/wechat-launch-kit.cjs init .local/manifest.private.json --kind minigame
node bin/wechat-launch-kit.cjs validate .local/manifest.private.json
node bin/wechat-launch-kit.cjs generate .local/manifest.private.json --out .local/review-v1 --draft
```

`init` 拒绝覆盖文件。`generate` 默认拒绝有错误的清单；`--draft` 导出明确标记的未完成草稿，并以非零退出码提示仍有错误。输出目录默认须为空，`--force` 只覆盖固定的生成文件，不删除其他文件；会拒绝符号链接、硬链接或非普通文件作为覆盖目标。

基础资料包含名称、简称、头像路径、简介、版本更新说明和选填更新提醒；小游戏包含适龄背景、主题、价值说明、画风、真实事件、单人／社交及内购事实。默认名称 4–30、简称 ≤10，汉字计 2；简介 ≤120、更新说明 ≤300、提醒 ≤15，适龄背景／主题 ≤10、价值说明 ≤100。它们都是可修改的本地表单模板：`requirements.fieldLimits` 调整数字，`requiredFields` 调整实际必填字段，[字段说明](docs/manifest.md) 区分必填、选填和待页面核对项。

生成结果：

| 文件 | 用途 |
|---|---|
| `copy-fields.html` | 离线查看、逐项复制，保留字数和填写提示 |
| `submission.md` / `submission.txt` | 可读填写稿与待办 |
| `fields.json` | 字段、内容、字数与提示的机器可读清单 |
| `manifest.snapshot.json` | 本次输入快照，不提升任何外部状态 |
| `validation.json` | 文字与结构检查结果 |

```sh
# 匿名示例：校验可通过，但保留未审计、未截图等提醒
node bin/wechat-launch-kit.cjs validate examples/minigame.json
node bin/wechat-launch-kit.cjs validate examples/miniprogram.json
node bin/wechat-launch-kit.cjs generate examples/minigame.json --out .local/example
# 严格模式：有任何待核对提醒即返回失败
node bin/wechat-launch-kit.cjs validate examples/minigame.json --strict
```

### 截图检查

可选依赖 Python 3.10+ 与 Pillow。建议独立虚拟环境，不修改全局 Python：

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
node bin/wechat-launch-kit.cjs check-screenshots .local/manifest.private.json --python .venv/bin/python
```

截图路径相对 manifest 所在目录。每张列明栏目、来源、版本和真实画面说明：

```json
{"path":"screens/scene-start.png","column":"scene","source":"wechat-devtools","version":"1.0.0","description":"实际开始页"}
```

系统图另加 `"systemId":"control"`，对应 `content.systems[].id`。来源只能标注微信真机 `wechat-device` 或微信开发者工具 `wechat-devtools`；两者不可混称。清单声明不能证明真实性，仍需人工检查。

默认实践模板为场景 3 张、玩法 3 张、至少 3 项系统且每项 1 张；PNG/JPG/JPEG，60 KiB–5 MiB（60 KB 按 1024 字节保守检查）。**这些是可修改的检查模板，先对照当前账号页面填写 `requirements.checkedAt` 与 `provenance`，不是所有账号永久统一的规则。** 小程序默认不启用小游戏截图计数。

检查实际解码格式、大小、尺寸、版本、栏目数量、越界路径，并跨全部栏目计算文件 SHA-256 和统一 RGBA 解码像素摘要。相同文件改名或无损重编码仍会被识别。不同有损压缩、细微修改、裁切或近似画面不保证被识别；禁止为躲避重复而改图。应从运行过程取得真实不同状态。默认完全重复为错误，只有当前页面确认允许复用时才可显式改为 `duplicatePolicy: "warn"` 并记录依据。

已填 `project.iconPath` 时也会读取头像：默认推荐 144×144、2 MiB 以内，尺寸或大小不符给提醒；图片损坏或目录越界报错。头像不会补足截图数量。只运行 `validate` 或网页表单检查不会验证本地图片文件。

### 只读源码核查辅助

```sh
node bin/wechat-launch-kit.cjs audit-source /path/to/your/project --out .local/source-audit.json
```

输出相对路径、文件摘要与 `wx.*`、`fetch`、`WebSocket` 等候选调用及行号，不修改源码。会跳过隐藏目录、依赖、构建产物和大文件，并记录跳过项。它不执行应用，也不解析别名或全部 SDK 数据流；必须人工检查源码、依赖和实际网络/存储行为。不要把“没搜到”当成“没有处理信息”。隐私判断方法见 [审计说明](docs/privacy-audit.md)。

## 审核后的运营与开通准备

工作台还可添加游戏简介与详细介绍、通用封面、横竖推广图、推广视频、分享图、推广文案与智能内容运营计划；支持可配置像素、字节和视频时长检查。广告／流量主与玩家支付分开选择，普通小程序实物服务、数字内容与小游戏 IAP 不共用开通结论。明确长期不虚拟支付的项目可保留该约束。

```sh
node bin/wechat-launch-kit.cjs check-materials .local/manifest.private.json --python .venv/bin/python
node bin/wechat-launch-kit.cjs operations-checklist .local/manifest.private.json --json
```

图片检查依赖 Pillow，视频检查另需本地 ffprobe；未配置限制、缺文件或缺依赖均不算完整通过。运营扩展与旧 schemaVersion 1 清单兼容，现有 `generate` 的六个文件包含运营字段与材料缺口。可参考匿名清单 `examples/minigame-operations.json`：广告资料准备中、长期不虚拟支付、媒体路径仅为待制作占位。正式码、体验码和开发预览码分别记录，发布与普通用户扫码各自验证。见 [运营、开通与交付说明](docs/operations.md)。

## 用自然语言调用 Skill

将 **整个仓库**放在稳定目录，再将 `skills/wechat-launch-kit` 链接到个人技能目录（将路径替换为你的实际位置）：

```sh
mkdir -p ~/.codex/skills
ln -s /absolute/path/to/wechat-launch-kit/skills/wechat-launch-kit ~/.codex/skills/wechat-launch-kit
```

已有同名 Skill 时先检查，避免覆盖。也可复制技能目录；复制后的 Skill 会指导使用者定位本工具仓库。Skill 本身不依赖账号或专有插件。

可以直接说：

> 这是一个本地单人小游戏，只有计分、暂停和重开。帮我核对代码，整理微信提审资料，检查截图，给我能逐项复制的填写稿。先不操作后台。

或者：

> 我注册后没有游戏类目，开发工具提示找不到 app.json。帮我先确认账号分支，不要修改代码凑普通小程序壳。

Skill 会区分小程序／小游戏、测试／正式账号，复用已确认信息，收集缺口并生成 manifest。身份、密码、Cookie、AppSecret 和验证码不进入工具清单。

## 实践边界

- 原生 JavaScript / Canvas 2D 不应误填 Cocos 或 Unity；按真实选项写“其他／自研”。
- 至少三系统的页面不意味着要做商城：可按真实功能拆分操作、计分和设置；不把本地分数写成货币或在线排行榜。
- 本地存储不自动等于非个人信息；单个最高分的法律性质也不能仅由模板下结论。无受控 API 调用，不为填表勾选无关权限；自定义类型独立填写。
- 单机技术架构、声明签署、资质通过、两层备案、版本审核和发布分别留证；费用、时限、地区材料与豁免以当前账号及官方说明为准。
- 浏览器受安全策略阻断，停止该路径，用脱敏截图和手工填写继续。没有 Cookie 提取、CDP 或 AppleScript 绕过，也没有通用自动提交器。
- HTTP 200 只代表 HTTP 层正常；业务错误 `-10000400` 仍是失败。先保留文本、按提示正常刷新后重试一次；没有依据不能归因于认证中或某个自定义项。

更多见 [流程与踩坑](docs/workflow.md)、[开发者工具 CLI 授权与成功判定](docs/devtools-cli.md)、[官方来源与时效](docs/sources.md)、[清单格式](docs/manifest.md)。

## 开发与验证

```sh
npm test
# 如用虚拟环境，将截图测试解释器传给测试进程
PYTHON=.venv/bin/python npm test
```

测试覆盖两种分支、缺失证据、生成不提升状态、HTML 转义、覆盖保护、跨栏目同文件与重编码像素重复、损坏图像和路径越界，以及运营 JPEG／视频真实解码、时长、支付分流与范围冲突。没有 Pillow 时图像测试会明确跳过；没有 ffmpeg/ffprobe 时视频测试会明确跳过；发布前应安装依赖并确保无跳过。没有真实账号的 E2E 上传／提审测试，也没有法律合规认证。

本次运行环境、自动回归与边界记录在 [本地验证记录](docs/verification.md)。

本仓库只含虚构示例和合成测试图生成器，不附真实项目截图、账号标识、个人邮箱或证件。自己的 manifest、截图和生成文件请保存在 `.local/`，不要提交到公开仓库。`.gitignore` 是便利保护，公开前仍须逐项审查。
