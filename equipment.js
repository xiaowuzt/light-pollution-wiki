'use strict';
(() => {
const data=window.WIKI_EQUIPMENT;
const ns='irons_spellbooks_light_pollution:';
let ctx;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const l=value=>typeof value==='object'?value[ctx.lang]:value;
const t=(zh,en)=>ctx.lang==='zh'?zh:en;
const find=id=>data.weapons.find(w=>w.id===id);
const name=id=>window.WIKI_ITEMS[id]?.name?.[ctx.lang]||data.names[id.replace(ns,'')]?.[ctx.lang]||id;
const value=s=>esc(l(s.value));
function metrics(w){return `<dl class="weapon-metrics">${w.highlights.map(s=>`<div><dt>${esc(l(s.label))}</dt><dd>${value(s)}</dd></div>`).join('')}</dl>`}
function card(w){return `<a class="weapon-card" href="#/equipment/${w.id}"><div class="weapon-art weapon-art--${w.id}"><img src="${w.gallery[0].src}" alt="${esc(l(w.name))}" width="640" height="640" loading="lazy"><span class="weapon-kind">${esc(l(w.type))}</span></div><div class="weapon-card-copy"><div class="weapon-card-title"><h2>${esc(l(w.name))}</h2><span aria-hidden="true">↗</span></div><p class="weapon-alternate">${esc(w.name[ctx.lang==='zh'?'en':'zh'])}</p><p>${esc(l(w.summary))}</p>${metrics(w)}<span class="weapon-card-link">${t('外观、属性与合成','Appearance, traits & crafting')} →</span></div></a>`}
function catalogue(){
 const columns=[['近战面板伤害','Displayed melee damage',['Melee attack damage','Base melee attack damage']],['攻击速度','Attack speed',['Attack speed']],['最大法力加成','Maximum mana bonus',['Maximum mana']],['法术强度属性','Spell power attribute',['Spell power attribute']],['冷却缩减属性','Cooldown reduction attribute',['Cooldown reduction attribute']],['施法时间缩减属性','Cast-time reduction attribute',['Cast-time reduction attribute']],['法术槽位 · 待发布','Spell slots · preview',['Spell slots · preview']]];
 const rows=columns.map(([zh,en,labels])=>[zh,en,data.weapons.map(w=>{const stat=w.stats.find(s=>labels.includes(s.label.en));return stat?value(stat):'—'})]);
 return `<div class="container page-top"><div class="eyebrow">THE ARMOURY / ${String(data.weapons.length).padStart(2,'0')}</div><h1>${t('武器与装备','Weapons & equipment')}</h1><p class="lead">${t('看清每一件器物，再决定如何战斗。查看基础属性、战斗特性与操作方式，搭配自己的战斗节奏。','See each weapon, then choose your way to fight. Compare base attributes, combat traits and controls to suit your playstyle.')}</p><div class="weapon-meta">${t('属性核对','Attributes checked')} ${data.snapshot}<span>·</span>${t('含 1.7.7 待发布功能','Includes 1.7.7 preview features')}</div></div><div class="container weapon-catalogue"><div class="weapon-grid">${data.weapons.map(card).join('')}</div><section class="weapon-comparison" aria-labelledby="compare-title"><div class="section-head"><div><div class="eyebrow">AT A GLANCE</div><h2 id="compare-title">${t('基础属性，一眼对照。','Compare the essentials.')}</h2></div><p>${t('默认值；法杖属性在主手生效。<br>法术强度与缩减为属性加成。','Default values; staff bonuses require the main hand.<br>Power and reductions are attribute bonuses.')}</p></div><div class="table-wrap" tabindex="0" role="region" aria-label="${t('武器基础属性对比，可横向滚动','Weapon attributes; scroll horizontally')}"><table class="weapon-compare-table"><caption class="sr-only">${t('全部武器基础属性','Base attributes of every weapon')}</caption><thead><tr><th scope="col">${t('属性','Attribute')}</th>${data.weapons.map(w=>`<th scope="col"><a href="#/equipment/${w.id}">${esc(l(w.name))} ↗</a></th>`).join('')}</tr></thead><tbody>${rows.map(([zh,en,values])=>`<tr><th scope="row">${t(zh,en)}</th>${values.map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="weapon-fineprint">${t('「—」表示没有对应的专属属性加成，或不适用于该武器。弓箭与光束的伤害机制见各自详情。实际数值以当前游戏版本、装备和服务器配置为准。','“—” means no dedicated bonus, or not applicable. See each weapon for arrow and beam damage rules. Your installed version, equipment and server settings determine the final values.')}</p></section><div class="weapon-guide-links"><a class="btn" href="#/guide/equipment">${t('铭刻与施法指南','Inscription & casting guide')} →</a><a class="text-link" href="#/spells">${t('为法杖挑选法术','Choose spells for your staff')} ↗</a></div></div>`;
}
function recipe(id){
 const r=data.recipes[id],shapeless=!!r.ingredients;
 let cells=[];
 if(shapeless)cells=r.ingredients.map(v=>v.item);
 else for(let y=0;y<3;y++)for(let x=0;x<3;x++){const c=r.pattern[y]?.[x]||' ';cells.push(c===' '?null:r.key[c].item)}
 while(cells.length<9)cells.push(null);
 const counts={};cells.filter(Boolean).forEach(id=>counts[id]=(counts[id]||0)+1);
 const title=name(r.result.item);
 const materialLink=id=>{
  const short=id.replace(ns,'');
  if(find(short))return `<a class="weapon-material-link" href="#/equipment/${short}">${esc(name(id))} ↗</a>`;
  if(id.startsWith(ns)&&id.endsWith('_scroll'))return `<a class="weapon-material-link" href="#/spell/${short.replace(/_scroll$/,'')}">${esc(name(id))} ↗</a>`;
  if(ctx.weapon?.materials.includes(short))return `<button type="button" class="weapon-material-link" data-recipe-target="${short}">${esc(name(id))} ↓</button>`;
  return `<span>${esc(name(id))}</span>`;
 };
 return `<div class="weapon-recipe"><p class="weapon-recipe-type">${shapeless?t('工作台 · 无序合成（摆放示例）','Crafting table · shapeless (example arrangement)'):t('工作台 · 有序合成','Crafting table · shaped recipe')}</p><div class="recipe-container"><div class="recipe-grid" role="group" aria-label="${t('三乘三合成格','Three-by-three crafting grid')}">${cells.map(id=>id?ctx.itemButton(id,name(id)):`<span class="ingredient is-empty" aria-label="${t('空槽','Empty slot')}"></span>`).join('')}</div><div class="craft-arrow" aria-hidden="true">→</div><div class="recipe-result">${ctx.itemButton(r.result.item,title,'recipe-output')}<p>${esc(title)} × ${r.result.count||1}</p></div></div><div class="ingredients-list">${Object.entries(counts).map(([id,count])=>`<div>${ctx.itemButton(id,name(id),'material-icon')}${materialLink(id)}<span class="material-count">× ${count}</span></div>`).join('')}</div>${r.type.endsWith(':domain_seal')?`<p class="weapon-recipe-note">${t('界印只接受对应的 I 级卷轴，不消耗升级后的 II / III 级卷轴。','Seals accept the corresponding tier-I scroll only; tier-II and tier-III scrolls are not consumed.')}</p>`:''}</div>`;
}
function gallery(w){
 const first=w.gallery[0];
 return `<section class="weapon-gallery" aria-label="${t('武器外观画廊','Weapon appearance gallery')}"><div class="weapon-stage weapon-art--${w.id}"><img id="weapon-main-image" src="${first.src}" alt="${esc(l(w.name)+' · '+l(first.label))}" width="640" height="640" fetchpriority="high"></div><div class="weapon-view-buttons" role="group" aria-label="${t('切换外观视图','Choose appearance view')}">${w.gallery.map((g,i)=>`<button type="button" data-weapon-view="${i}" aria-pressed="${i===0}" aria-controls="weapon-main-image">${esc(l(g.label))}</button>`).join('')}</div><p id="weapon-caption" class="weapon-caption" aria-live="polite">${esc(l(first.caption))}</p><a class="text-link" id="weapon-original" href="${first.src}" target="_blank" rel="noopener">${t('打开原图','Open full image')} ↗</a></section>`;
}
function traits(w){
 if(!w.traits?.length)return '';
 return `<section class="weapon-traits" aria-labelledby="traits-title"><div class="section-head"><div><div class="eyebrow">COMBAT TRAITS</div><h2 id="traits-title">${t('三项战斗特性','Three combat traits')}</h2></div><p>${t('命中类属性需要目标实际损失生命或吸收生命。','Hit effects require actual health or absorption loss.')}</p></div><div class="weapon-trait-grid">${w.traits.map((trait,i)=>`<article class="weapon-trait"><span class="weapon-trait-index" aria-hidden="true">0${i+1}</span><h3>${esc(l(trait.name))}</h3><p>${esc(l(trait.text))}</p></article>`).join('')}</div></section>`;
}
function detail(w){
 ctx.weapon=w;
 return `<div class="container page-top weapon-detail-top"><div class="breadcrumb"><a href="#/">${t('首页','Home')}</a><span>/</span><a href="#/equipment">${t('武器与装备','Weapons & equipment')}</a><span>/</span><span>${esc(l(w.name))}</span></div><div class="eyebrow">${esc(l(w.type))}</div><h1>${esc(l(w.name))}</h1><p class="weapon-alternate">${esc(w.name[ctx.lang==='zh'?'en':'zh'])}${w.previousName?` · ${t('原','Formerly ')}${esc(l(w.previousName))}`:''}</p><p class="lead">${esc(l(w.summary))}</p><div class="weapon-meta">${esc(l(w.availability))}<span>·</span>${data.snapshot}</div></div><div class="container weapon-detail"><div class="weapon-overview">${gallery(w)}<section class="weapon-attributes" aria-labelledby="attributes-title"><h2 id="attributes-title">${t('武器属性','Attributes')}</h2><p>${t('无额外附魔与状态的基础值','Base values without extra enchantments or effects')}</p><dl>${w.stats.map(s=>`<div><dt>${esc(l(s.label))}</dt><dd>${value(s)}</dd></div>`).join('')}</dl></section></div>${traits(w)}<div class="weapon-lower"><section class="weapon-use" aria-labelledby="use-title"><div class="eyebrow">IN YOUR HANDS</div><h2 id="use-title">${t('如何使用','How to use it')}</h2><ol class="weapon-controls">${w.controls.map(a=>`<li><h3>${esc(l(a.label))}</h3><p>${esc(l(a.text))}</p></li>`).join('')}</ol><div class="weapon-notes"><h3>${t('机制说明','How it works')}</h3>${w.notes.map(n=>`<p>${esc(l(n))}</p>`).join('')}</div><div class="weapon-related">${w.related.map(r=>`<a class="text-link" href="#${r.route}">${esc(l(r.name))} ↗</a>`).join('')}</div></section><section class="weapon-crafting" aria-labelledby="craft-title"><div class="eyebrow">CRAFTING & MATERIALS</div><h2 id="craft-title">${t('合成与获取','Crafting & acquisition')}</h2>${w.craftingNotes.map(n=>`<p>${esc(l(n))}</p>`).join('')}${recipe(w.id)}${w.materials.length?`<h3 class="weapon-materials-title">${t('前置材料配方','Component recipes')}</h3><p class="weapon-fineprint">${t('展开查看所需材料与摆放。','Expand a component to see its ingredients and arrangement.')}</p>`:''}${w.materials.map(id=>`<details class="weapon-component" id="component-${id}"><summary>${esc(l(data.names[id]))}</summary>${recipe(id)}</details>`).join('')}</section></div><div class="weapon-foot"><p>${t('以上数值和配方核对于','Values and recipes checked on')} ${data.snapshot}${t('。图鉴含开发内容，请以已安装版本与服务器配置为准。','. The atlas includes development content; your installed version and server settings take precedence.')}</p><a class="text-link" href="#/equipment">← ${t('返回武器图鉴','Back to the armoury')}</a></div></div>`;
}
function render(lang, id, helpers){ctx={lang,...helpers};return id?detail(find(id)):catalogue()}
function mount(id){
 const w=find(id);if(!w)return;
 document.querySelectorAll('[data-weapon-view]').forEach(button=>button.addEventListener('click',()=>{
  const g=w.gallery[Number(button.dataset.weaponView)];
  const img=document.querySelector('#weapon-main-image');
  img.src=g.src;img.alt=l(w.name)+' · '+l(g.label);
  img.width=g.kind==='gameplay'?1280:640;img.height=g.kind==='gameplay'?720:640;
  img.closest('.weapon-stage').classList.toggle('is-gameplay',g.kind==='gameplay');
  document.querySelector('#weapon-caption').textContent=l(g.caption);
  document.querySelector('#weapon-original').href=g.src;
  document.querySelectorAll('[data-weapon-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 }));
 document.querySelectorAll('[data-recipe-target]').forEach(button=>button.addEventListener('click',()=>{
  const target=document.getElementById('component-'+button.dataset.recipeTarget);
  if(target){target.open=true;target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});target.querySelector('summary').focus({preventScroll:true})}
 }));
}
window.WikiEquipment={render,mount,find};
})();
