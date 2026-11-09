# 运营素材、广告、支付与发布交付

本章是**可填写与可检查的准备流程**，不代替账号申请，不承诺资格、流量、收入或平台接受。`operations` 与 `monetization` 是 schemaVersion 1 的可选扩展；旧清单无需迁移。新建清单默认包含扩展，状态全部待确认，不改变项目已确认的商业模式。

## 运营素材

网页可填写游戏简介与详细介绍、推广文案、智能内容运营计划；按需要添加通用封面、横／竖详情推广图、文案配图、推广视频、分享图片及其他素材。槽位清单来自实际账号页面观察，不表示每个账号均有相同栏目或均为必填。游戏简介在运营页编辑；所见页面的游戏详细介绍提示在“设置→基本信息→介绍”修改，分别准备并核对，不自动覆盖提审简介。

每项记录 `id`、`slot`、`label`、`kind`、`path`、`version`、`source`、`description`、`contentReview`、`contentNotes` 和 `constraints`。所有素材路径相对 manifest 所在目录，拒绝越界。运营设计图与真实玩法截图分别标明来源；来源不明保留 `unconfirmed`，不能把设计稿标成真实运行截图。

```json
{
  "id": "general-cover-1",
  "slot": "general-cover",
  "label": "通用素材封面",
  "kind": "image",
  "path": "materials/cover.jpg",
  "version": "1.0.0",
  "description": "展示当前版本核心场景和角色",
  "source": "original-design",
  "contentReview": "pending",
  "contentNotes": "",
  "constraints": {
    "formats": ["JPEG"],
    "width": 650,
    "height": 250,
    "maxBytes": 80000,
    "checkedAt": "",
    "provenance": "账号页面实践起点；使用前复核当前账号"
  }
}
```

通用封面实践页面标明 JPG/JPEG、650×250、≤80 KB，并建议不放游戏图标和游戏名。工具按 **80000 字节**保守检查，保留页面出处与核对日期；这不是微信所有账号永久通用规则。其他图、视频的尺寸与大小在现有证据中未核清，默认不预设。不能继承提审截图的 60 KiB–5 MiB 范围，更不能为了满足下限给运营图加噪声。

`constraints` 支持 `formats`、精确 `width/height`、`minBytes/maxBytes` 和视频 `minDurationSeconds/maxDurationSeconds`。`checkedAt` / `provenance` 记录要求来自哪个当前页面。未填项目会明确显示未检查，不能据部分通过声称全部合格。视频容器支持 MP4/MOV/WEBM；具体可上传格式由账号页面决定。

```sh
node bin/wechat-launch-kit.cjs check-materials .local/manifest.private.json --python .venv/bin/python --json
# ffprobe 不在 PATH 时
node bin/wechat-launch-kit.cjs check-materials .local/manifest.private.json --ffprobe /path/to/ffprobe
```

图片使用 Pillow 解码，核对实际格式、旋转后的尺寸与字节；视频使用本地 ffprobe 读取容器、视频流、显示方向、时长和字节。缺少依赖、损坏文件、假视频、越界路径均不能算通过。检查不转换、裁切或压缩源文件，不判断图中文字、授权或平台审核。画面/文案/版权人工检查完才填 `contentReview: "reviewed"` 与结论。

## 广告与支付路线

| 意图 | 清单取值 | 准备范围 |
|---|---|---|
| 暂未决定 | `unconfirmed` | 保留当前产品事实，不生成虚构申请要求 |
| 不接广告／不接玩家支付 | `none` | 保留用户选择，不强推开通 |
| 小程序／小游戏流量主 | `ads.intent: "traffic-owner"` | 核对当前入口及资格、收益主体/结算信息、合同税务、广告位和实际触发、真机与版本验证 |
| 普通小程序实物／服务收款 | `payment.intent: "physical-goods-services"` | 认证主体、商户号路线、行业资质、结算信息、授权绑定与交易履约 |
| 小游戏虚拟支付 | `payment.intent: "game-iap"` | 独立核准游戏资质、主体、终端及当前规则；通用微信支付开通不代表获得此能力 |
| 其他数字内容 | `payment.intent: "other-digital"` | 先核对实际数字内容政策和可用产品，不当实物支付办理 |

