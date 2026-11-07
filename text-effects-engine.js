/* Browser adaptation of the mod's per-glyph animation maths.
 * Attribution and shader provenance: assets/licenses/text-effects.txt.
 * Canvas fonts differ from a Minecraft resource-pack font; time/recipe parameters
 * and the fragment-effect selection order follow the written game protocol.
 */
'use strict';
(() => {
const catalogue = window.WIKI_TEXT_EFFECTS;
const definitions = Object.fromEntries(catalogue.codes.map(d => [d.code,d]));
const num = (key,zh,en,value,min,max,step=.1) => ({key,zh,en,value,min,max,step,type:'number'});
const col = (key,zh,en,value) => ({key,zh,en,value,type:'color'});
const flag = (key,zh,en,value=false) => ({key,zh,en,value,type:'flag'});
const amp = (v=1,max=5) => num('a','幅度','Amplitude',v,0,max);
const speed = (v=1) => num('f','速度','Speed',v,0,4,.05);
const phase = (v=1) => num('w','字间相位','Letter phase',v,0,4,.05);
const intensity = (v=1.5) => num('i','强度','Intensity',v,0,6);
const colour = (v='#00e8ff') => col('c','效果颜色','Effect colour',v);
const schemas = {
 A:[amp(),speed()], B:[amp(),speed(),phase()], C:[amp(),speed(),phase()],
 D:[amp(),speed(),phase(0)], E:[amp(),speed(),phase()],
 F:[num('a','摆角','Angle',30,0,90,1),num('r','环绕半径','Orbit radius',0,0,5),speed()],
 G:[amp(),speed()], H:[speed()], I:[speed(),phase()],
 J:[col('from','起始颜色','From','#5bcefa'),col('to','结束颜色','To','#f5a9b8'),num('sp','渐变跨度','Colour span',20,1,40,1),speed(0),flag('uni','单向渐变','One-way gradient'),flag('hue','沿色相渐变','Interpolate hue')],
 K:[num('base','最低亮度','Base brightness',.45,0,1,.05),amp(),speed(),phase(0)],
 L:[num('a','最低透明度','Minimum opacity',.3,0,1,.05),speed(),phase(0)],
 M:[num('x','水平偏移','Horizontal offset',0,-5,5),num('y','垂直偏移','Vertical offset',0,-5,5),colour('#000000'),num('a','阴影透明度','Shadow opacity',1,0,1,.05)],
 N:[speed(),num('j','抖动概率','Jitter probability',.35,0,1,.05),num('b','闪烁概率','Blink probability',.06,0,.5,.01)],
 O:[num('p','光晕层数','Glow passes',10,4,32,1),num('r','光晕半径','Glow radius',2,0,5),num('a','光晕透明度','Glow opacity',.45,0,1,.05)],
 P:[num('f','打字速度','Typing speed',1,.05,4,.05)], Q:[num('sp','色带跨度','Spectrum span',12,1,32,1)],
 R:[colour('#000000'),num('t','描边厚度','Outline width',1,.5,4,.1)], S:[colour(),intensity(1.6),speed()], T:[intensity(1.2),speed()],
 U:[num('d','层间距离','Layer depth',1,0,4),num('l','层数','Layers',4,1,16,1),num('m','颜色模式 0 / 1','Colour mode 0 / 1',0,0,1,1),colour('#303030')],
 V:[colour('#ffffff'),speed(),num('d','条纹密度','Stripe density',6,.5,20,.5)], W:[intensity(2),speed()], X:[intensity(),speed()],
 Y:[colour('#3fa9f5'),num('l','水位','Water level',.6,0,1,.05),amp(),speed(),num('w','波纹密度','Wave density',2,.5,8,.1)], Z:[intensity(1),speed()]
};
const clamp = (v,a=0,b=1) => Math.min(b,Math.max(a,v));
const fract = v => v-Math.floor(v);
const mix = (a,b,t) => a.map((v,i)=>v+(b[i]-v)*t);
const rgb = hex => {
 const value=String(hex).replace(/^#/,'');
 const parsed=parseInt(value.slice(-6),16);
 return [(parsed>>16&255)/255,(parsed>>8&255)/255,(parsed&255)/255,value.length===8?parseInt(value.slice(0,2),16)/255:1];
};
const hsv = (h,s,v) => {const f=(n)=>{const k=(n+h*6)%6;return v-v*s*Math.max(0,Math.min(k,4-k,1))};return [f(5),f(3),f(1),1]};
const toHsv = c => {const hi=Math.max(...c.slice(0,3)),lo=Math.min(...c.slice(0,3)),d=hi-lo;let h=0;if(d)h=hi===c[0]?(c[1]-c[2])/d+(c[1]<c[2]?6:0):hi===c[1]?(c[2]-c[0])/d+2:(c[0]-c[1])/d+4;return[h/6,hi?d/hi:0,hi]};
const random = n => fract(Math.sin(n*12.9898+78.233)*43758.5453);
const bounce = t => {if(t<1/2.75)return 7.5625*t*t;if(t<2/2.75){t-=1.5/2.75;return 7.5625*t*t+.75}if(t<2.5/2.75){t-=2.25/2.75;return 7.5625*t*t+.9375}t-=2.625/2.75;return 7.5625*t*t+.984375};
// Java Random + Collections.shuffle seed used by TextAnim, computed once (never per frame).
function directions(){let seed=(0x5eedn^0x5deece66dn)&((1n<<48n)-1n);const next=()=>{seed=(seed*0x5deece66dn+11n)&((1n<<48n)-1n);return Number(seed>>17n)};const order=Array.from({length:30},(_,i)=>i);for(let i=30;i>1;i--){let bits=next(),j;if((i&(i-1))===0)j=Math.floor(i*bits/2147483648);else{j=bits%i;while(bits-j+i-1>=2147483648){bits=next();j=bits%i}}[order[i-1],order[j]]=[order[j],order[i-1]]}return order.map(i=>[Math.cos(i*Math.PI/15),Math.sin(i*Math.PI/15)])}
const dirs=directions();
function expand(layers){
 const entries=[],legacy=new Set();
 for(const layer of layers){const d=definitions[layer.code];if(!d)continue;
  if(d.recipe)entries.push(...d.recipe.map(p=>({code:p.code,params:{...p.params}})));
  else if(layer.code===layer.code.toLowerCase())legacy.add(layer.code);
  else entries.push({code:layer.code,params:layer.params||{}});
 }
 return {entries,legacy};
}
function params(code,written){const result={};for(const p of schemas[code]||[])result[p.key]=p.value;Object.assign(result,written);return result}
function stateFor(entries,index,point,millis,count){
 const g={x:0,y:0,rotation:0,pendulum:0,color:[1,1,1,1],alpha:1,fragment:0,fc:[1,1,1,1],fp:[0,0,0,0],glow:null,shadow:null};
 for(const e of entries){const p=params(e.code,e.params),n=(k)=>Number(p[k]),a=n('a'),f=n('f'),w=n('w');let t;
  switch(e.code){
   case 'A':{const d=dirs[Math.abs(Math.trunc(millis*.01*f)+point+index)%30];g.x+=d[0]*.6*a;g.y+=d[1]*.6*a;break}
   case 'B':g.y+=Math.sin(millis*.01*f+index*w)*2*a;break;
   case 'C':{const delta=Math.sin(millis*.01*f+index*2*w)*1.5*a,d=dirs[Math.abs(point)%30];g.x+=d[0]*delta;g.y+=d[1]*delta;break}
   case 'D':g.rotation+=Math.sin(millis*.003*f+index*w)*a*12;break;
   case 'E':t=fract(millis*.001*f-index*w*.2);g.y-=(t<.2?Math.sin(t/.2*Math.PI/2):t<.8?1-bounce((t-.2)/.6):0)*a*4;break;
   case 'F':t=millis*.002*f-index*.1;g.pendulum=Math.sin(t)*a;g.x+=Math.cos(t)*n('r');g.y+=Math.sin(t)*n('r');break;
   case 'G':t=millis*.002*f;g.x+=Math.sin(t*1.7+index*.31+point*.07)*a*1.5;g.y+=Math.sin(t*2.3+index*.27+point*.11)*a*1.5;break;
   case 'H':g.x-=(millis*.04*f)%40;break;
   case 'I':g.color=hsv(fract((millis*.02*f+index*w)/30),.8,.8);break;
   case 'J':{const from=rgb(p.from),to=rgb(p.to);t=fract(index/n('sp')+millis*.001*f);if(p.uni!==true&&p.uni!=='true')t=t<.5?t*2:2-t*2;
    if(p.hue===true||p.hue==='true'){const h1=toHsv(from),h2=toHsv(to);let d=fract(h2[0]-h1[0]);if(d>.5)d-=1;g.color=hsv(fract(h1[0]+d*t),h1[1]+(h2[1]-h1[1])*t,h1[2]+(h2[2]-h1[2])*t)}else g.color=mix(from,to,t);break}
   case 'K':{const k=n('base')+a*.55*(.5+.5*Math.sin(millis*.002*f+index*w));g.color=g.color.map((v,i)=>i<3?v*k:v);break}
   case 'L':g.alpha*=a+(1-a)*(.5+.5*Math.sin(millis*.002*f+index*w));break;
   // The current game entry point applies AnimSpec with shadow=false. SHADOW is
   // registered, but its parameter branch is skipped there. Keep the preview
   // honest: the default shadow remains; the UI explains the limitation.
   case 'M':break;
   case 'N':t=Math.floor(millis*.025*f);if(t%3===1&&random(t*31+point+index)<n('j')){g.x+=(random(t+point*7)-.5)*8;g.y+=(random(t+index*11)-.5)*4}if(random(t*7+point*3+index)<n('b'))g.alpha=0;break;
   case 'O':g.glow={passes:n('p'),radius:n('r'),alpha:a};break;
   case 'P':if(index>=Math.floor(millis/(20/Math.max(.05,f))))g.alpha=0;break;
   case 'Q':g.color=hsv(fract(index/n('sp')),.75,.95);break;
   case 'R':g.fragment=1;g.fc=rgb(p.c);g.fp=[n('t'),0,0,0];break;
   case 'S':g.fragment=2;g.fc=rgb(p.c);g.fp=[n('i'),f,0,0];break;
   case 'T':g.fragment=3;g.fp=[n('i'),f,0,0];break;
   case 'U':g.fragment=4;g.fc=rgb(p.c);g.fp=[n('d'),n('l'),n('m'),0];break;
   case 'V':g.fragment=5;g.fc=rgb(p.c);g.fp=[0,f,n('d'),0];break;
   case 'W':g.fragment=6;g.fp=[n('i'),f,0,0];break;
   case 'X':g.fragment=7;g.fp=[n('i'),f,0,0];break;
   case 'Y':g.fragment=8;g.fc=rgb(p.c);g.fp=[n('l'),a,f,w];break;
   case 'Z':g.fragment=9;g.fp=[n('i'),f,0,0];break;
  }
 }
 return g;
}
function serialize(layers,text){
 const literal=String(text).replace(/(\\*)&/g,(_,slashes)=>slashes?slashes+'\\&':'&&');
 const reset=String(text).endsWith('\\')?'§r':'&!';
 return layers.filter(e=>definitions[e.code]).map(e=>'&'+e.code+(Object.keys(e.params||{}).length&&schemas[e.code]?'{'+Object.entries(e.params).map(([k,v])=>{const field=schemas[e.code].find(p=>p.key===k);return k+'='+(field?.type==='number'?Number(v):v)}).join(' ')+'}':'')).join('')+literal+reset;
}
class Renderer {
 constructor(){
  this.canvas=document.createElement('canvas');this.cache=new Map();
  const gl=this.gl=this.canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,preserveDrawingBuffer:true});
  if(!gl)throw new Error('WebGL unavailable');
  const shader=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s};
  this.program=gl.createProgram();gl.attachShader(this.program,shader(gl.VERTEX_SHADER,'attribute vec2 Position;attribute vec2 UV;uniform vec2 Viewport;varying vec2 texCoord0;void main(){texCoord0=UV;gl_Position=vec4(Position.x/Viewport.x*2.0-1.0,1.0-Position.y/Viewport.y*2.0,0,1);}'));
  gl.attachShader(this.program,shader(gl.FRAGMENT_SHADER,window.WIKI_TEXT_SHADER));gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(this.program));gl.useProgram(this.program);
  this.u={};for(const n of ['Viewport','AtlasSize','GlyphScale','GlyphBody','ColorModulator','GameTime','vertexColor','effectId','effectColor','effectParams','glyphBounds'])this.u[n]=gl.getUniformLocation(this.program,n);
  this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
  for(const [name,offset] of [['Position',0],['UV',8]]){const loc=gl.getAttribLocation(this.program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,16,offset)}
  gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  gl.uniform4f(this.u.ColorModulator,1,1,1,1);gl.uniform1f(this.u.GlyphScale,4);
 }
 atlas(text){
  if(this.cache.has(text))return this.cache.get(text);
  const unique=[...new Set(Array.from(text).filter(c=>c!=='\n'))],cell=96,cols=10;
  const surface=document.createElement('canvas');surface.width=cols*cell;surface.height=Math.max(1,Math.ceil((unique.length*2+1)/cols))*cell;
  const ctx=surface.getContext('2d');ctx.textBaseline='top';ctx.fillStyle='#fff';ctx.fillRect(2,2,8,8);
  const glyphs=new Map();let i=1;
  for(const bold of [false,true])for(const char of unique){const x=i%cols*cell,y=Math.floor(i/cols)*cell;i++;ctx.font=`${bold?600:400} 36px "Microsoft YaHei", "Noto Sans CJK SC", sans-serif`;const width=ctx.measureText(char).width;ctx.fillText(char,x+24,y+20);glyphs.set(char+bold,{x,y,width,body:[x+24,y+20,x+24+width,y+62]})}
  const gl=this.gl,texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,surface);
  const value={width:surface.width,height:surface.height,texture,glyphs};this.cache.set(text,value);if(this.cache.size>3){const old=this.cache.keys().next().value;gl.deleteTexture(this.cache.get(old).texture);this.cache.delete(old)}return value;
 }
 render(target,text,layers,millis,{size=40,loop=false}={}){
  if(this.gl.isContextLost())throw new Error('WebGL context lost');
  text=Array.from(String(text)).slice(0,120).join('');
  const gl=this.gl,dpr=Math.min(window.devicePixelRatio||1,2),width=Math.max(1,Math.round(target.clientWidth*dpr)),height=Math.max(1,Math.round(target.clientHeight*dpr));
  if(target.width!==width||target.height!==height){target.width=width;target.height=height}
  if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height}
  gl.viewport(0,0,width,height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(this.program);gl.uniform2f(this.u.Viewport,width,height);
  const at=this.atlas(text);gl.bindTexture(gl.TEXTURE_2D,at.texture);gl.uniform2f(this.u.AtlasSize,at.width,at.height);
  // GameTime is Minecraft's day fraction, advancing once per 1,200,000 ms.
  gl.uniform1f(this.u.GameTime,millis/1200000);
  const {entries,legacy}=expand(layers),bold=[...legacy].some(c=>'hqystvum'.includes(c));
  const lines=text.split('\n'),lineWidths=lines.map(line=>Array.from(line).reduce((sum,c)=>sum+(at.glyphs.get(c+bold)?.width||0),0));
  const zoom=Math.min(size/36,Math.max(.025,(width/dpr-52)/Math.max(1,...lineWidths)),Math.max(.025,(height/dpr-24)/(54*lines.length)))*dpr;
  const lineHeight=54*zoom,totalHeight=lines.length*lineHeight;
  const copy=(sprite,x,y,angle,color,id=0,fc=[1,1,1,1],fp=[0,0,0,0],pendulum=false)=>{
   gl.uniform4fv(this.u.vertexColor,color);gl.uniform1f(this.u.effectId,id);gl.uniform4fv(this.u.effectColor,fc);gl.uniform4fv(this.u.effectParams,fp);
   gl.uniform4f(this.u.glyphBounds,(sprite.x+1)/at.width,(sprite.y+1)/at.height,(sprite.x+95)/at.width,(sprite.y+95)/at.height);
   gl.uniform4f(this.u.GlyphBody,sprite.body[0]/at.width,sprite.body[1]/at.height,sprite.body[2]/at.width,sprite.body[3]/at.height);
   const cx=24+sprite.width/2,cy=pendulum?20:40,cos=Math.cos(angle),sin=Math.sin(angle),verts=[];
   for(const [u,v] of [[0,0],[96,0],[0,96],[0,96],[96,0],[96,96]]){const dx=(u-cx)*zoom,dy=(v-cy)*zoom;verts.push(x+cx*zoom+dx*cos-dy*sin,y+cy*zoom+dx*sin+dy*cos,(sprite.x+u)/at.width,(sprite.y+v)/at.height)}
   gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STREAM_DRAW);gl.drawArrays(gl.TRIANGLES,0,6);
  };
  const rect=(x,y,w,h,color)=>{
   gl.uniform4fv(this.u.vertexColor,color);gl.uniform1f(this.u.effectId,0);
   const u0=3/at.width,u1=8/at.width,v0=3/at.height,v1=8/at.height;
   gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([x,y,u0,v0,x+w,y,u1,v0,x,y+h,u0,v1,x,y+h,u0,v1,x+w,y,u1,v0,x+w,y+h,u1,v1]),gl.STREAM_DRAW);gl.drawArrays(gl.TRIANGLES,0,6);
  };
  const palette=(colors,i,speed)=>{const t=fract(millis*.001*speed+i*.135)*colors.length;return mix(rgb(colors[Math.floor(t)]),rgb(colors[(Math.floor(t)+1)%colors.length]),fract(t))};
  let index=0;
  for(let line=0;line<lines.length;line++){
   let cursor=(width-lineWidths[line]*zoom)/2;
   for(const char of Array.from(lines[line])){
    const sprite=at.glyphs.get(char+bold),point=char.codePointAt(0);
    let time=millis;if(loop&&entries.some(e=>e.code==='P')){const e=entries.find(e=>e.code==='P'),f=Number(e.params.f||1);time=millis%(Array.from(text).length*20/Math.max(.05,f)+1800)}
    const g=stateFor(entries,index,point,time,Array.from(text).length);
    let x=cursor-24*zoom+g.x*4*zoom,y=(height-totalHeight)/2+line*lineHeight+g.y*4*zoom,angle=(g.rotation||g.pendulum)*Math.PI/180;
    const draw=(color,dx=0,dy=0,alpha=1,id=0,fc,fp)=>copy(sprite,x+dx*4*zoom,y+dy*4*zoom,angle,[...color.slice(0,3),clamp(g.alpha*alpha*(color[3]??1))],id,fc,fp,!g.rotation&&!!g.pendulum);
    const glow=(color,alpha=.25,r=1)=>{for(let j=0;j<8;j++){const t=j*Math.PI/4;draw(color,Math.cos(t)*r,Math.sin(t)*r,alpha)}};
    const pulse=.5+Math.sin(millis*.001*1.25*Math.PI*2+index*.52)*.5,frame=Math.floor(millis/40),active=random(frame*31+point+index)<.544;
    let color=g.color;
    if(g.shadow)draw(g.shadow.color,g.shadow.x+1,g.shadow.y+1,g.shadow.alpha);else draw([0,0,0,1],.7,.7,.6);
    if(g.glow)for(let j=0;j<g.glow.passes;j++){const t=j*Math.PI*2/g.glow.passes;draw(mix(color,rgb('#32ddff'),.4),Math.cos(t)*g.glow.radius,Math.sin(t)*g.glow.radius,g.glow.alpha)}
    if(legacy.has('h')){rect(x+21*zoom,y+17*zoom,(sprite.width+6)*zoom,40*zoom,[.016,.027,.051,.54*g.alpha]);draw(rgb('#ff1738'),-.9,.25,.46);draw(rgb('#00e8ff'),.9,-.2,.46);color=rgb('#e8fbff');if(active)draw(rgb('#ffffff'),1.55,-.65,.22)}
    if(legacy.has('p'))color=hsv(fract(millis*.001*1.35+index*.075),.92,1);
    if(legacy.has('q')){color=palette(['#8f39ff','#d45cff','#15e6ff','#5033d8'],index,.38);glow(mix(rgb('#722dff'),rgb('#11e9ff'),pulse),.2,.85)}
    if(legacy.has('y')){color=palette(['#ff91e8','#8debff','#fff2a8','#a7ffcf','#c9a8ff'],index,.56);glow(rgb('#202342'),.72,.55);draw(rgb('#ffffff'),-.2,-.55,.48)}
    if(legacy.has('s')){color=rgb('#e7ffff');const tilt=(index%9-4)*.3;rect(x+20*zoom,y+(15.4+tilt)*zoom,(sprite.width+9)*zoom,41.2*zoom,[0,.663,.784,.34*g.alpha]);rect(x+21*zoom,y+(18.6+tilt)*zoom,(sprite.width+6.8)*zoom,2.2*zoom,[.45,.96,1,.78*g.alpha]);glow(rgb('#003b52'),.94,.65)}
    if(legacy.has('t')){color=palette(['#ff3b0a','#ff7a0a','#ffd43b','#ff5a12'],index,.44);glow(rgb('#ff2c00'),.22+pulse*.1,.85);draw(rgb('#fff09a'),-.15,-.45,.42)}
    if(legacy.has('v')){color=palette(['#b45cff','#4b9bff','#ffe15a','#64e879'],index,.22);draw(rgb('#3b1c0a'),.85,.85,.86);if(index%5===2)rect(x+21.4*zoom,y+18.2*zoom,(sprite.width+5.6)*zoom,37*zoom,[.22,.87,.96,.3*g.alpha])}
    if(legacy.has('u')){color=mix(rgb('#ff062b'),rgb('#fff3f6'),pulse*.34);draw(rgb('#090000'),1.35,.5,.94);glow(rgb('#ff001f'),.34+pulse*.08,.9);glow(rgb('#c40018'),.16,1.55);draw(rgb('#ff1433'),-2.05,.15,.16);draw(rgb('#8a0011'),2.35,.15,.12);if(active){draw(rgb('#ff0030'),-1.8,.7,.35);draw(rgb('#120003'),1.8,-.7,.68)}}
    if(legacy.has('m')){color=mix(rgb('#00efff'),rgb('#ff2bd6'),clamp(index/Math.max(1,Array.from(text).length-1)+(pulse-.5)*.12));draw(rgb('#11001e'),1.45,1.35,.96);draw(rgb('#40105f'),.85,.8,.84);glow(mix(rgb('#00bfff'),rgb('#d300ff'),pulse),.24+pulse*.08,.9);draw(rgb('#00efff'),-.8,0,.34);draw(rgb('#ff2bd6'),.8,0,.34);if(active){draw(rgb('#00efff'),-1.5,.65,.28);draw(rgb('#ff2bd6'),1.5,-.65,.28)}}
    if(legacy.has('g')&&active){g.alpha*=random(frame+point)<.43?.48:1;draw(rgb('#ff142e'),-1.25,.55,.36);draw(rgb('#0debff'),1.1,-.55,.36)}
    draw(color,0,0,1,g.fragment,g.fc,g.fp);cursor+=sprite.width*zoom;index++;
   }
   index++;
  }
  const ctx=target.getContext('2d');ctx.clearRect(0,0,width,height);ctx.drawImage(this.canvas,0,0);target.dataset.rendered='true';
 }
 destroy(){for(const at of this.cache.values())this.gl.deleteTexture(at.texture);this.cache.clear();this.gl.deleteBuffer(this.buffer);this.gl.deleteProgram(this.program);this.gl.getExtension('WEBGL_lose_context')?.loseContext()}
}
window.WikiTextEngine={Renderer,definitions,schemas,expand,params,stateFor,serialize};
})();
