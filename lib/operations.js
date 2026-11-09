(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LaunchOperations = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const object=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
  const filled=v=>typeof v==='string'&&!!v.trim();
  const localPath=v=>filled(v)&&!(/^(?:[a-z]:|\/|\\)/i.test(v)||v.includes('\\')||v.includes(':')||v.split('/').includes('..'));
  const slots=[['general-cover','通用素材封面','image'],['detail-vertical','详情推广图（竖版）','image'],['detail-horizontal','详情推广图（横版）','image'],['promotion-article-image','推广文案配图','image'],['promotion-video','推广视频','video'],['share-image','分享图片','image'],['other','其他运营素材','image']];
  const sourceLinks=[['微信广告官方学习资料（2024，当前资格仍核对后台）','https://training.tencentads.com/uploads/202406/p3QdnttL_FhMfKa.pdf'],['小程序支付开发接入准备','https://pay.wechatpay.cn/doc/v3/merchant/4015459512'],['小程序支付申请材料','https://pay.wechatpay.cn/static/applyment_guide/applyment_detail_miniapp.shtml'],['微信支付商户平台','https://pay.weixin.qq.com/']];
  function material(slot='other',version='') {
    const selected=slots.find(x=>x[0]===slot)||slots.at(-1);
    return {id:slot,label:selected[1],slot:selected[0],kind:selected[2],path:'',version,description:'',source:'unconfirmed',contentReview:'pending',contentNotes:'',constraints:slot==='general-cover'?{formats:['JPEG'],width:650,height:250,maxBytes:80000,checkedAt:'',provenance:'账号页面实践起点：JPEG，650×250，≤80 KB；80 KB 以 80000 字节保守检查，使用前复核本账号'}:{formats:[],checkedAt:'',provenance:'待对照当前账号页面填写尺寸、字节及视频时长；不继承审核截图限制'}};
  }
  function operationsTemplate(){return {checkedAt:'',provenance:'',gameIntro:'',detailedIntro:'',promotionCopy:'',smartContentPlan:'',materials:[],delivery:{qrKind:'unconfirmed',qrPath:'',entryPath:'',query:'',status:'unverified',version:'',evidenceType:'none',evidence:'',observedAt:''}};}
  function channel(){return {status:'unknown',eligibility:'unknown',checkedAt:'',provenance:'',version:'',evidenceType:'none',evidence:'',observedAt:'',materials:[]};}
  function monetizationTemplate(){return {ads:{...channel(),intent:'unconfirmed',placementPlan:''},payment:{...channel(),intent:'unconfirmed',longTermNoVirtualPayment:false,subjectDetail:'unknown',merchantRoute:'unconfirmed',scenario:''}};}
  const adsItems=[['eligibility','当前账号开通资格与入口','按小游戏／小程序、主体、当前后台核对门槛；不预设 500 用户等固定数字'],['settlement-identity','收益主体与收款信息','按后台当前个人或组织分支核对；身份与银行原件只在官方平台填写'],['agreements','广告合同、结算及税务事项','由用户在官方平台确认适用合同、税务资料与签署'],['placements','广告位与真实触发场景','选择当前账号可用广告类型，记录奖励、关闭与失败回退，不诱导点击'],['ad-runtime','广告接入与版本验证','创建广告位、接入、真机验证、版本审核和正式展示分别留证']];
  const payItems=[['scenario','支付业务与主体适配','先区分普通小程序实物／服务、其他数字内容和小游戏虚拟支付'],['identity','主体证照与负责人身份材料','个体工商户／企业等按当前官方分支核对；不收集证件号码或照片'],['settlement','结算账户信息','按主体与银行账户类型核对；账号及凭证只留在官方平台'],['industry','经营类目、经营场景及补充资质','按实际售卖内容、当前页面与行业要求核对'],['administrator','超级管理员及授权材料','仅在当前申请分支要求时准备，完成本人核身／授权'],['merchant','新商户号或已有商户号权限','按实际商户路线申请；小程序支付权限与账号认证分别核对'],['binding','商户号与 APPID 授权绑定','商户侧发起、公众平台确认；不要把已填 AppID 当绑定成功'],['agreements','支付协议、账户验证及当前费率','用户在官方平台核对签署、结算周期与费用，不由工具代签或付款'],['payment-runtime','交易履约、回调、退款与正式验证','按适用规范核对发货管理；验签、服务端到账与退款测试另行实施']];
  const iapItems=[['scenario','小游戏虚拟支付商品与终端','确认当前游戏实际售卖内容和终端；不套普通小程序实物收款'],['eligibility','当前小游戏 IAP 资格','按官方虚拟支付入口核对主体、内容资质与适用政策，不推定个人可开通'],['game-qualifications','游戏内容资质与授权材料','按当前 IAP 分支收集资质缺口，不把 IAA 审核或单机声明当 IAP 批准'],['iap-config','游戏虚拟支付产品配置','按当前官方游戏支付产品准备配置与测试环境；不自动调用普通小程序支付接口'],['agreements','游戏支付与结算协议','用户在官方平台核对分成、结算、终端政策和签署，不以普通支付费率替代'],['payment-runtime','游戏购买、到账与退款验证','服务端验签、商品发放、重复通知、失败回退和退款按游戏产品独立验证']];
  const digitalItems=[['scenario','数字内容性质与终端','确认实际内容与消费场景，先核对可用政策和产品'],['eligibility','数字内容支付资格与产品','独立核准主体、类目、终端和当前准入；不推定通用微信支付可用'],['agreements','数字内容合同与结算规则','按已确认的产品与主体查阅当前协议，用户本人完成'],['payment-runtime','数字内容交付与退款验证','产品路线确认后再准备技术和正式环境验证']];
  const paymentItems=intent=>intent==='game-iap'?iapItems:intent==='other-digital'?digitalItems:payItems;
  function checklist(m){
    const mon=m.monetization||{},out=[];
    for(const [group,items] of [['ads',adsItems],['payment',payItems]]){
      const c=mon[group];if(!object(c)||!c.intent||['unconfirmed','none'].includes(c.intent))continue;
      const list=Array.isArray(c.materials)?c.materials:[];
      for(const [id,label,note] of (group==='payment'?paymentItems(c.intent):items)){const row=list.find(x=>object(x)&&x.id===id&&x.intent===c.intent)||{};out.push({group,intent:c.intent,id,label,status:row.status||'pending',evidence:row.evidence||'',note});}
    }
    return out;
  }
  function validate(m){
    const errors=[],warnings=[];const err=(path,message)=>errors.push({path,message}),warn=(path,message)=>warnings.push({path,message});
    const text=(o,k,p)=>{if(o[k]!==undefined&&typeof o[k]!=='string')err(p+'.'+k,'须为文本');};
    const evidence=(o,p)=>{
      if(!['none','user-report','platform-readback'].includes(o.evidenceType))err(p+'.evidenceType','无效证据来源');
      if(o.version!==m.project.version||!filled(o.evidence)||!filled(o.observedAt)||!['user-report','platform-readback'].includes(o.evidenceType))err(p+'.evidence','外部状态必须有当前版本、观察时间、状态原文及证据来源');
    };
    if(m.operations!==undefined){
      const o=m.operations;if(!object(o))err('operations','须为对象');else{
        for(const k of ['checkedAt','provenance','gameIntro','detailedIntro','promotionCopy','smartContentPlan'])text(o,k,'operations');
        if(!filled(o.checkedAt)||!filled(o.provenance))warn('operations.checkedAt','运营素材要求尚未对照当前账号页面；不能把示例当统一规则');
        if(!Array.isArray(o.materials))err('operations.materials','须为数组');else{
          const ids=new Set();for(const [i,a] of o.materials.entries()){
            const p=`operations.materials[${i}]`;if(!object(a)){err(p,'须为对象');continue;}
            if(!filled(a.id)||ids.has(a.id))err(p+'.id','素材 ID 必填且不可重复');ids.add(a.id);
            if(!filled(a.label)||!slots.some(x=>x[0]===a.slot))err(p+'.slot','填写支持的素材栏目和标签');
            if(!['image','video'].includes(a.kind))err(p+'.kind','须为 image / video');
            for(const k of ['id','label','path','version','description','contentNotes'])text(a,k,p);
            if(a.path&&!localPath(a.path))err(p+'.path','文件路径须位于清单目录内，不得越界');
            if(!filled(a.path))warn(p+'.path','尚未选择本地素材文件');
            if(a.version!==m.project.version)err(p+'.version','素材须绑定本次版本');
            if(!['unconfirmed','game-capture','original-design','licensed','mixed'].includes(a.source))err(p+'.source','无效素材来源');
            if(a.source==='unconfirmed')warn(p+'.source','核对素材来源、游戏内容一致性及授权');
            if(!['pending','reviewed'].includes(a.contentReview))err(p+'.contentReview','须为 pending / reviewed');
            if(a.contentReview==='reviewed'&&!filled(a.contentNotes))err(p+'.contentNotes','已人工检查须记录真实内容和版权核对结论');
            if(a.contentReview!=='reviewed')warn(p+'.contentReview','待人工检查画面、文字、版权；通用封面按所见页面建议不放图标和游戏名');
            const c=a.constraints;if(!object(c)){err(p+'.constraints','须为对象');continue;}
            for(const [k,v] of Object.entries(c)){
              if(['width','height','minBytes','maxBytes'].includes(k)&&(!Number.isSafeInteger(v)||v<=0))err(p+'.constraints.'+k,'须为正整数');
              else if(['minDurationSeconds','maxDurationSeconds'].includes(k)&&(!Number.isFinite(v)||v<0))err(p+'.constraints.'+k,'须为非负秒数');
              else if(!['width','height','minBytes','maxBytes','minDurationSeconds','maxDurationSeconds','formats','checkedAt','provenance'].includes(k))err(p+'.constraints.'+k,'未知素材限制字段');
            }
            if(!Array.isArray(c.formats)||c.formats.some(v=>typeof v!=='string'||!['JPEG','PNG','WEBP','MP4','MOV','WEBM'].includes(v)))err(p+'.constraints.formats','格式须用 JPEG/PNG/WEBP/MP4/MOV/WEBM 数组');
            else if(c.formats.some(v=>!(a.kind==='image'?['JPEG','PNG','WEBP']:['MP4','MOV','WEBM']).includes(v)))err(p+'.constraints.formats','格式集合与图片／视频类型不匹配');
            for(const k of ['checkedAt','provenance'])text(c,k,p+'.constraints');
            if(c.minBytes>c.maxBytes||c.minDurationSeconds>c.maxDurationSeconds)err(p+'.constraints','最小值不能超过最大值');
            if(a.kind==='image'&&(c.minDurationSeconds!==undefined||c.maxDurationSeconds!==undefined))err(p+'.constraints','图片不能设置视频时长');
            if(!filled(c.checkedAt)||!filled(c.provenance))warn(p+'.constraints','尺寸、大小和时长要求尚未对照当前页面');
            if(!c.width||!c.height||!c.maxBytes||!c.formats?.length||(a.kind==='video'&&c.maxDurationSeconds===undefined))warn(p+'.constraints','检查规格不完整；未配置的项目不会被视为通过');
          }
        }
        const d=o.delivery;if(!object(d))err('operations.delivery','须为对象');else{
          for(const k of ['qrPath','entryPath','query','version','evidence','observedAt'])text(d,k,'operations.delivery');
          if(!['unconfirmed','release','trial','development'].includes(d.qrKind))err('operations.delivery.qrKind','无效二维码版本');
          if(d.qrPath&&!localPath(d.qrPath))err('operations.delivery.qrPath','二维码文件须在清单目录内');
          if(!['unverified','verified'].includes(d.status))err('operations.delivery.status','无效访问验证状态');
          if(m.project.kind==='minigame'&&filled(d.entryPath)&&!d.entryPath.startsWith('?'))err('operations.delivery.entryPath','小游戏没有普通小程序 page 路由；入口参数先按官方小游戏接口核对，不填 pages/index/index');
          if(d.status==='verified'){
            evidence(d,'operations.delivery');
            if(!filled(d.qrPath))err('operations.delivery.qrPath','二维码验证须记录本地原图路径');
            if(d.qrKind==='unconfirmed')err('operations.delivery.qrKind','已验证二维码须确认正式／体验／开发版本');
            if(d.qrKind==='release'&&m.release.stage!=='published')err('operations.delivery.status','正式访问验证须与已发布状态匹配；通过审核不代表正式码已可访问');
          }
        }
      }
    }
    if(m.monetization!==undefined){
      const mon=m.monetization;if(!object(mon))err('monetization','须为对象');else for(const group of ['ads','payment']){
        const c=mon[group],p='monetization.'+group;if(!object(c)){err(p,'须为对象');continue;}
        for(const k of ['checkedAt','provenance','version','evidenceType','evidence','observedAt',...(group==='ads'?['placementPlan']:['scenario'])])text(c,k,p);
        const choices=group==='ads'?['unconfirmed','none','traffic-owner']:['unconfirmed','none','physical-goods-services','game-iap','other-digital'];
        if(!choices.includes(c.intent))err(p+'.intent','无效开通路线');
        if(!['unknown','preparing','submitted','approved','enabled'].includes(c.status))err(p+'.status','无效开通状态');
        if(!['unknown','eligible','ineligible'].includes(c.eligibility))err(p+'.eligibility','无效资格状态');
        if(['submitted','approved','enabled'].includes(c.status))evidence(c,p);
        if(['approved','enabled'].includes(c.status)&&c.eligibility!=='eligible')err(p+'.eligibility','开通状态必须有当前账号资格记录');
        if(c.eligibility==='eligible'&&(!filled(c.provenance)||!filled(c.checkedAt)))err(p+'.eligibility','资格已核对须记录当前页面出处和日期');
        if(!Array.isArray(c.materials))err(p+'.materials','须为数组');else{
          const ids=new Set();const allowed=(group==='ads'?adsItems:[...payItems,...iapItems,...digitalItems]).map(x=>x[0]);for(const [i,row] of c.materials.entries()){
            const r=p+`.materials[${i}]`;if(!object(row)){err(r,'须为对象');continue;}
            const rowKey=(row.intent||'unconfirmed')+'/'+row.id;
            if(!allowed.includes(row.id)||ids.has(rowKey))err(r+'.id','使用清单中的材料 ID，同一路线不可重复');ids.add(rowKey);
            if(row.intent!==undefined&&!choices.includes(row.intent))err(r+'.intent','材料路线无效');
            if(row.status!=='pending'&&!choices.filter(v=>!['unconfirmed','none'].includes(v)).includes(row.intent))err(r+'.intent','已准备／不适用材料必须绑定所对应的开通路线，不能跨路线复用证据');
            if(!['pending','ready','not-required'].includes(row.status))err(r+'.status','须为 pending / ready / not-required');
            if(row.status!=='pending'&&!filled(row.evidence))err(r+'.evidence','就绪或不适用须有证据；仅记录是否备齐，不放证件／银行详情');
          }
        }
        if(!['unconfirmed','none'].includes(c.intent)&&(!filled(c.checkedAt)||!filled(c.provenance)))warn(p+'.checkedAt','开通条件、主体分支及当前材料要求待后台核对');
        if(group==='payment'){
          if(typeof c.longTermNoVirtualPayment!=='boolean')err(p+'.longTermNoVirtualPayment','须为布尔值');
          if(c.longTermNoVirtualPayment&&['game-iap','other-digital'].includes(c.intent))err(p+'.intent','与已确认长期不虚拟支付的范围冲突；保留原声明，由用户另行决策');
          if(!['unknown','individual','sole-proprietor','enterprise','public-institution','government','social-organization'].includes(c.subjectDetail))err(p+'.subjectDetail','无效商户主体细分');
          if(!['unconfirmed','new','existing'].includes(c.merchantRoute))err(p+'.merchantRoute','无效商户号路线');
          if(c.intent==='game-iap'&&m.project.kind!=='minigame')err(p+'.intent','小游戏虚拟支付路线不能用于普通小程序');
          if(c.intent==='physical-goods-services'&&m.project.kind==='minigame')err(p+'.intent','不能把普通小程序实物／服务支付套用到小游戏虚拟支付');
          if(['physical-goods-services','other-digital'].includes(c.intent)&&(m.project.subjectType==='individual'||c.subjectDetail==='individual'))err(p+'.intent','当前官方普通小程序支付支持主体未列个人；个人与个体工商户不同，先核对实际可用路线');
          if(['game-iap','other-digital'].includes(c.intent))warn(p+'.intent','数字内容／游戏虚拟支付须独立核准资格、内容资质、终端及当前支付政策；通用微信支付资料不代表可开通');
        }
      }
    }
    return {errors,warnings};
  }
  function fields(m){
    const rows=[],add=(label,value,note='')=>rows.push({label,value:String(value||''),note,characters:[...String(value||'')].length});
    const o=m.operations;if(object(o)){
      add('运营：游戏简介',o.gameIntro,'运营页编辑简介；与详细介绍分别核对');add('运营：游戏详细介绍',o.detailedIntro,'所见页面提示在设置→基本信息→介绍修改；不自动覆盖 project.intro');add('运营：推广文案',o.promotionCopy,'只写当前可玩的真实内容');add('运营：智能内容运营计划',o.smartContentPlan,'记录页面可用入口和计划；未设置不等于启用');
      for(const a of Array.isArray(o.materials)?o.materials:[])if(object(a))add('运营素材：'+a.label,`${a.path||'待准备'}\n版本：${a.version||'待核对'}\n用途：${a.description||'待填写'}\n来源：${a.source||'待核对'}\n人工检查：${a.contentReview||'pending'} ${a.contentNotes||''}\n限制：${JSON.stringify(a.constraints||{})}`,'CLI check-materials 读取真实图片／视频；不证明版权、真实性或平台审核通过');
      const d=o.delivery||{};add('发布与扫码交付',`二维码：${d.qrKind||'unconfirmed'} | ${d.qrPath||'待下载官方原码'}\n入口：${d.entryPath||'默认入口'}\n渠道参数：${d.query||'无'}\n验证：${d.status||'unverified'}\n版本：${d.version||'待记录'}\n来源：${d.evidenceType||'none'}\n观察时间：${d.observedAt||'待记录'}\n证据：${d.evidence||'无'}`,m.project.kind==='minigame'?'小游戏没有 pages 路由；先核准发布状态，再用官方正式码普通微信用户扫码验证；体验／开发码单独标注':'小程序使用实际已发布页面路径；正式码、体验码、开发预览码分别验证');
    }
    const mon=m.monetization;if(object(mon))for(const group of ['ads','payment']){
      const c=mon[group];if(!object(c))continue;
      add(group==='ads'?'广告／流量主开通路线':'支付开通路线',`${c.intent}\n资格：${c.eligibility}\n状态：${c.status}\n版本：${c.version||'待记录'}\n依据：${c.provenance||'待核对'}\n核对日期：${c.checkedAt||'未记录'}\n证据来源：${c.evidenceType||'none'}\n状态原文：${c.evidence||'无'}\n观察时间：${c.observedAt||'未记录'}${group==='payment'?`\n长期不虚拟支付：${c.longTermNoVirtualPayment?'已确认':'未设此限制'}\n主体细分：${c.subjectDetail}\n商户号：${c.merchantRoute}\n场景：${c.scenario||'待填写'}`:`\n广告场景：${c.placementPlan||'待填写'}`}`,'广告收益收款与玩家消费支付分别申请；合同、核身、税务、账户验证和付款由用户在官方平台完成');
    }
    for(const r of checklist(m))add(`${r.group==='ads'?'流量主':'支付'}材料：${r.label}`,`${r.status}\n${r.evidence||'待准备／待核对'}`,r.note);
    return rows;
  }
  return {slots,sourceLinks,material,operationsTemplate,monetizationTemplate,checklist,validate,fields,localPath};
});