广告收入的收款结算与玩家购买商品/道具支付不同。开通流量主不等于开通游戏内购，也不证明可以向玩家收费。工具不把“个人”与“个体工商户”互换。当前普通小程序支付接入文档支持主体未列个人，个人路线须重新核对；不以普通个人收款码或小微商户能力推导小程序支付资格。小游戏 IAA 与 IAP 资质分别核对，不自动转换。

用户若已明确长期不虚拟支付，将 `payment.intent` 设为 `none`、`longTermNoVirtualPayment` 设为 `true`；继续保留原有平台声明。以后填入虚拟收费路线会报冲突，需用户另行决定，工具不静默修改。该约束适用于该项目，不强加给所有小游戏。

```sh
node bin/wechat-launch-kit.cjs operations-checklist .local/manifest.private.json --json
node bin/wechat-launch-kit.cjs generate .local/manifest.private.json --out .local/review-v2
```

选择路线后，网页“更新开通清单”或 CLI 会列出材料 ID、用途与缺口。给所选渠道的 `materials` 填 `id/intent/status/evidence`：`pending` 待准备；`ready` 表示材料已备齐；`not-required` 须有当前分支依据。**它们均不代表平台申请通过。** 材料的 `intent` 绑定开通路线，同名 ID 在另一条路线下仍显示待准备，历史证据分开保留。仅记录备齐与依据，不填身份证、银行账户、密码、AppSecret、证书私钥或合同原件。

普通小程序支付新商户与已有商户分流：新商户准备当前主体分支要求的证照、负责人身份、结算账户、经营类目/场景、超管与授权；已有商户先核对所需支付权限，再完成公众平台 APPID 授权绑定。申请截图/设计稿按当前分支准备，不能统一要求必须先上线。协议签署、核身、银行验证、税务确认、费率与实际付款均由用户在官方平台处理。交易功能开发、验签回调、发货与退款测试另行验证，本工具不实现收款。

`status` 可为 `unknown/preparing/submitted/approved/enabled`。已提交及以后必须有本次版本、`evidenceType`、原文和观察时间；资格声称符合还要有出处与日期。材料备齐不自动提升状态。申请用户数门槛、费率、结算周期、合同模板或审核期限不写成固定常量。

## 发布与码的交付

先核对 `release` 当前版本证据：开发/体验/审核/通过/发布分别记录。审核通过不能充当发布成功。官方后台入口从 [微信公众平台](https://mp.weixin.qq.com/) 手动选择正确账号，不编造带 token 的后台深链。

`operations.delivery` 记录二维码类型（`release/trial/development`）、官方原码路径、入口、渠道参数、实际扫码版本、证据和观察时间。`status: "verified"` 需要版本与证据；正式码验证还要求 `release.stage: "published"`。二维码文件存在不证明能被普通用户打开；需普通非项目成员微信扫码，核对实际打开的名称、版本与功能。体验或开发码不能当正式码分发。

普通小程序页面路径须对应实际已发布页面；小游戏没有普通小程序的 pages 路由，不能为生成码写入 `pages/index/index` 或增加小程序壳。默认入口可先留空；带参码及 query/scene 的具体参数要按当前小游戏官方接口确认，不从普通小程序 API 复制参数。当前公开文档无法读取时，保留待核对，不要求用户泄露 AppSecret/token。工具不生成伪造微信码、不自动调用账号 API。

核对时优先官方发布/二维码文档与当前账号页面；公开请求失败只代表本次未读到，不表示能力不存在。来源、核对时间与本次未验证范围见 [sources.md](sources.md)。
