# 官方来源与核对范围

公开文档核对日期：**2026-11-08**。版本审核、适龄、内容备案、小游戏隐私和小程序发布文档经匿名 HTTP 读取正文核对；不代表已进入任何登录账号或确认某账号适用条件。公开规则可能更新，实际操作前复核当前页面。以下不包含后台参数深链。

| 事项 | 官方入口 | 用法与边界 |
|---|---|---|
| 后台首页 | [微信公众平台](https://mp.weixin.qq.com/) | 用户选择正确账号，再按页面导航 |
| 小游戏接入 | [接入指南](https://developers.weixin.qq.com/minigame/introduction/guide/index.html) | 概览；不硬编码费用和承诺期限 |
| 小游戏版本审核 | [版本审核](https://developers.weixin.qq.com/minigame/introduction/guide/bbsh.html) | 基本信息、隐私、适龄、更新说明；Apple 开发者账号可填写邮箱，开发者信息非必填；发布条件仍以账号当前要求为准 |
| 适龄 | [适龄提示](https://developers.weixin.qq.com/minigame/introduction/guide/slts.html) | 基于完整内容评估，不统一预设 8+ 或 12+ |
| 游戏内容备案 | [内容备案](https://developers.weixin.qq.com/minigame/introduction/guide/nrjs.html) | 场景、玩法、功能说明及真实截图；截图内容和名称需对应当前版本 |
| IAA | [IAA 资质](https://developers.weixin.qq.com/minigame/introduction/guide/zzsh-iaa.html) | 与虚拟支付规划、主体及内容相关，不等同于“单机”分类 |
| 游戏隐私 | [小游戏隐私保护](https://developers.weixin.qq.com/minigame/dev/guide/open-ability/privacy.html) | 标准 API 与其他自定义类型、展示和同意适配 |
| 小程序隐私 | [隐私指引内容](https://developers.weixin.qq.com/miniprogram/dev/framework/user-privacy/miniprogram-intro.html) | 通用栏目辅助；不替代小游戏运行时指南 |
| 小程序发布 | [协作与发布](https://developers.weixin.qq.com/miniprogram/dev/framework/quickstart/release.html) | 开发、体验、审核、发布等状态分开 |

截图数量、大小和文字字数取自实际表单实践，作为 `requirements` 的可编辑起点；不是对所有账号的官方通用保证。默认三场景、三玩法、三系统、每系统一张，60 KiB–5 MiB，场景 ≥30、玩法 ≥50、系统 ≥30 且 ≤800 字符。名称与简称默认汉字计 2、其他 Unicode 码点计 1；其他文字默认按 Unicode 码点计数。后台可能采用其他口径，最终按页面计数复核。基础资料、适龄细分字段及可调限额见 [清单格式](manifest.md)。

对单机新入口：公开通用指南与当前账号声明要同时看。没有核到具体豁免对象时不承诺免除内容备案或工信备案；也不因公开页未列明例外就否定用户看到的入口。地区、主体、声明和后续功能变化均可能影响适用路径。

关于 `-10000400`：只记录实际业务响应及建议刷新重试，未查到具体字段的官方映射。工具包不传播猜测原因或未知的最终解决方式。

## 2026-11-09：运营与商业化扩展核对

| 证据 | 本次读取情况 | 可用于什么 |
|---|---|---|
| 当前账号运营素材页的脱敏字段观察 | 人工查看长图；原图不进入公开仓库 | 游戏简介与详细介绍、通用封面、横竖详情图、文案、视频、分享图和智能内容运营的槽位起点；通用封面明确 JPG/JPEG、650×250、≤80 KB，且建议不放图标和游戏名；其他媒体数字不清楚，留待当前页面配置 |
| [小程序支付开发接入准备](https://pay.wechatpay.cn/doc/v3/merchant/4015459512) | 2026-11-09 成功读取，页面更新 2026-10-16 | 账号认证、主体范围、新／已有商户、公众平台授权绑定、交易履约分别核对；该支持列表未列个人，不推出个人可开通 |
| [申请 JSAPI 支付权限指引（小程序场景）](https://pay.wechatpay.cn/doc/v3/merchant/4012791895) | 2026-11-09 成功读取，页面更新 2025-07-02 | 普通小程序新商户／已有商户分流；申请商户权限与 APPID 绑定分开，未完善／未上线页面需提供相应截图或设计稿，不统一要求先发布 |
| [小程序支付申请材料](https://pay.wechatpay.cn/static/applyment_guide/applyment_detail_miniapp.shtml) | 2026-11-09 成功读取 | 主体分支材料起点：证照、负责人身份和结算账户；当前行业与主体页面决定完整必填集合，原件只进官方平台 |
| [微信广告流量主成长营资料](https://training.tencentads.com/uploads/202406/p3QdnttL_FhMfKa.pdf) | 搜索索引可见官方 2024 资料；正文读取超时 | 仅保留官方学习入口，不据旧资料锁定当前开通门槛、分成、税务或必填表单 |
| [小游戏获取二维码](https://developers.weixin.qq.com/minigame/dev/guide/open-ability/qrcode.html) | 本次公开读取失败，不能声称已核准当前全部 API 参数 | 待当前官方页面／账号入口复核；小游戏与普通小程序页面路由分开，工具不自动请求生成码 |

本次不提供固定流量用户数门槛、分成、费率、审核时限或个人主体游戏虚拟支付承诺。小程序支付资料不能作为小游戏 IAP 或数字内容支付资格的证明。主体/内容资质、终端、当前合同和结算条件都要在目标账号再次核对。来源不可读不表示能力不存在。
