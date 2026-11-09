// Maintenance helper: writes only repository templates and anonymous examples.
const fs=require('node:fs'),path=require('node:path'),K=require('../lib/core.js');
const base=path.resolve(__dirname,'..');
function write(name,obj){fs.writeFileSync(path.join(base,name),JSON.stringify(obj,null,2)+'\n');}
write('templates/minigame.json',K.template('minigame'));
write('templates/miniprogram.json',K.template('miniprogram'));
const game=K.template('minigame');
game.project.shortName='纸飞机示例';
Object.assign(game.age,{background:'虚构天空',theme:'纸飞机避障',value:'虚构示例：练习操作与观察。实际适龄判断需核对完整内容。',artStyle:'简洁卡通（示例）',realEvent:'无真实事件（示例）',socialMode:'本地单人（示例）',purchases:'无内购（示例）'});
Object.assign(game.project,{name:'纸飞机穿云（虚构示例）',version:'1.0.0',accountType:'formal',subjectType:'individual',category:'按真实账号核对休闲游戏类目',intro:'操控纸飞机穿过云层与气流，练习避障并记录本机最高分。本案例只演示资料结构。',contactEmail:'contact@example.com',engine:'原生 JavaScript / Canvas 2D，自研',engineEvidence:'虚构证据：src/render.js 使用 Canvas 2D；实际项目需重新检查',businessModel:'当前免费，无广告和内购；未来变更重新核对',reviewInstructions:'无需额外账号。点击开始，左右触控移动飞机，躲避云团。点击暂停可继续或重开。示例无真实可试玩产品。',updateNotes:'首个示例版本描述单局避障、暂停、重新开始及本地最高分。所有功能仅用于演示清单填写。'});
Object.assign(game.network,{technicalFacts:'假设项目本地单人运行，无服务器、登录、广告、支付或云存档；实际项目逐项核查。',futureChanges:'未来接入广告、统计或联网功能前重新核对。'});
Object.assign(game.privacy,{notes:'这是虚构填写示例。没有读取真实代码，不可据此认定任何项目不处理个人信息或免于授权。',dataItems:[{name:'本地游戏记录（最高分）',purpose:'示例：为再次进入时显示最佳成绩，在本机读取和保存最高分；不上传服务器。',storage:'本设备本地缓存（示例假设）',retention:'示例代码假设未设置自动过期；用户或微信清理相应本地数据后记录可能被删除。',deletion:'未实现游戏内清空入口；宿主清理效果待真机验证。',autoExpires:false,evidence:'虚构 src/storage.js:12；必须替换为实际代码证据'}]});
game.content={scenes:'示例使用竖屏纸飞机主题画面，包含开始页、云层中的飞行对局、暂停面板和结算页。道路与云层连续移动，画面显示剩余时间和本局得分。当前假设只有一张循环地图，没有购买或地图解锁。',gameplay:'示例玩家从开始页进入一局飞行挑战，通过左右触控调整飞机位置，避开前方云团并穿过安全空隙。成功通过障碍累计分数，碰撞消耗本局耐久；耐久耗尽时结算失败，坚持到倒计时结束则完成挑战。结算展示本局分数与本机最高分，玩家可重新开始。以上只是虚构案例的功能假设，不能复制到实际不存在这些能力的游戏。',systems:[{id:'control',type:'自定义系统',name:'移动与碰撞',description:'示例通过左右触控移动飞机，碰撞障碍扣除本局耐久；耐久耗尽后停止对局并进入结算。实际判定、反馈与数值应对照项目实现填写。'},{id:'score',type:'自定义系统',name:'计分与结算',description:'示例在通过障碍后累计分数，结算展示本局成绩与本机最高分；分数不能购买、转赠或兑换奖励，也不构成在线排行榜。'},{id:'settings',type:'设置系统',name:'暂停与重开',description:'示例暂停时停止角色、障碍与倒计时更新，继续后恢复当前对局；重新开始重置本局状态并保留本机最高分，真实行为需在运行版本验证。'}]};
game.notes=['此示例是虚构资料，未审计真实代码、未配置真实账号、未附截图、未提交审核。','结构校验可通过，提醒仍保留；需要真实证据后才能推进。'];
write('examples/minigame.json',game);
const program=K.template('miniprogram');
program.project.shortName='书单示例';
Object.assign(program.project,{name:'读书清单（虚构示例）',version:'1.0.0',accountType:'formal',subjectType:'individual',category:'依当前账号核对',intro:'记录待阅读书目与阅读进度的本地示例小程序。',contactEmail:'contact@example.com',reviewInstructions:'进入书单页面添加一本书，编辑阅读进度后重新打开查看。本案例没有实际可运行程序。',updateNotes:'示例首版包含本地书单和阅读进度，具体能力应以源码及实际运行验证。'});
program.network.technicalFacts='假设数据只在本地设备保存，未接入登录、服务器或第三方 SDK。必须检查实际实现。';
program.privacy.notes='书名、备注和阅读记录可能含用户输入的信息；本地保存不能直接判断为不处理个人信息。按实际字段与处理方式审计。';
program.notes=['普通小程序使用自己的类目、功能和隐私要求，不强套小游戏适龄与三系统表。'];
write('examples/miniprogram.json',program);
