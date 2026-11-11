/* AOZORA Precision Audit v11. Local-only QA, not automated damage recognition. */
(()=>{'use strict';
const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store='AOZORA_PHOTO_V10_META', precisionStore='AOZORA_PRECISION_V11';
const TASKS=new Map((window.AOZORA_INSURANCE_ITEMS||[]).map(t=>[t.id,t]));
let flags={};try{let v=JSON.parse(localStorage.getItem(precisionStore));if(v&&typeof v==='object'&&!Array.isArray(v))flags=v}catch{}
function current(){try{let id=window.AOZORA_PHOTO_PROJECT_ID?.()||'standalone';return {id,project:JSON.parse(localStorage.getItem(store)||'{}').projects?.[id]||{photos:[],points:[],details:{}}}}catch{return{id:'standalone',project:{photos:[],points:[],details:{}}}}}
function state(id){return flags[id]||(flags[id]={})}
const ITEMS=[
['causality','事故との因果関係を写真・説明で確認'],
['overview','車両全景と損傷近接写真を確認'],
['hidden','分解前後の隠れ損傷・取付部の確認'],
['manual','メーカー修理書・交換条件を確認'],
['index','車種型式・装備に適合する指数表と内包範囲を確認'],
['labor','実施工数／追加作業の必要性を確認'],
['materials','使用材料・数量・外注実費の根拠を確認'],
['safety','ADAS・電装・足回り等の点検要否を確認'],
['double','同一作業・内包工程の二重計上を点検'],
['approval','追加損傷の連絡・協定状況を記録']
];
function save(){try{localStorage.setItem(precisionStore,JSON.stringify(flags))}catch{alert('保存できません。端末ストレージの空き容量を確認してください。')}}
function number(s){if(s===''||s===null||s===undefined)return null;let n=Number(s);return Number.isFinite(n)&&n>=0?n:null}
function analyze(){const {id,project:p}=current(),pts=p.points||[],details=p.details||{},photos=p.photos||[],issues=[],entries=[];const flag=state(id);let total=0,verified=0,unchecked=0;
const add=(level,point,task,msg,fix)=>issues.push({level,point,task,msg,fix});
for(const pt of pts){const saved=flag[pt.id]||{};
 if(!photos.some(ph=>ph.id===pt.photoId))add('要修正',pt.part,'','写真本体の参照が記録と一致しません','元写真を再登録して確認');
 if(!pt.note||pt.note.trim().length<8)add('要確認',pt.part,'','損傷メモが短い／未入力','損傷位置・事故との関係・内部確認結果を記入');
 if(pt.severity==='未確認'||pt.method==='未定')add('要確認',pt.part,'','損傷程度または修理方法が未確定','現車確認後に更新');
 for(const [key,title] of ITEMS){total++;if(saved[key]===true)verified++;else unchecked++}
 }
const used=[];
for(const [key,d] of Object.entries(details)){const sep=key.lastIndexOf('|');if(sep<1)continue;let pt=pts.find(x=>x.id===key.slice(0,sep));if(!pt)continue;const item=TASKS.get(key.slice(sep+1));if(!item)continue;
 const hours=number(d.hours),rate=number(d.rate),material=number(d.materials);
 const amount=(hours!==null&&rate!==null?hours*rate:0)+(material??0);
 entries.push({part:pt.part,photo:photos.find(x=>x.id===pt.photoId)?.name||'',task:item.name,status:d.status||'未確認',hours:d.hours,rate:d.rate,materials:d.materials,amount,source:d.source||'',proof:d.proof||'',note:d.note||''});
 const active=(d.status==='実施・根拠確認済');
 const billed=(hours!==null&&hours>0)||(material!==null&&material>0);
 if(!active&&billed)add('重要確認',pt.part,item.name,'時間または実費が入力されていますが実施・根拠確認済ではありません','作業の実施状況と必要性を確認');
 if(active&&!d.proof?.trim())add('重要確認',pt.part,item.name,'作業根拠（写真・診断結果）が未入力','証拠番号・測定結果を記入');
 if(active&&hours!==null&&hours>0&&!d.source?.trim())add('重要確認',pt.part,item.name,'工数／指数の出典が未入力','型式・表名・版・ページ又は実測根拠を記入');
 if(d.status==='指数内包・対象外'&&billed)add('重複警告',pt.part,item.name,'「指数内包・対象外」なのに金額／工数が入力されています','別途計上の要否を見直す');
 if(billed&&hours!==null&&hours>0&&rate===null)add('要確認',pt.part,item.name,'工数に対するレバーレート未入力','適用時間単価を確認');
 if(hours!==null&&hours>0&&hours>24)add('要確認',pt.part,item.name,'24時間超の工数です','大規模作業なら根拠を明記し入力ミスを確認');
 if(active||billed)used.push({pt,item,key,d,amount});
 }
// Match same physical part + same task across different photo-pins; warn rather than delete.
const groups=new Map();for(const x of used){let k=x.pt.part+'|'+x.item.id;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(x)}
for(const g of groups.values()){if(g.length>1)add('重複警告',g[0].pt.part,g[0].item.name,'同一部位の同一作業が'+g.length+'箇所の損傷ピンに登録されています','別個の作業か一作業かを写真・作業伝票で確認')}
const amounts=entries.filter(r=>r.status==='実施・根拠確認済').reduce((sum,r)=>sum+r.amount,0);
return {id,p,issues,entries,total,verified,unchecked,amounts};}
let last;
function render(){const data=last=analyze(),summary=$('precisionSummary'),issues=$('precisionIssues'),checks=$('precisionChecklist');
 summary.textContent=`写真 ${data.p.photos?.length||0} 枚 / 損傷ピン ${data.p.points?.length||0} 箇所 / 入力済み細目 ${data.entries.length} 件 / チェック ${data.verified}/${data.total} 件 / 要確認・警告 ${data.issues.length} 件。確認済み細目の入力額合計 ${Math.round(data.amounts).toLocaleString('ja-JP')}円（税抜・保険認定額ではありません）。`;
 issues.replaceChildren();if(!data.issues.length){issues.innerHTML='<p class="notice">現在の入力値に対する自動チェックで警告はありません。損傷なし・請求妥当・公式指数確認済みを意味しません。</p>'}else{const order={'重複警告':0,'重要確認':1,'要修正':2,'要確認':3};for(const i of [...data.issues].sort((a,b)=>order[a.level]-order[b.level]).slice(0,100)){let el=document.createElement('div');el.className='candidate';el.innerHTML=`<strong>${esc(i.level)}｜${esc(i.point)} ${esc(i.task)}</strong><p>${esc(i.msg)}</p><p class="muted">対処：${esc(i.fix)}</p>`;issues.append(el)}if(data.issues.length>100)issues.insertAdjacentHTML('beforeend','<p class="muted">警告は最初の100件を表示しています。CSVですべて確認できます。</p>')}
 checks.replaceChildren();for(const pt of data.p.points||[]){let box=document.createElement('details');box.className='candidate';let saved=state(data.id)[pt.id]||{};let done=ITEMS.filter(([k])=>saved[k]).length;box.innerHTML=`<summary><strong>${esc(pt.part)} / ${esc(pt.damage)}</strong> <span class="chip">${done}/${ITEMS.length} 項目完了</span></summary><p class="muted">写真：${esc(data.p.photos.find(ph=>ph.id===pt.photoId)?.name||'写真不明')}　※チェックは作業者の確認記録です。</p>`;for(const [key,title] of ITEMS){let label=document.createElement('label');label.className='linecheck';let cb=document.createElement('input');cb.type='checkbox';cb.checked=!!saved[key];cb.onchange=()=>{let b=state(data.id)[pt.id]||(state(data.id)[pt.id]={});b[key]=cb.checked;save();render()};label.append(cb,document.createTextNode(title));box.append(label)}checks.append(box)}if(!(data.p.points||[]).length)checks.innerHTML='<p class="muted">写真を取り込み損傷ピンを登録すると、箇所別のチェックリストが表示されます。</p>';
}
function csvRow(vals){return vals.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')}
function download(name,content){let url=URL.createObjectURL(new Blob(['\ufeff'+content],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('precisionRun').onclick=render;
$('precisionCSV').onclick=()=>{let data=analyze(),rows=[['種類','重要度','損傷部位','作業','内容','対処'],...data.issues.map(v=>['警告',v.level,v.point,v.task,v.msg,v.fix]),...data.entries.map(v=>['作業','',v.part,v.task,'判定:'+v.status+' / 写真:'+v.photo+' / 時間:'+v.hours+' / 単価:'+v.rate+' / 実費:'+v.materials+' / 税抜試算:'+v.amount+' / 出典:'+v.source+' / 根拠:'+v.proof,'要現車・指数確認'])];download('AOZORA_精密監査_v11_'+new Date().toISOString().slice(0,10)+'.csv',rows.map(csvRow).join('\r\n'))};
$('precisionJSON').onclick=()=>{const {id}=current(),payload={version:11,projectId:id,flags:state(id)};let a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));a.href=url;a.download='AOZORA_精密チェック_v11.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$('precisionImport').onchange=async e=>{let file=e.target.files?.[0];if(!file)return;try{let o=JSON.parse(await file.text()),{id,p:project}=analyze();if(o.version!==11||!o.flags||typeof o.flags!=='object'||Array.isArray(o.flags))throw Error('形式が違います');if(!confirm('現在の案件の精密チェックを復元しますか？ （写真や作業明細は変更しません）'))return;let allowed=new Set(project.points.map(p=>p.id)),clean={};for(const [point,obj] of Object.entries(o.flags).slice(0,250)){if(!allowed.has(point)||!obj||typeof obj!=='object')continue;clean[point]={};for(const [k] of ITEMS)clean[point][k]=obj[k]===true}flags[id]=clean;save();render()}catch(err){alert('復元できません: '+err.message)}finally{e.target.value=''}};
// Refresh on entering page or switching project, preserving v10 data format.
document.querySelectorAll('[data-page="photolab"]').forEach(x=>x.addEventListener('click',()=>setTimeout(render,50)));
render();
})();
