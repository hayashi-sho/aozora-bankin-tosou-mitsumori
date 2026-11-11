(()=>{'use strict';
const $=id=>document.getElementById(id),items=window.AOZORA_COST_ITEMS||[];
const KEY='aozora-cost-guide-v8',modes={insurance:'保険',retail:'自払い',wholesale:'業販'},classes={jp_std:'国産大衆',jp_lux:'国産高級',imp_std:'輸入大衆',imp_lux:'輸入高級'};
const money=n=>'¥'+(Number(n)||0).toLocaleString('ja-JP',{maximumFractionDigits:0});
const el=(tag,text,cl)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cl)e.className=cl;return e};
const initial=()=>({version:8,overrides:{}});
let db=initial(),qty={};try{const raw=localStorage.getItem(KEY);if(raw){const p=JSON.parse(raw);if(p.version===8&&p.overrides&&typeof p.overrides==='object'&&!Array.isArray(p.overrides))db=p}}catch(e){console.warn(e)}
const key=(item)=>[$('costMode').value,$('costClass').value,item.id].join('|');
function save(){try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){alert('保存できません。JSONでバックアップしてください。')}}
function download(filename,content,type){const b=new Blob([content],{type}),url=URL.createObjectURL(b),a=el('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function priceText(item){if(item.low==null)return '公開価格未確認';if(item.high!=null&&item.low===item.high)return money(item.low)+'（公開例）';return money(item.low)+(item.high!=null?'〜'+money(item.high):'〜')}
function render(){let q=$('costSearch').value.trim().toLowerCase(),category=$('costCategory').value,arr=items.filter(x=>(!category||x.cat===category)&&(!q||(x.name+' '+x.cat+' '+x.note).toLowerCase().includes(q)));
$('costCount').textContent=arr.length;$('costKnown').textContent=arr.filter(x=>x.low!=null).length;$('costSaved').textContent=arr.filter(x=>Object.hasOwn(db.overrides,key(x))).length;
const root=$('costList');root.replaceChildren();let total=0;
for(let item of arr){let k=key(item),saved=Object.hasOwn(db.overrides,k)?db.overrides[k]:null,number=Number(saved),count=Number(qty[k]||0);if(saved!==null&&Number.isFinite(number)&&number>=0)total+=number*count;
let card=el('div',undefined,'card'),head=el('div',undefined,'row between'),main=el('div');main.append(el('strong',item.name),el('p',item.cat,'muted'));head.append(main,el('span',priceText(item),item.low==null?'chip':'good'));card.append(head);
let meta=el('p',item.low==null?'参考価格なし（社内で設定）':`公開例：${item.condition}`,'muted');card.append(meta);if(item.note)card.append(el('p','注意：'+item.note,'muted'));
let grid=el('div',undefined,'grid four'),a=el('div'),b=el('div'),c=el('div'),d=el('div');
let al=el('label','社内単価（税抜円）'),input=el('input');input.type='number';input.min='0';input.step='1';input.placeholder='未設定';input.value=saved===null?'':saved;input.setAttribute('aria-label',item.name+' 社内単価');input.onchange=()=>{let v=input.value.trim();if(v==='')delete db.overrides[k];else if(!/^\d+(?:\.\d+)?$/.test(v)||!Number.isFinite(Number(v))||Number(v)>100000000){alert('有効な0以上の円金額を入力してください');input.value=saved===null?'':saved;return}else db.overrides[k]=Number(v);save();render()};a.append(al,input);
let bl=el('label','試算数量'),qinput=el('input');qinput.type='number';qinput.min='0';qinput.step='0.1';qinput.value=qty[k]??0;qinput.onchange=()=>{const n=Number(qinput.value);if(!Number.isFinite(n)||n<0||n>10000){alert('数量が不正です');return}qty[k]=n;render()};b.append(bl,qinput);
let cl=el('label','試算小計'),result=el('strong',saved===null?'単価未設定':money(number*count));c.append(cl,result);
let dl=el('label','根拠'),detail=el('span',item.source||'未設定','muted');d.append(dl,detail);
grid.append(a,b,c,d);card.append(grid);root.append(card)}$('costTotal').textContent=money(total);if(!arr.length)root.append(el('p','該当する費用項目がありません。','muted'))}
window.renderAOZORACosts=render;
for(let id of ['costMode','costClass','costCategory'])$(id).onchange=render;$('costSearch').oninput=render;
for(let c of [...new Set(items.map(x=>x.cat))]){let o=el('option',c);o.value=c;$('costCategory').append(o)}
$('costResetQty').onclick=()=>{qty={};render()};
const csv=s=>'"'+String(s??'').replaceAll('"','""')+'"';
$('costCsv').onclick=()=>{let head=['取引区分','車格','費用分類','費用項目','公開参考下限','公開参考上限','公開価格条件','公開参照元','社内設定単価（税抜）','試算数量','試算小計（税抜）','注意'];let data=items.map(x=>{const k=key(x),v=db.overrides[k]??'';return [modes[$('costMode').value],classes[$('costClass').value],x.cat,x.name,x.low??'',x.high??'',x.condition,x.source,v,qty[k]||0,v===''?'':Number(v)*Number(qty[k]||0),x.note]});download('AOZORA_費用ガイド_v8.csv','\ufeff'+[head,...data].map(r=>r.map(csv).join(',')).join('\r\n'),'text/csv;charset=utf-8')};
$('costBackup').onclick=()=>download('AOZORA_費用単価バックアップ_v8.json',JSON.stringify(db,null,2),'application/json;charset=utf-8');
$('costRestore').onchange=async ev=>{const f=ev.target.files?.[0];if(!f)return;try{if(f.size>3000000)throw Error('3MB以下のファイルを使用してください');let x=JSON.parse(await f.text());if(x.version!==8||!x.overrides||typeof x.overrides!=='object'||Array.isArray(x.overrides))throw Error('非対応ファイル');let allowed=new Set(items.map(x=>x.id)),clean={};for(let [k,v] of Object.entries(x.overrides)){let parts=k.split('|');if(parts.length!==3||!modes[parts[0]]||!classes[parts[1]]||!allowed.has(parts[2])||typeof v!=='number'||!Number.isFinite(v)||v<0||v>100000000)continue;clean[k]=v}if(!confirm(`有効な社内単価 ${Object.keys(clean).length} 件で費用ガイドの社内単価を上書きしますか？`))return;db={version:8,overrides:clean};save();render();alert('復元完了')}catch(e){alert('復元できません：'+e.message)}finally{ev.target.value=''}};
render();
})();
