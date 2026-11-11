/* AOZORA v15: cross-point review, read-only sources; manual resolution notes only. */
(()=>{'use strict';
const $=s=>document.getElementById(s);
const S='AOZORA_OVERLAP_V15',W='AOZORA_WORKFLOW_V12',P='AOZORA_PHOTO_V10_META';
const PROCS=[
'現車全体撮影','分解前OBDスキャン','関連部品の取外し','分解後損傷確認・追加撮影','損傷部寸法測定','取付ブラケット亀裂確認','事故変形した相手パネル修正','リインホース・エネルギー吸収材確認','フレーム基準点測定','修正機セット・計測','スポット溶接・接合部復元','一回使用ボルト・クリップ確認',
'板金引出し・成形','パネル切開・位置決め','仮組みと隙間測定','交換パネルのプライマー・裏面処理','接着剤・リベット・溶接材','破損取付部・クリップ交換',
'損傷面剥離・研磨','パテ整形・サフェーサー','調色・試し吹き','隣接パネルぼかし','3コート・特殊色工程','塗装材料費の明細化','裏面・端面の塗装復元','磨き・仕上がり検査',
'シーラー形状復元','溶接部防錆・内部ワックス','アンダーコート・チッピング復元','防水・水密テスト',
'事故関連ハーネス確認','部品交換後の初期化','ADAS校正実施','作業後OBD診断・DTC確認','灯火光軸測定・調整','HV/EV高電圧安全処置',
'四輪アライメント測定','四輪アライメント調整','タイヤ組替・バランス','冷媒回収・真空引・充填','冷却水回収・補充・エア抜き',
'外注エーミング実費','外注アライメント実費','車両回送・陸送','事故関連部品処分実費','特殊治具使用・レンタル',
'建付け・締結確認','塗膜・色差・肌確認','路上試運転・警告灯確認','追加事故損傷の再協定'
];
const rules=[
{id:'color',label:'調色・試し吹き',match:[20],mode:'accident',severity:'高',explain:'同色を同一塗装工程で調色した場合、各損傷ピンで重複計上していないか確認。別ロット・異なる塗色なら別作業の可能性。'},
{id:'scanbefore',label:'分解前OBD診断',match:[1],mode:'accident',severity:'高',explain:'同一診断セッションを複数ピンに記録した場合は一括管理を検討。再診断の日時・理由がある場合は別。'},
{id:'scanafter',label:'作業後OBD診断',match:[33],mode:'accident',severity:'高',explain:'同一完了診断を重複していないか確認。別の診断時点や故障対応の記録があれば区別。'},
{id:'measure',label:'車体基準点測定',match:[8],mode:'accident',severity:'中',explain:'共通測定表を複数パネルに転記していないか確認。別測定セッションなら証拠を分離。'},
{id:'jig',label:'修正機セット',match:[9],mode:'accident',severity:'中',explain:'同一の修正機セット作業は案件内で重複しないよう確認。セット替えがあれば別記録。'},
{id:'paintmaterials',label:'塗装材料費',match:[23],mode:'accident',severity:'中',explain:'同一材料伝票を複数明細で重複計上していないか確認。パネル別実使用量は根拠で区別。'},
{id:'drive',label:'試運転',match:[48],mode:'accident',severity:'中',explain:'同一試運転を複数の損傷位置に計上していないか確認。異なる試験・日付なら別。'},
{id:'transport',label:'回送・陸送',match:[43],mode:'accident',severity:'高',explain:'同一移動区間・同一伝票を複数請求していないか確認。複数回は日付と区間を記載。'},
{id:'blend',label:'隣接パネルぼかし',match:[21],mode:'part',severity:'中',explain:'同一隣接パネルの同一塗装工程か確認。部位名称だけでは判定できないため施工範囲を照合。'},
{id:'mask',label:'関連部品の取外し',match:[2],mode:'part',severity:'中',explain:'同一部品の脱着が各交換指数に内包される可能性。車種別指数範囲と脱着対象を照合。'},
{id:'seal',label:'シーラー・防錆',match:[26,27,28],mode:'part',severity:'中',explain:'同一施工範囲で防錆材料・塗装材料・工程が重複していないか確認。別部位なら独立可。'},
{id:'adas',label:'ADAS校正 内製／外注',match:[32,41],mode:'mixed',severity:'高',explain:'同一校正対象を外注実費と自社工賃で二重計上していないか確認。別センサー・別作業なら根拠を分離。'},
{id:'alignment',label:'アライメント 内製／外注',match:[36,37,42],mode:'mixed',severity:'高',explain:'測定と調整は別工程の場合あり。外注一式に含まれる測定・調整を内製工賃でも計上していないか請求明細を確認。'}
];
let history={version:15,projects:{}};try{const old=JSON.parse(localStorage.getItem(S)||'null');if(old?.projects&&typeof old.projects==='object')history=old}catch{}
const id=()=>window.AOZORA_PHOTO_PROJECT_ID?.()||'standalone';
const project=()=>history.projects[id()]||(history.projects[id()]={reviews:{},updated:''});
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')}catch{return{}}};
const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=n=>Math.round(n).toLocaleString('ja-JP')+'円';
const num=n=>n===''||n==null?null:Number.isFinite(Number(n))&&Number(n)>=0?Number(n):null;
function save(){try{project().updated=new Date().toISOString();localStorage.setItem(S,JSON.stringify(history));$('v15Saved').textContent='保存済'}catch(e){$('v15Saved').textContent='保存失敗。JSON書き出しを利用してください'}}
function records(){const raw=read(W).projects?.[id()]?.entries||{},pts=read(P).projects?.[id()]?.points||[];return Object.entries(raw).flatMap(([k,v])=>{if(!v||!['実施・別途確認','実施・内包'].includes(v.status))return[];const i=Number(k.slice(k.lastIndexOf('|')+1)),pt=k.slice(0,k.lastIndexOf('|'));if(!Number.isInteger(i)||i<0||i>=PROCS.length)return[];const p=pts.find(x=>String(x.id)===pt),h=num(v.hours),r=num(v.rate),c=num(v.cost);return[{key:k,proc:i,name:PROCS[i],point:pt,part:pt==='common'?'案件共通':p?.part||'写真ピン不明',missing:pt!=='common'&&!p,status:v.status,scope:v.indexScope,source:v.source||'',evidence:v.evidence||'',approval:v.approval||'',memo:v.memo||'',amount:(h===null||r===null?0:h*r)+(c??0),priced:(h!==null&&r!==null)||c!==null}]})}
const identity=x=>x.point==='common'?'common':x.part.replace(/右|左|前|後|フロント|リア|\s/g,'');
function detect(rs){let output=[];for(const rule of rules){const found=rs.filter(x=>rule.match.includes(x.proc)&&x.status==='実施・別途確認');if(found.length<2)continue;let groups=[];
if(rule.mode==='accident'||rule.mode==='mixed')groups=[found];else{const map=new Map();found.forEach(x=>{const k=identity(x);map.set(k,[...(map.get(k)||[]),x])});groups=[...map.values()].filter(v=>v.length>1)}
for(const g of groups){if(g.length<2)continue;
if(rule.mode!=='mixed'&&new Set(g.map(x=>x.point)).size===1)continue;
if(rule.mode==='mixed'&&!((g.some(x=>[32,36,37].includes(x.proc))&&g.some(x=>[41,42].includes(x.proc)))||new Set(g.map(x=>x.point)).size>1))continue;
const key=rule.id+'|'+g.map(x=>x.key).sort().join('~');output.push({key,rule,items:g,amount:g.reduce((a,x)=>a+x.amount,0),missing:g.some(x=>x.missing),weak:g.filter(x=>!x.source||!x.evidence||x.scope!=='別途根拠確認済'||!x.priced)})}}
return output.sort((a,b)=>(a.rule.severity==='高'?0:1)-(b.rule.severity==='高'?0:1))}
function download(name,body,mime){const u=URL.createObjectURL(new Blob([body],{type:mime})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),4000)}
function quoteCsv(v){return '"'+String(v??'').replace(/"/g,'""')+'"'}
let current=[];
function render(){const rs=records(),duplicates=detect(rs);current=duplicates;const state=project().reviews;let open=duplicates.filter(x=>state[x.key]?.decision!=='確認済・別作業'||!state[x.key]?.reason?.trim());let high=open.filter(x=>x.rule.severity==='高').length;
$('v15Stats').textContent=`対象工程 ${rs.length}件 ／ 重複の可能性 ${duplicates.length}組 ／ 未解決 ${open.length}組（高優先 ${high}組）／ 参考登録額合計 ${fmt(rs.filter(x=>x.status==='実施・別途確認').reduce((n,x)=>n+x.amount,0))}`;
$('v15Caution').textContent='表示金額は工程台帳に登録された金額の単純合計です。重複額・削減可能額・保険認定額ではありません。金額未入力の工程も含まれます。';
const show=$('v15Filter').value==='all'?duplicates:duplicates.filter(x=>!state[x.key]?.decision||state[x.key]?.decision==='未確認'||!state[x.key]?.reason?.trim());let root=$('v15List');root.replaceChildren();
if(!show.length){root.innerHTML='<p class="good">現在の条件で候補はありません。ゼロ件は重複がないことの保証ではありません。</p>';return}
for(const d of show){const rev=state[d.key]||(state[d.key]={decision:'未確認',reason:'',updated:''});let box=document.createElement('div');box.className='candidate';let head=document.createElement('h3');head.textContent=`${d.rule.severity==='高'?'【優先確認】':'【確認】'} ${d.rule.label}（${d.items.length}登録）`;box.append(head);let exp=document.createElement('p');exp.className='muted';exp.textContent=d.rule.explain;box.append(exp);
let tbl=document.createElement('div');tbl.className='tablewrap';let t=document.createElement('table');t.style.minWidth='640px';let thead=document.createElement('thead');thead.innerHTML='<tr><th>登録箇所</th><th>工程</th><th>入力金額</th><th>証拠・指数</th><th>協定</th></tr>';t.append(thead);let tb=document.createElement('tbody');for(const x of d.items){let tr=document.createElement('tr');[x.part,x.name,x.priced?fmt(x.amount):'未算定',`${x.source?'出典あり':'出典なし'} / ${x.evidence?'証拠あり':'証拠なし'} / ${x.scope||'未確認'}`,x.approval].forEach(a=>{let td=document.createElement('td');td.textContent=a;tr.append(td)});tb.append(tr)}t.append(tb);tbl.append(t);box.append(tbl);
if(d.weak.length||d.missing){let note=document.createElement('p');note.className='notice';note.textContent=`根拠・金額の要確認 ${d.weak.length}件${d.missing?' / 削除済み損傷ピンの参照あり':''}。同じ作業かどうかは実施日時、対象部位、外注伝票、公式指数内包範囲で判断してください。`;box.append(note)}
let form=document.createElement('div');form.className='grid two';let label=document.createElement('label');label.textContent='照合結果';let select=document.createElement('select');['未確認','重複の疑い・協議中','確認済・同一作業','確認済・別作業','対象外（理由記録）'].forEach(v=>select.add(new Option(v,v)));select.value=rev.decision;label.append(select);let why=document.createElement('label');why.textContent='照合根拠・実施日時・資料番号';let input=document.createElement('textarea');input.value=rev.reason;input.placeholder='例：右ドアと左ドアは別工程。施工写真5、7と作業記録を確認';why.append(input);form.append(label,why);box.append(form);let updated=document.createElement('p');updated.className='muted';updated.textContent=rev.updated?'確認更新：'+rev.updated:'';box.append(updated);
select.onchange=()=>{rev.decision=select.value;rev.updated=new Date().toLocaleString('ja-JP');save();refreshStats()};input.onchange=()=>{rev.reason=input.value.slice(0,2000);rev.updated=new Date().toLocaleString('ja-JP');save();refreshStats()};root.append(box)}
}
function refreshStats(){const s=project().reviews;const unresolved=current.filter(x=>!['確認済・同一作業','確認済・別作業','対象外（理由記録）'].includes(s[x.key]?.decision)||!s[x.key]?.reason?.trim());$('v15Saved').textContent=`未解決 ${unresolved.length}組 / 保存済。判定内容は工程台帳を書き換えません。`}
$('v15Scan').onclick=render;$('v15Filter').onchange=render;
$('v15Csv').onclick=()=>{let rows=[['案件ID','確認テーマ','優先度','登録箇所','工程名','入力金額','判定','判定根拠','根拠不足件数','内包・外注注意']];for(const d of detect(records())){const rev=project().reviews[d.key]||{};for(const x of d.items)rows.push([id(),d.rule.label,d.rule.severity,x.part,x.name,x.priced?x.amount:'未算定',rev.decision||'未確認',rev.reason||'',d.weak.length,d.rule.explain])}download('AOZORA_v15_事故横断重複監査.csv','\ufeff'+rows.map(r=>r.map(quoteCsv).join(',')).join('\r\n'),'text/csv;charset=utf-8')};
$('v15Export').onclick=()=>download('AOZORA_v15_重複監査記録.json',JSON.stringify({app:'AOZORA_OVERLAP_V15',data:history},null,2),'application/json');
$('v15Import').onchange=async e=>{let f=e.target.files?.[0];if(!f)return;try{if(f.size>3e6)throw Error('ファイルが大きすぎます');let x=JSON.parse(await f.text());if(x.app!=='AOZORA_OVERLAP_V15'||!x.data?.projects||typeof x.data.projects!=='object'||Array.isArray(x.data.projects))throw Error('v15監査ファイルではありません');if(!confirm('v15の照合結果を復元します。現在の照合記録を上書きしますか？'))return;history=x.data;save();render()}catch(err){alert('復元できません：'+err.message)}finally{e.target.value=''}};
document.querySelector('[data-page="overlap"]')?.addEventListener('click',()=>setTimeout(render,0));render();
})();
