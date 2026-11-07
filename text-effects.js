'use strict';
(() => {
const E=window.WikiTextEngine, D=window.WIKI_TEXT_EFFECTS;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let language='zh',session=null;
const t=(zh,en)=>language==='zh'?zh:en;
const defaults=()=>({text:'星河入梦',layers:[{code:'J',params:{from:'#8bbfff',to:'#efcaff',sp:8,f:.3}},{code:'B',params:{a:.6,f:.5,w:1}},{code:'O',params:{r:1,a:.2}}],size:48,background:'night'});
let draft=defaults();
try{const saved=JSON.parse(localStorage.getItem('lp-text-workbench'));if(saved&&typeof saved.text==='string'&&Array.isArray(saved.layers)){
 draft.text=Array.from(saved.text).slice(0,80).join('');draft.layers=saved.layers.slice(0,8).filter(p=>E.definitions[p.code]).map(p=>{const params={};for(const field of E.schemas[p.code]||[]){const value=p.params?.[field.key];if(value===undefined)continue;if(field.type==='color'&&/^#[\da-f]{6}$/i.test(value))params[field.key]=value;else if(field.type==='flag')params[field.key]=value===true||value==='true';else if(field.type==='number'&&Number.isFinite(Number(value)))params[field.key]=Math.min(field.max,Math.max(field.min,Number(value)))}return{code:p.code,params}})
}}catch{}
const save=()=>{try{localStorage.setItem('lp-text-workbench',JSON.stringify(draft))}catch{}};
const label=d=>d.label[language];
function presetLabel(id){return window.WIKI_DATA.spells.find(s=>s.id===id)?.name[language]||(id==='singularity_bow'?t('星磁弦弓','Singularity Bow'):id)}
function page(lang){language=lang;return `<div class="container tf-page"><section class="page-top tf-heading"><div><div class="eyebrow">TEXT EFFECTS / WORKBENCH</div><h1>${t('文字特效工作台','Text effect workshop')}</h1><p class="lead">${t('写下文字，组合动效。把喜欢的效果带回游戏。','Write your text. Shape its motion. Take the effect into your world.')}</p></div><div class="tf-heading-note"><span class="pill pending">${t('当前开发版','Development preview')}</span><p>${t('52 个快捷码 · 25 套法术配方','52 letter codes · 25 spell recipes')}</p></div></section>
 <section class="tf-workbench" aria-label="${t('文字工作台','Text workbench')}">
  <div class="tf-preview-column"><div class="tf-stage" data-background="${draft.background}"><div class="tf-stage-bar"><span><i aria-hidden="true"></i>${t('实时预览','LIVE PREVIEW')}</span><button type="button" id="tf-play" class="tf-small"></button></div><canvas id="tf-main-canvas" role="img" aria-label="${t('自定义文字效果实时预览','Live preview of your custom text effect')}"></canvas><div class="tf-stage-tools"><div class="tf-backgrounds" role="group" aria-label="${t('预览背景','Preview background')}">${[['night','深色','Dark'],['slate','灰色','Slate'],['light','浅色','Light']].map(([id,zh,en])=>`<button type="button" data-bg="${id}" aria-pressed="${draft.background===id}" aria-label="${t(zh,en)}" title="${t(zh,en)}"></button>`).join('')}</div><label>${t('预览字号','Preview size')} <select id="tf-size" aria-label="${t('预览字号','Preview font size')}">${[32,48,64].map(s=>`<option value="${s}" ${draft.size===s?'selected':''}>${s}</option>`).join('')}</select></label><button type="button" id="tf-replay" class="tf-small">↻ ${t('重播','Replay')}</button></div></div>
   <p class="tf-preview-note">${t('浏览器实时渲染；游戏字体与资源包会影响字形。背景和字号仅用于预览。','Rendered live in your browser. Game fonts and resource packs affect glyphs. Background and size are preview settings.')}</p>
   <div class="tf-text-field"><label for="tf-text">${t('你的文字','Your text')}</label><span id="tf-length"></span><textarea id="tf-text" rows="2" spellcheck="false" placeholder="${t('输入想带回游戏的文字','Enter the text you want to use in game')}">${esc(draft.text)}</textarea></div>
   <div class="tf-output"><div class="tf-output-head"><label for="tf-code">${t('游戏代码','Game code')}</label><button type="button" id="tf-copy" class="btn primary">${t('复制代码','Copy code')} <span aria-hidden="true">↗</span></button></div><textarea id="tf-code" readonly rows="3" spellcheck="false" aria-describedby="tf-code-help"></textarea><p id="tf-code-help">${t('粘贴到物品名称、提示文字或支持的任务文本中。已自动附上 &! 结束标记。','Paste into item names, tooltips or supported quest text. The &! reset is appended automatically.')}</p></div>
  </div>
  <div class="tf-editor"><div class="tf-editor-head"><div><span class="eyebrow">COMPOSE</span><h2>${t('组合你的效果','Compose your effect')}</h2></div><button type="button" id="tf-reset" class="tf-small">${t('重置','Reset')}</button></div>
   <label for="tf-preset">${t('从法术配方开始','Start from a spell recipe')}</label><select id="tf-preset"><option value="">${t('选择一套配方…','Choose a recipe…')}</option>${Object.keys(D.presets).map(id=>`<option value="${id}">${esc(presetLabel(id))}</option>`).join('')}</select>
   <div id="tf-layers" aria-label="${t('效果顺序','Effect order')}"></div><div class="tf-add"><label class="sr-only" for="tf-add-select">${t('选择添加的效果','Choose an effect to add')}</label><select id="tf-add-select"><optgroup label="${t('基础效果 · 可调整参数','Primitives · adjustable')}">${D.codes.filter(d=>d.code===d.code.toUpperCase()).map(d=>`<option value="${d.code}">&amp;${d.code} · ${esc(label(d))}</option>`).join('')}</optgroup><optgroup label="${t('现成效果','Ready-made effects')}">${D.codes.filter(d=>d.code===d.code.toLowerCase()).map(d=>`<option value="${d.code}">&amp;${d.code} · ${esc(label(d))}</option>`).join('')}</optgroup></select><button type="button" id="tf-add" class="btn outline">+ ${t('添加','Add')}</button></div>
   <p class="tf-stack-help">${t('按从上到下的顺序组合，最多 8 项。基础颜色会被后续颜色效果覆盖；经典效果（如 &p、&q）最后着色。描边、水纹等材质只保留最后一项。','Applied from top to bottom, up to 8 layers. Later primitive colours override earlier ones; classic effects such as &p and &q colour the result last. Only the last fragment material is used.')}</p><p id="tf-status" class="tf-status" role="status" aria-live="polite"></p>
  </div>
 </section>
 <section class="tf-library" aria-labelledby="tf-library-title"><div class="section-head"><div><div class="eyebrow">THE EFFECT LIBRARY</div><h2 id="tf-library-title">${t('先看效果，再选代码。','Find the effect. Get the code.')}</h2></div><p>${t('每个代码都有独立预览。<br>选择「载入工作台」继续调整。','A live preview for every code.<br>Load any effect into the workshop to make it yours.')}</p></div>
  <div class="tf-library-toolbar"><div class="tf-filters" role="group" aria-label="${t('效果类别','Effect categories')}">${[['all','全部 52','All 52'],['ready','现成效果','Ready-made'],['primitive','基础效果','Primitives'],['material','材质效果','Materials']].map(([v,zh,en])=>`<button type="button" data-filter="${v}" aria-pressed="${v==='all'}">${t(zh,en)}</button>`).join('')}</div><label class="tf-search"><span class="sr-only">${t('搜索效果或代码，区分大小写','Search effects or case-sensitive codes')}</span><input id="tf-search" type="search" placeholder="${t('搜索效果或 &代码','Search effects or &code')}"></label></div><div class="tf-library-meta"><p id="tf-count" aria-live="polite"></p><span>${t('大小写不同，效果不同','Codes are case-sensitive')}</span></div><div id="tf-gallery" class="tf-gallery"></div>
 </section>
 <section class="tf-guide" aria-label="${t('使用说明','How to use')} "><div><span class="eyebrow">WRITE IT IN YOUR WORLD</span><h2>${t('复制之后，怎么用？','How to use your code')}</h2><p>${t('在装有模组、已开启文字效果的客户端查看。此页对应当前开发版的字母协议。','View the text with the mod installed and text effects enabled. This page uses the current development version’s letter protocol.')}</p></div><div class="tf-guide-rules"><p><code>&amp;p${t('彩虹文字','Rainbow text')}&amp;!</code><span>${t('代码写在前面，&! 结束效果。','Write codes before the text; &! resets the effect.')}</span></p><p><code>&amp;A&amp;B${t('抖动波浪','Shake + wave')}&amp;!</code><span>${t('连续代码可以组合。&r 是金白坍缩，不是重置。','Combine consecutive codes. &r is Radiant Bounce; use &! to reset.')}</span></p><p><code>§a${t('绿色','Green')} §l${t('粗体','Bold')} §r</code><span>${t('原版颜色和格式使用 §；&& 显示字面量 &。工作台会为普通文字中的 & 自动转义。','Use § for vanilla colours and formatting; && displays a literal &. The workshop escapes ampersands in your text.')}</span></p><p><span>${t('描边、频谱和默认渐变本身是静态效果；打字机在下方示例中循环演示。','Outline, spectrum and the default gradient are static effects. The typewriter demonstration loops in the library.')}</span></p></div></section>
 </div>`}
function mount(lang){
 language=lang;const root=document.querySelector('.tf-page');if(!root)return;
 const abort=new AbortController(),signal=abort.signal;
 const $=s=>root.querySelector(s),on=(el,event,fn)=>el.addEventListener(event,fn,{signal});
 let renderer;try{renderer=new E.Renderer()}catch(error){$('#tf-status').textContent=t('当前浏览器无法创建渲染预览。请开启硬件加速或更换浏览器；仍可生成并复制代码。','Rendering is unavailable. Enable hardware acceleration or try another browser; code generation still works.');console.warn('Text preview:',error.message)}
 let playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,clock=0,last=performance.now(),lastDraw=0,raf=0,dirty=true,filter='all',search='',cards=[],observer;
 const visible=new Set();
 const notify=message=>$('#tf-status').textContent=message;
 function output(){
  $('#tf-code').value=E.serialize(draft.layers,draft.text);$('#tf-length').textContent=Array.from(draft.text).length+' / 80';
  $('#tf-main-canvas').setAttribute('aria-label',t('文字预览：','Text preview: ')+draft.text);
  $('#tf-add').disabled=draft.layers.length>=8;save();dirty=true;
 }
 function parameter(p,index,values){const value=values[p.key]??p.value,id=`tf-param-${index}-${p.key}`;
  if(p.type==='flag')return `<label class="tf-flag"><input type="checkbox" data-param="${p.key}" data-layer="${index}" ${value===true||value==='true'?'checked':''}>${p[language]}</label>`;
  if(p.type==='color')return `<label class="tf-color-field" for="${id}"><span>${p[language]}</span><span><input id="${id}" type="color" value="${esc(value)}" data-param="${p.key}" data-layer="${index}"><output>${esc(value)}</output></span></label>`;
  return `<label class="tf-parameter" for="${id}"><span>${p[language]}<output>${esc(value)}</output></span><input id="${id}" type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${esc(value)}" data-param="${p.key}" data-layer="${index}"></label>`;
 }
 function layers(){
  $('#tf-layers').innerHTML=draft.layers.length?draft.layers.map((layer,i)=>{const d=E.definitions[layer.code],schema=layer.code==='M'?null:E.schemas[layer.code];return `<div class="tf-layer"><details ${draft.layers.length<=3||i===draft.layers.length-1?'open':''}><summary><code>&amp;${layer.code}</code><span>${esc(label(d))}</span><span class="tf-chevron" aria-hidden="true">⌄</span></summary><div class="tf-layer-body">${layer.code==='M'?`<p>${t('此代码已注册，但当前游戏文字入口仅使用默认阴影，尚不应用自定义阴影参数。预览保留同样的默认阴影。','This code is registered, but the current game text entry point uses the default shadow and does not apply custom shadow parameters. The preview keeps that default shadow.')}</p>`:schema?schema.map(p=>parameter(p,i,layer.params||{})).join(''):d.recipe?`<p>${t('此快捷码使用固定配方。展开后可单独调整每个参数。','This shortcut uses a fixed recipe. Expand it to adjust its individual parameters.')}</p><button type="button" class="tf-small" data-expand="${i}">${t('展开配方并调整','Expand recipe to edit')} ↗</button>`:`<p>${t('此效果的颜色与材质由模组内置。可叠加大写动作代码。','The mod defines this effect’s colours and material. Add uppercase motion codes to combine it.')}</p>`}</div></details><div class="tf-layer-actions"><span>${String(i+1).padStart(2,'0')}</span><button type="button" data-move="${i}" data-step="-1" ${i===0?'disabled':''} aria-label="${t('上移','Move up')} ${esc(label(d))}">↑</button><button type="button" data-move="${i}" data-step="1" ${i===draft.layers.length-1?'disabled':''} aria-label="${t('下移','Move down')} ${esc(label(d))}">↓</button><button type="button" data-remove="${i}" aria-label="${t('移除','Remove')} ${esc(label(d))}">${t('移除','Remove')}</button></div></div>`}).join(''):`<p class="tf-empty">${t('当前是普通文字。添加一个效果开始制作。','Plain text for now. Add an effect to begin.')}</p>`;
  output();
 }
 function restart(){clock=0;cards.forEach(c=>c.dataset.start='0');dirty=true}
 function updatePlay(){$('#tf-play').textContent=playing?t('Ⅱ 暂停动画','Ⅱ Pause motion'):t('▶ 播放动画','▶ Play motion');$('#tf-play').setAttribute('aria-pressed',String(playing))}
 function gallery(){
  observer?.disconnect();visible.clear();
  const list=D.codes.filter(d=>{
   if(filter==='ready'&&d.code!==d.code.toLowerCase())return false;
   if(filter==='primitive'&&d.code!==d.code.toUpperCase())return false;
   if(filter==='material'&&!(d.code>='R'&&d.code<='Z'))return false;
   const q=search.trim();return !q||(q.startsWith('&')?('&'+d.code).startsWith(q):(label(d)+' '+d.name+' '+d.label.en).toLowerCase().includes(q.toLowerCase()));
  });
  $('#tf-count').textContent=t(`${list.length} 个效果`,`${list.length} effects`);
  $('#tf-gallery').innerHTML=list.length?list.map(d=>`<article class="tf-effect" data-code="${d.code}"><div class="tf-effect-heading"><code>&amp;${d.code}</code><h3>${esc(label(d))}</h3></div><canvas class="tf-card-canvas" data-preview="${d.code}" role="img" aria-label="${esc(label(d))} ${t('效果预览','effect preview')}"></canvas>${d.code==='M'?`<p class="tf-effect-note">${t('当前游戏入口使用默认阴影','Current game entry point uses the default shadow')}</p>`:''}<div class="tf-effect-bottom"><button type="button" data-load="${d.code}">${t('载入工作台','Open in workshop')} ↗</button><button type="button" data-copy-effect="${d.code}" aria-label="${t('复制','Copy')} &amp;${d.code} ${t('示例','example')}">${t('复制','Copy')}</button></div></article>`).join(''):`<div class="tf-empty"><p>${t('没有找到这个效果。试试输入「波浪」或「&B」。','No effect found. Try “wave” or “&B”.')}</p><button type="button" class="tf-small" id="tf-clear-search">${t('清除筛选','Clear filters')}</button></div>`;
  cards=[...root.querySelectorAll('.tf-card-canvas')];
  observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){visible.add(entry.target);entry.target.dataset.start=String(clock);dirty=true}else visible.delete(entry.target)}},{rootMargin:'70px'});
  observer.observe($('#tf-main-canvas'));cards.forEach(c=>observer.observe(c));dirty=true;
 }
 async function copy(code){
  let copied=false;try{await navigator.clipboard.writeText(code);copied=true}catch{const input=document.createElement('textarea');input.value=code;input.setAttribute('aria-label',t('待复制代码','Code to copy'));input.style.cssText='position:fixed;top:0;left:0;opacity:0';root.append(input);input.select();try{copied=document.execCommand('copy')}catch{}input.remove()}
  notify(copied?t('已复制，可以粘贴到游戏中。','Copied. Paste it into your game.'):t('自动复制不可用，请选中游戏代码后手动复制。','Automatic copy is unavailable. Select the game code and copy it manually.'));
  if(!copied){$('#tf-code').focus();$('#tf-code').select()}
  return copied;
 }
 on($('#tf-text'),'input',()=>{draft.text=Array.from($('#tf-text').value).slice(0,80).join('');if($('#tf-text').value!==draft.text)$('#tf-text').value=draft.text;restart();output()});
 on($('#tf-copy'),'click',async()=>{await copy($('#tf-code').value)});
 on($('#tf-play'),'click',()=>{playing=!playing;updatePlay();dirty=true});
 on($('#tf-replay'),'click',()=>{restart();last=performance.now();dirty=true});
 on($('#tf-size'),'change',()=>{draft.size=Number($('#tf-size').value);dirty=true});
 on($('#tf-add'),'click',()=>{if(draft.layers.length<8){draft.layers.push({code:$('#tf-add-select').value,params:{}});layers()}});
 on($('#tf-reset'),'click',()=>{draft=defaults();$('#tf-text').value=draft.text;$('#tf-preset').value='';restart();layers();setBackground(draft.background);$('#tf-size').value=String(draft.size);notify(t('已恢复示例配方。','Example recipe restored.'))});
 on($('#tf-preset'),'change',()=>{const p=D.presets[$('#tf-preset').value];if(p){draft.layers=p.map(e=>({code:e.code,params:{...e.params}}));restart();layers()}});
 on($('#tf-search'),'input',()=>{search=$('#tf-search').value;gallery()});
 on($('#tf-layers'),'input',event=>{const el=event.target;if(!el.dataset.param)return;const layer=draft.layers[Number(el.dataset.layer)];layer.params[el.dataset.param]=el.type==='checkbox'?el.checked:el.type==='color'?el.value:Number(el.value);const out=el.closest('label').querySelector('output');if(out)out.textContent=el.value;output()});
 function setBackground(bg){draft.background=bg;$('.tf-stage').dataset.background=bg;root.querySelectorAll('[data-bg]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.bg===bg)))}
 on(root,'click',event=>{const b=event.target.closest('button');if(!b)return;
  if(b.dataset.bg)setBackground(b.dataset.bg);
  if(b.dataset.filter){filter=b.dataset.filter;root.querySelectorAll('[data-filter]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.filter===filter)));gallery()}
  if(b.id==='tf-clear-search'){search='';filter='all';$('#tf-search').value='';root.querySelectorAll('[data-filter]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.filter==='all')));gallery()}
  if(b.dataset.load){draft.layers=[{code:b.dataset.load,params:{}}];restart();$('#tf-preset').value='';layers();$('.tf-workbench').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});$('#tf-text').focus({preventScroll:true});notify(t('已载入效果，可以继续叠加或调整。','Effect loaded. Add layers or adjust its parameters.'))}
  if(b.dataset.copyEffect)copy(E.serialize([{code:b.dataset.copyEffect,params:{}}],draft.text||t('星河入梦','Light Pollution')));
  if(b.dataset.remove!==undefined){draft.layers.splice(Number(b.dataset.remove),1);layers()}
  if(b.dataset.move!==undefined){const i=Number(b.dataset.move),j=i+Number(b.dataset.step);[draft.layers[i],draft.layers[j]]=[draft.layers[j],draft.layers[i]];layers()}
  if(b.dataset.expand!==undefined){const i=Number(b.dataset.expand),recipe=E.definitions[draft.layers[i].code].recipe;if(draft.layers.length-1+recipe.length>8){notify(t('展开后会超过 8 项，请先移除一项效果。','Expanding would exceed 8 layers. Remove an effect first.'));return}draft.layers.splice(i,1,...recipe.map(p=>({code:p.code,params:{...p.params}})));layers()}
 });
 on(document,'visibilitychange',()=>{last=performance.now();dirty=true});
 on(window,'resize',()=>{dirty=true});
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');on(reduced,'change',()=>{if(reduced.matches){playing=false;updatePlay();dirty=true}});
 function frame(now){
  const delta=Math.min(100,now-last);last=now;
  if(!document.hidden&&playing&&visible.size)clock+=delta;
  if(renderer&&!document.hidden&&(dirty||(playing&&now-lastDraw>=40))){
   for(const target of visible){try{const main=target.id==='tf-main-canvas';renderer.render(target,main?draft.text:t('星河入梦','Light Pollution'),main?draft.layers:[{code:target.dataset.preview,params:{}}],main?clock:clock-Number(target.dataset.start||0),{size:main?draft.size:34,loop:!main})}catch(error){notify(t('预览渲染已停止，请刷新页面重试。','Preview stopped. Refresh this page to try again.'));console.warn(error);playing=false;updatePlay();break}}
   dirty=false;lastDraw=now;
  }
  raf=requestAnimationFrame(frame);
 }
 layers();gallery();updatePlay();raf=requestAnimationFrame(frame);
 session={reset(){cancelAnimationFrame(raf);observer?.disconnect();abort.abort();renderer?.destroy();save()},stats(){return{visible:visible.size,playing,clock,renderer:!!renderer,layers:draft.layers.length}}};
}
function reset(){session?.reset();session=null}
window.WikiTextEffects={page,mount,reset,stats:()=>session?.stats()};
})();
