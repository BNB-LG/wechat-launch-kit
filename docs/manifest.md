# Manifest v1

使用 `templates/minigame.json` 或 `templates/miniprogram.json` 起步。结构契约在 `schema/manifest.schema.json`，CLI 另做分支、字符数和证据检查。不要把密码、Cookie、AppSecret、证件或真实签名放入清单。

| 字段 | 内容 |
|---|---|
| `project` | 小游戏／小程序、正式／测试号、主体类型、名称版本、类目、介绍、引擎、操作与更新说明 |
| `network` | 实际网络行为、后台选择、声明状态、证据和未来变化 |
| `privacy` | 审计状态、版本、源码证据、实际受控 API、数据项、SDK、同意验证 |
| `age` | 适龄建议、事实依据、平台状态；普通小程序不强套 |
| `content` | 场景、玩法、系统；系统 ID 用于关联截图 |
| `screenshots` | 相对路径、栏目、系统 ID、微信来源、版本和画面说明 |
| `requirements` | 本账号要求核对日期和出处、文件大小和数量、重复策略 |
| `release` | 流程阶段、具体版本、证据来源/原文/时间、资质与两层备案、公开访问状态 |
| `notes` | 尚未核实项及其他说明 |

## 基础资料与当前表单模板

必填是本地准备模板的规则，不能代替账号当前页面。`requirements.requiredFields` 可列出实际必填的 `project.*` 或 `age.*` 文本字段；省略该数组时沿用名称、版本、简介、审核操作说明、版本更新说明五项。未列为必填不代表平台一定允许留空。小游戏引擎、场景、玩法与系统仍按小游戏分支检查。

| 字段 | 默认处理与计数 |
|---|---|
| `project.name` | 必填，4–30 计数字符；汉字计 2，其他 Unicode 码点计 1 |
| `project.shortName` | 选填，最多 10 计数字符；同名称口径 |
| `project.iconPath` | 相对 manifest 目录的头像路径；空白会提醒；默认推荐 144×144、2 MiB 以内 |
| `project.intro` | 必填，最多 120 Unicode 码点 |
| `project.version` / `reviewInstructions` | 必填，写真实版本与可复现的操作步骤 |
| `project.updateNotes` | 必填，最多 300 Unicode 码点 |
| `project.releasePrompt` | 选填更新提醒，最多 15 Unicode 码点 |
| `project.appleAccountEmail` | 按当前页面要求填写本人邮箱，不填写密码，不由此推定必须购买会员 |
| `age.background` / `theme` / `value` | 小游戏适龄表：背景 ≤10、主题 ≤10、价值说明 ≤100 Unicode 码点 |
| `age.artStyle` / `realEvent` / `socialMode` / `purchases` | 实际画风、真实事件关系、单人或社交方式、内购事实；按页面核对必填状态 |

全部上述数字及场景、玩法、系统说明长度可在 `requirements.fieldLimits` 调整；`requirements.checkedAt` 和 `provenance` 记录核对日期与依据。缺省的单项会继承模板值，非法或颠倒的上下限报错。`iconWidth`、`iconHeight`、`iconMaxBytes` 是文件检查的推荐值：实际解码失败或路径越界报错，尺寸／大小偏离推荐给提醒，不据此断言平台拒绝。

`validate` 只检查清单文字与结构；`check-screenshots` 才读取截图与已填写的头像文件。网页不能凭路径读取文件，因此不会把填写了路径展示成图片已验证。头像不计入场景、玩法或系统截图数量，也不参加这些截图的重复分组。

`privacy.auditStatus: "reviewed"` 需要 `sourceRevision` 和非空 `evidence`，只表示记录了审计，不自动证明结论正确。`controlledApis`、`thirdParties` 每项包含 `name`、`purpose`、`evidence`；不要填未使用项。每个 `dataItems` 包含 `name`、`purpose`、`storage`、`retention`、`deletion`、`evidence`，可加 `autoExpires`；若为 true，补 `expiryEvidence`。

`release.stage` 支持 `draft / saved / uploaded / submitted / approved / published`。草稿外状态需匹配版本、`user-report` 或 `platform-readback`、证据及观察时间。例：用户确认“审核中”是 `submitted`，不能填写 `published`。公开访问另记 `publicAccess: "verified"` 或 `unverified`。

`requirements.enabled: false` 关闭小游戏截图数量要求；截图文件若已提供仍会检查格式与重复。`duplicatePolicy: "warn"` 只改变完全重复的严重级别，不会把重复判为新画面。源码审计与截图检查输出中所有路径都是相对路径。

退出码：`0` 表示该项检查无错误；`1` 为校验问题（或严格模式有提醒）；`2` 为命令、解析、依赖或 IO 错误。`generate --draft` 可生成未完成草稿但保留退出码 1，便于自动流程识别。

## 可选运营与商业化扩展

`operations` 包含运营介绍、推广文案、智能运营计划、`materials` 与扫码交付 `delivery`。`monetization.ads/payment` 分别记录开通意图、资格、证据与材料准备状态；缺少这两个对象的旧清单仍然有效。新建清单提供空扩展。具体字段、可配置素材限制、材料 ID、长期不虚拟支付约束与 CLI 用法见 [operations.md](operations.md)；JSON Schema 同时覆盖新旧结构。
