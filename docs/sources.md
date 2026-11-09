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
