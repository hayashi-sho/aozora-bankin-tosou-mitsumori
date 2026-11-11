/* AOZORA v13 vehicle fitment & evidence gate. Local-only, no official index assertions. */
(()=>{'use strict';
const $=id=>document.getElementById(id),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const STORAGE='AOZORA_VEHICLE_V13',PHOTOS='AOZORA_PHOTO_V10_META',WORK='AOZORA_WORKFLOW_V12';
const CASES=[
 ['バンパ・前方','フロントバンパ|フロント|グリル','前方カメラ・レーダ搭載確認','ミリ波レーダ・フロントカメラの位置、修理書指定の脱着・校正条件','ADAS','装備と作業範囲による'],
 ['バンパ・前方','フロントバンパ|フロント|グリル','衝突吸収材・取付ブラケット確認','分解写真・損傷と交換必要性','部品','事故変形を確認'],
 ['バンパ・前方','フロントバンパ|フロント|グリル','パーキングセンサー再使用・診断','センサー数、取付状態、DTCおよび修理書','電装','装着車のみ'],
 ['前照灯','ヘッドライト|ランプ','前照灯脱着後の光軸確認','灯体・レベリングの種類、メーカー手順','電装','修理内容による'],
 ['ドア・側面','ドア|スライド','ドア内部装備・ガラス・トリム確認','分解写真、品番、必要脱着範囲','脱着','基本指数の内包確認'],
 ['ドア・側面','ドア|スライド','サイドエアバッグ・配線保護','装備図、修理書、安全処置の記録','安全','装着車のみ'],
 ['ドア・側面','ドア|スライド','ドア建付け・隙間測定','事故変形と通常調整を区別した記録','骨格','通常調整は指数内包の場合'],
 ['フェンダ・側面','フェンダ|クォータ|ピラー|サイド','溶接・接合工法の確認','材質、メーカー指定切断位置・接合方法','骨格','交換時に要確認'],
 ['フェンダ・側面','フェンダ|クォータ|ピラー|サイド','内部防錆・シール復元','接合箇所写真、材料番号、修理書','防錆','施工要否・指数内包確認'],
 ['ガラス','ガラス|ウィンド','カメラ装備とガラス交換手順','カメラ仕様、純正ガラス要件、校正条件','ADAS','装着車のみ'],
 ['リア','リア|バックドア|テール|トランク','後側方レーダ・センサー確認','装備図と脱着交換範囲','ADAS','装着車のみ'],
 ['リア','リア|バックドア|テール|トランク','バックカメラ・ガイド線確認','修理書、診断・調整記録','電装','装着車のみ'],
 ['足回り','足回り|タイヤ|ホイール|サスペンション','アライメント測定の要否','衝撃入力、損傷、測定票','足回り','事故起因・修理箇所を確認'],
 ['足回り','足回り|タイヤ|ホイール|サスペンション','ステアリング舵角・制御学習','修理書の初期化・学習要件','電装','対象作業のみ'],
 ['塗装','バンパ|ドア|フェンダ|クォータ|ルーフ|ボンネット|フード|リア','塗装色・塗装仕様の確認','塗色コード、2/3コート、樹脂素材、ぼかし範囲','塗装','指数の適用条件を要確認'],
 ['塗装','バンパ|ドア|フェンダ|クォータ|ルーフ|ボンネット|フード|リア','調色・マスキングの共通工程確認','同一事故の各パネル塗装範囲','塗装','前後・左右で重複注意'],
 ['構造','フレーム|ピラー|クォータ|サイド|フロア','車体基準寸法と素材確認','メーカー車体寸法図、計測ポイント、素材情報','骨格','測定・修正の区別'],
 ['構造','フレーム|ピラー|クォータ|サイド|フロア','超高張力鋼・アルミ修理制約','メーカー修理書の補修可否・工具・接合指定','安全','素材により補修制限'],
 ['HV・EV','全て','高電圧系の安全処置要否','駆動方式、メーカー手順、資格・安全記録','安全','HV/EVのみ'],
 ['共通','全て','作業前後の故障コード記録','事故起因・作業起因の切り分け、診断ログ','電装','必要性と重複確認'],
 ['共通','全て','一回使用部品・締結規定の確認','指定部品番号、締付トルク、実施記録','部品','修理書指定時のみ'],
 ['共通','全て','追加損傷の因果関係と承認記録','分解後写真、連絡日時、追加協定履歴','協定','実損・資料に基づく']
];
let all={version:13,projects:{}};try{const o=JSON.parse(localStorage.getItem(STORAGE)||'null');if(o&&o.projects)all=o}catch{}
const pid=()=>window.AOZORA_PHOTO_PROJECT_ID?.()||'standalone';
const pj=()=>{let p=all.projects[pid()]||(all.projects[pid()]={vehicle:{make:'',name:'',model:'',year:'',grade:'jp_std',power:'未確認',paint:'',vinlast:'',memo:''},equipment:{},checks:{},pointChecks:{}});p.vehicle||={};p.equipment||={};p.checks||={};p.pointChecks||={};return p};
const photo=()=>{try{return JSON.parse(localStorage.getItem(PHOTOS)||'{}').projects?.[pid()]||{points:[]}}catch{return{points:[]}}};
const workflow=()=>{try{return JSON.parse(localStorage.getItem(WORK)||'{}').projects?.[pid()]?.entries||{}}catch{return{}}};
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(all));$('v13Saved').textContent='端末内に保存済'}catch(e){$('v13Saved').textContent='保存失敗：容量不足の可能性。JSONを出力してください'}}
const FEATURES=[['frontRadar','前方ミリ波レーダ'],['frontCamera','前方カメラ'],['rearRadar','後側方レーダ'],['parkSensors','パーキングセンサー'],['surround','全周囲カメラ'],['sideAirbags','サイドエアバッグ'],['headlampAuto','自動光軸・AFS'],['ev','高電圧系（HV/EV）'],['aluminum','アルミ／複合材']];
const EVAL=['未確認','必要性確認中','要現車確認','メーカー資料で必要と確認','実施・記録済','対象外（理由記録）'];
const SCOPE=['未確認','指数内包を確認','別途計上の根拠確認済','請求しない'];
const str=x=>String(x??'');
const opt=(items,val)=>items.map(s=>`<option${s===val?' selected':''}>${esc(s)}</option>`).join('');
function fields(){let p=pj(),v=p.vehicle||{};for(let el of document.querySelectorAll('[data-v13-vehicle]')){let k=el.dataset.v13Vehicle;el.value=v[k]??''}let host=$('v13Equipment');host.innerHTML=FEATURES.map(([id,label])=>`<label class="candidate"><span>${esc(label)}</span><select data-feature="${id}">${opt(['未確認','あり','なし'],p.equipment?.[id]||'未確認')}</select></label>`).join('');host.querySelectorAll('[data-feature]').forEach(el=>el.onchange=()=>{p.equipment[el.dataset.feature]=el.value;save();render()});
}
function candidates(){let pts=photo().points||[],selected=$('v13Point').value;
let target=selected==='all'?pts:selected==='common'?[]:pts.filter(x=>x.id===selected);
let terms=target.flatMap(x=>[str(x.part),str(x.damage)]).join('|');
return CASES.map((row,i)=>({row,i})).filter(({row})=>{
if(selected==='common')return row[1]==='全て';if(row[1]==='全て')return true;
return row[1].split('|').some(s=>terms.includes(s)||target.some(t=>str(t.part).includes(s)));
});}
function points(){let options=[new Option('全損傷箇所','all'),new Option('車両共通','common')],sel=$('v13Point'),old=sel.value;
for(let [i,p] of (photo().points||[]).entries())options.push(new Option(`${i+1}. ${p.part}／${p.damage}（${p.method||'方法未定'}）`,p.id));sel.replaceChildren(...options);sel.value=options.some(o=>o.value===old)?old:'all'}
function bucket(){const selected=$('v13Point').value;let p=pj();if(selected==='all'||selected==='common'||!selected)return p.checks;return p.pointChecks[selected]||(p.pointChecks[selected]={})}
function rec(i){let b=bucket();return b[i]||(b[i]={state:'未確認',scope:'未確認',source:'',proof:'',reason:'',hours:'',rate:'',cost:''})}
function entries(){let p=pj(),out=[];for(let [i,r] of Object.entries(p.checks||{}))out.push({where:'共通・旧版',i,r});for(let [point,items] of Object.entries(p.pointChecks||{})){for(let [i,r] of Object.entries(items||{}))out.push({where:point,i,r})}return out}
function validPointIds(){return new Set((photo().points||[]).map(x=>String(x.id)))}
function relevant(row){const equip=pj().equipment||{};let title=row[2];if(title.includes('高電圧'))return equip.ev==='あり'||pj().vehicle.power==='HV'||pj().vehicle.power==='EV'?'装備適合：要確認':'駆動方式・装備未確認';if(title.includes('レーダ'))return equip.frontRadar==='あり'||equip.rearRadar==='あり'?'搭載あり：要手順確認':'搭載状況を確認';if(title.includes('カメラ'))return equip.frontCamera==='あり'||equip.surround==='あり'?'搭載あり：要手順確認':'搭載状況を確認';if(title.includes('エアバッグ'))return equip.sideAirbags==='あり'?'搭載あり：安全手順確認':'搭載状況を確認';return '部位・装備・作業方法で判定'}
function warn(){let p=pj(),issues=[],total=0,priced=0,done=0,checked=0,seen=new Map();let prof=p.vehicle||{};
if(!prof.model?.trim())issues.push('車両型式が未入力');if(!prof.year?.trim())issues.push('年式が未入力');
for(let {where,i:iStr,r} of entries()){let i=+iStr,row=CASES[i];if(!row||r.state==='未確認')continue;checked++;if(r.state==='実施・記録済')done++;
if(['メーカー資料で必要と確認','実施・記録済'].includes(r.state)&&!r.source?.trim())issues.push(row[2]+'：メーカー資料・指数等の出典が未登録');
if(r.state==='実施・記録済'&&!r.proof?.trim())issues.push(row[2]+'：実施証拠が未登録');
if(r.scope==='別途計上の根拠確認済'&&!r.reason?.trim())issues.push(row[2]+'：指数内包と分離できる根拠が未登録');
if(r.state==='対象外（理由記録）'&&!r.reason?.trim())issues.push(row[2]+'：対象外理由が未登録');
let h=number(r.hours),rate=number(r.rate),cost=number(r.cost);if(r.scope==='指数内包を確認'&&((h??0)*(rate??0)+(cost??0))>0)issues.push(row[2]+'：指数内包なのに金額入力あり');
if(r.scope==='別途計上の根拠確認済'&&r.state==='実施・記録済'){if((h===null||rate===null)&&cost===null)issues.push(row[2]+'：金額未入力');else{total+=(h??0)*(rate??0)+(cost??0);priced++}}
seen.set(where+'|'+row[2],(seen.get(where+'|'+row[2])||0)+1);
}
for(let [name,n] of seen)if(n>1)issues.push(name.replace('|','／')+'：重複登録を確認');
for(let key of Object.keys(p.pointChecks||{}))if(!validPointIds().has(key))issues.push('削除済み写真ピンの記録が残っています（'+key+'）。バックアップしてから整理してください');
let wf=workflow(),active=Object.values(wf).filter(v=>v.status==='実施・別途確認');
$('v13Summary').textContent=`入力済み ${checked}件／実施 ${done}件／別途確認済・実施の試算 ${yen(total)}（${priced}件・入力値のみ）／v12別途工程登録 ${active.length}件／要確認 ${issues.length}件。v12工程とv13チェックの金額は合算しません。`;
$('v13Audit').innerHTML=issues.length?issues.slice(0,70).map(s=>`<div class="candidate">⚠ ${esc(s)}</div>`).join(''):'<p class="good">現在の入力内容に形式上の警告はありません。必要作業や保険認定の保証ではありません。</p>';
}
function number(x){if(x===''||x==null)return null;let n=Number(x);return Number.isFinite(n)&&n>=0?n:null}
function yen(n){return Math.round(n).toLocaleString('ja-JP')+'円'}
function render(){const q=$('v13Query').value.toLowerCase(),only=$('v13Open').checked;let list=candidates().filter(({row,i})=>(!q||row.join(' ').toLowerCase().includes(q))&&(!only||rec(i).state==='未確認'||rec(i).state==='必要性確認中'||rec(i).state==='要現車確認'));
$('v13Count').textContent=`${list.length}件表示／${CASES.length}種の精密チェック`;
let box=$('v13Rows');box.replaceChildren();$('v14Scope').textContent=($('v13Point').value==='all'||$('v13Point').value==='common')?'共通・旧版のチェック記録を編集しています。個別の損傷ピンを選ぶと、そのピン専用の記録に切り替わります。':'選択した損傷ピン専用の記録を編集しています。他の損傷箇所とは分離して保存します。';for(let {row,i} of list){const r=rec(i),d=document.createElement('details');d.className='candidate';let name=document.createElement('summary');name.innerHTML=`<strong>${esc(row[2])}</strong> <span class="chip">${esc(row[4])}</span> <span class="muted">${esc(r.state)}</span>`;d.append(name);let body=document.createElement('div');body.innerHTML=`<p class="muted">確認内容：${esc(row[3])}／適用条件：${esc(row[5])}／${esc(relevant(row))}</p><div class="grid four"><label>工程の確認状態<select data-c="state">${opt(EVAL,r.state)}</select></label><label>指数内包・別途確認<select data-c="scope">${opt(SCOPE,r.scope)}</select></label><label>作業時間・指数 h<input data-c="hours" type="number" min="0" step="0.05" value="${esc(r.hours)}"></label><label>工賃単価 円/h<input data-c="rate" type="number" min="0" step="100" value="${esc(r.rate)}"></label><label>部品・材料・外注実費 円<input data-c="cost" type="number" min="0" step="1" value="${esc(r.cost)}"></label><label>メーカー資料／指数出典<input data-c="source" value="${esc(r.source)}" placeholder="資料名・版・ページ"></label><label>写真・診断・測定証拠<input data-c="proof" value="${esc(r.proof)}" placeholder="写真番号・測定表"></label><label>理由・指数の適用条件<input data-c="reason" value="${esc(r.reason)}" placeholder="必要性や対象外の理由"></label></div><p class="muted">入力時間はメーカー公式指数とは限りません。登録値を保険認定額とみなさないでください。</p>`;
d.append(body);for(let el of body.querySelectorAll('[data-c]'))el.onchange=()=>{if(el.type==='number'&&el.value!==''&&number(el.value)===null){alert('数値は0以上で入力してください');el.value=r[el.dataset.c]??'';return}r[el.dataset.c]=el.value;save();name.querySelector('.muted').textContent=r.state;warn()};box.append(d)}warn()}
function download(name,data,type){let url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000)}
function csv(){let rows=[['登録先','カテゴリー','対象部位','確認内容','適用注意','状態','指数内包','工数h','単価円/h','実費円','出典','実施証拠','説明']];for(let {where,i:key,r} of entries()){let row=CASES[+key];if(!row||r.state==='未確認')continue;rows.push([where,row[0],row[1],row[2],row[5],r.state,r.scope,r.hours,r.rate,r.cost,r.source,r.proof,r.reason])}download('AOZORA_v13_車両適合チェック.csv','\ufeff'+rows.map(row=>row.map(v=>'"'+str(v).replace(/"/g,'""')+'"').join(',')).join('\r\n'),'text/csv;charset=utf-8')}
function initialize(){fields();points();render()}
for(let el of document.querySelectorAll('[data-v13-vehicle]'))el.addEventListener('change',()=>{pj().vehicle[el.dataset.v13Vehicle]=el.value;save();render()});
$('v13Point').onchange=render;$('v13Query').oninput=render;$('v13Open').onchange=render;$('v13Refresh').onclick=initialize;$('v13Csv').onclick=csv;$('v13Export').onclick=()=>download('AOZORA_v13_車両装備台帳.json',JSON.stringify({app:'AOZORA_VEHICLE_V13',data:all},null,2),'application/json');
$('v13Import').onchange=async e=>{let f=e.target.files?.[0];if(!f)return;try{const o=JSON.parse(await f.text());if(o.app!=='AOZORA_VEHICLE_V13'||!o.data||!o.data.projects||typeof o.data.projects!=='object')throw Error('v13台帳JSONではありません');if(!confirm('v13車両台帳を上書きします。続けますか？'))return;all=o.data;for(let p of Object.values(all.projects)){if(!p||typeof p!=='object')throw Error('案件データが不正です');p.pointChecks=p.pointChecks&&typeof p.pointChecks==='object'&&!Array.isArray(p.pointChecks)?p.pointChecks:{};p.checks=p.checks&&typeof p.checks==='object'&&!Array.isArray(p.checks)?p.checks:{}}save();initialize()}catch(x){alert('復元失敗: '+x.message)}finally{e.target.value=''}};
document.querySelector('[data-page="vehiclefit"]')?.addEventListener('click',()=>setTimeout(initialize,0));initialize();
})();
