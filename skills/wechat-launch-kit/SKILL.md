---
name: wechat-launch-kit
description: Prepare evidence-based WeChat Mini Program or Mini Game submission materials from real code, runtime screenshots, and current account fields; generate copy-ready manifests, review drafts, post-review operating assets, advertising and payment onboarding checklists, and release-code evidence. Use for launch preparation and status reconciliation, not generic web development or automatic publishing.
---

# 微信提审与运营资料助手

将自然语言需求转成真实可填写的资料，默认用中文。复用已确认版本、主体类型、签署和提交状态；只问影响当前步骤的缺口。身份信息及登录秘密留在官方页面，不纳入公开仓库。

## 开始

先分清小游戏／普通小程序、正式号／测试号、个人／组织主体和当前版本。没有游戏类目或小游戏入口报缺少 `app.json` 时先核对账号类型，不用加小程序外壳掩盖分支错误。用户明确说已审核中，就记录用户报告的 `submitted`，不要重复要求提交，更不能称已上线。

若本技能仍位于完整仓库，工具根目录为技能目录上两级；若通过符号链接安装，先解析真实路径。若是单独复制的技能，定位用户已有的 `wechat-launch-kit` 仓库或明确缺少本地 CLI；不要假装脚本可用。读取 [references/workflow.md](references/workflow.md) 获取处理边界；按需读取工具仓库 `docs/privacy-audit.md`、`docs/sources.md`、`docs/manifest.md`。

## 资料准备

1. 先形成最短事实表：类型、版本、真实玩法/功能、引擎、联网/登录/存储/SDK、现有账号状态与当前缺口。不把未来计划写成已实现。
2. 获得源码路径时只读检查。可用 `node bin/wechat-launch-kit.cjs audit-source <source> --out <local-audit.json>` 获取候选和摘要，再人工追踪入口、存储、网络、依赖、数据用途和删除路径。自动候选检索不能证明“没有处理信息”。
3. 用 `init` 创建本地私有 manifest，填写事实与代码证据。按当前表单核对名称、简称、头像、简介、版本说明、选填更新提醒，以及小游戏适龄细分字段；用 `requirements.fieldLimits` / `requiredFields` 记录实际限额与必填集合，参考仓库 `docs/manifest.md`。小游戏按真实场景、玩法和系统写文字，不虚构货币、商城、奖励或在线排行榜凑数量。原生 JS / Canvas 2D 按实际选项写其他／自研。
4. 截图按当前账号要求取得同版本微信真机或开发者工具真实不同状态，二者来源分别标明。运行 `check-screenshots` 检查文件与解码像素跨栏目重复，再人工检查画面。不能通过改名、重编码、裁切或噪声骗过重复。
5. 运行 `validate` 和 `generate`，交付 `copy-fields.html`、MD/TXT 与缺口。可用 `--draft` 导出不完整文字，但不能隐藏错误或提升状态。

网页 `web/index.html` 可离线填写、导入 JSON 和导出复制字段；不自动存储资料。截图检查需要 Python/Pillow；缺依赖时明确说明，并在用户授权范围内建立独立环境。不要把被跳过的截图检查称为通过。

## 审核后的运营与开通

按需读取工具仓库 [docs/operations.md](../../docs/operations.md)（相对技能目录需定位仓库；复制安装时查找实际仓库）。使用可选 `operations` / `monetization`，不要求改写旧清单。运营资料覆盖游戏简介、详细介绍、封面、横竖详情图、文案、视频、分享图和智能运营计划；仅对当前账号可见栏目提出要求。通用封面实践起点为 JPEG 650×250、≤80 KB，页面建议不放图标和游戏名；先对照当前账号，其他尺寸/时长未核到则留待配置，不能套审核截图字节下限。

网页添加素材与规格；`check-materials` 用 Pillow/ffprobe 读取实际尺寸、字节、格式与视频时长。缺依赖或未配置不声称通过，人工另核对文字、版权和真实性。`generate` 导出同一套可复制字段；`operations-checklist` 按选择的路线导出缺口。

广告收益结算、普通小程序实物／服务支付、其他数字内容和小游戏 IAP 分开判断。个人不等于个体工商户；按当前主体资格准备材料，不把流量主开通等同玩家支付。明确长期不虚拟支付的项目保留 `payment.intent: none` 与 `longTermNoVirtualPayment: true`，不擅自新增内购或修改原声明。合同、核身、银行验证、税务、协议与付款交由用户在官方平台处理，准备清单不包含原件和机密。

正式／体验／开发码分别记录，先核对是否发布，再核对普通微信用户实际扫码版本。小游戏不填普通小程序 pages 路由，不增加外壳；参数按当前小游戏接口核准，公开页不可读则明确待核对。码文件、审核通过与正式可访问分别留证。

## 关键判断

- 无实际受控 API 调用，不勾选无关接口。其他真实数据处理使用独立自定义项；本地最高分不等于微信关系或好友排行榜。本地存储也不自动排除个人信息，单个分数性质需结合实际可识别性判断。
- 没有自动过期实现就写真实机制，不编造 0 天/30 天；没有清空入口就不承诺。隐私文本展示、主动同意、受控 API 触发和后台选项分开验证。
- 适龄基于真实内容，建议不是平台评级。个人主体不套单位授权书，Apple 邮箱字段不等同于必须购买会员。
- 单机技术事实与平台声明分开。已确认签署不重复签署；声明适用范围未知不推定备案豁免。费用、审核期限、地区材料和发布条件以当前官方页及账号说明为准。
- 有明确授权才操作对应外部动作；本工具没有通用登录、上传或自动提交能力。生成文件不代表后台保存，上传不代表审核，审核通过不代表已发布。
- 浏览器安全策略阻断即停止该路径，改用脱敏截图/字段及手工填写。不得用 Cookie、CDP、AppleScript、隐藏接口等绕过。

回报时分别写已准备、已验证、待用户/平台处理。所有外部状态绑定具体版本、时间及“用户报告／平台读回”；以实际证据为准。
