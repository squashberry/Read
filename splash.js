(function(){
"use strict";
var d=document,q=location.search,nv=navigator;
var RM=!!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches),
css3=!!(window.CSS&&CSS.supports&&CSS.supports("transform-style","preserve-3d")),
lite=!!((nv.deviceMemory&&nv.deviceMemory<=2)||(nv.hardwareConcurrency&&nv.hardwareConcurrency<=2)||(nv.connection&&nv.connection.saveData))||/[?&]lite=1/.test(q),
FULL=css3,dark=false;
try{dark=(localStorage.getItem("library-theme")||"light")!=="light"}catch(e){}
var W=320,H=430,T0=22,CW=W+7,CH=H+10,N=lite?4:6,K=lite?3:6,TOT=10.7,TH=7.6,
SERIF='Georgia,"Iowan Old Style","Palatino Linotype",Palatino,"Times New Roman",serif',
SANS='"Plus Jakarta Sans",Manrope,system-ui,-apple-system,"Segoe UI",sans-serif';
var ov,sty,bk,V,BR,WM,LB,KW,TA,TB,PL,PR,CR,CL,FL,SPN,FR,FLt,FLl,lv=[],cv,tx1,tx2,
VW,VH,Zc,Zs,Z0,LZ3,WX=0,WY=0,KX=0,KY=0,FS=60,kwFS=10,done=false,raf=0,T=FULL?0:7.8,last=0;
function el(c,p,s){var e=d.createElement("div");if(c)e.className=c;if(s)e.style.cssText=s;if(p)p.appendChild(e);return e}
function cl(x){return x<0?0:x>1?1:x}
function sg(t,a,b){return cl((t-a)/(b-a))}
function io(x){return x<.5?4*x*x*x:1-Math.pow(2-2*x,3)/2}
function lp(a,b,x){return a+(b-a)*x}
/* page-turn schedule */
var LF=[],s0=2.05;
for(var i=0;i<N;i++){var u=N>1?i/(N-1):0;LF.push([s0,.62+.95*u*Math.sqrt(u)]);s0+=.14+.46*u*u}
var STYLE=
".sqi{position:fixed;inset:0;z-index:210;overflow:hidden;touch-action:none;color:#1a1c33;background:radial-gradient(ellipse 85% 75% at 50% 42%,#fff 0,#f1f4ff 42%,#c8d6fc 100%);transition:opacity .6s ease,transform .6s ease}"+
".sqi.sqd{color:#f1f3ff;background:radial-gradient(ellipse 85% 75% at 50% 42%,#292f62 0,#14172f 50%,#0c0e1f 100%)}"+
".sqi.out{opacity:0;transform:scale(1.035);pointer-events:none}"+
".sqi *{box-sizing:border-box}.sqi div{position:absolute}"+
".sqs{inset:0;perspective:1500px;perspective-origin:50% 50%}"+
".sqb{left:50%;top:50%;width:0;height:0;transform-style:preserve-3d}"+
".sqv{inset:0;background:inherit;opacity:1}"+
".fl{background:radial-gradient(closest-side,rgba(24,34,92,.36),rgba(24,34,92,.14) 60%,transparent)}.sqd .fl{background:radial-gradient(closest-side,rgba(0,0,0,.65),rgba(0,0,0,.25) 60%,transparent)}"+
".bd{background:linear-gradient(90deg,#10163e,#1b2354 12%,#1b2354);border-radius:2px}"+
".spn{background:linear-gradient(180deg,#141a46,#1d2658 50%,#141a46),#1b2354;transform-origin:0 0}"+
".ed{transform-origin:0 0;background:repeating-linear-gradient(to top,#f7f0de 0 1.1px,#d6cbae 1.1px 2.3px)}"+
".ed.v{background:repeating-linear-gradient(to right,#f7f0de 0 1.1px,#d6cbae 1.1px 2.3px)}"+
".pg{width:"+W+"px;height:"+H+"px;background:#fbf6ea}"+
".pg.r{background:linear-gradient(to right,rgba(70,52,36,.3),rgba(70,52,36,0) 15%),#fbf6ea}"+
".pg.l{background:linear-gradient(to left,rgba(70,52,36,.3),rgba(70,52,36,0) 15%),#fbf6ea}"+
".lf{left:0;transform-style:preserve-3d;transform-origin:0 50%}"+
".sg{top:0;transform-style:preserve-3d;transform-origin:0 50%}"+
".sg>.fc{inset:0;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden}"+
".sg>.fc.b{transform:rotateY(180deg)}"+
".sh{inset:0;background:#2a1f33;opacity:0}"+
".cs{width:"+W+"px;height:"+H+"px;pointer-events:none}"+
".tx{left:0;top:0;width:"+W+"px;height:"+H+"px;padding:25px 25px 20px 31px;overflow:hidden;color:#2a2d44;text-align:justify;hyphens:auto;-webkit-hyphens:auto;font:10px/1.43 "+SERIF+";letter-spacing:0}"+
".pg.l .tx,.tx.lt{padding:25px 31px 20px 25px}"+
".tx.b.rr{background:linear-gradient(to right,rgba(70,52,36,.3),rgba(70,52,36,0) 15%),#fbf6ea}"+
".tx p{margin:0 0 5px;text-indent:1.4em}.tx p.n{text-indent:0}"+
".tx h3{margin:6px 0 7px;font-size:13.5px;line-height:1.2;font-weight:700}"+
".tx h4{margin:7px 0 3px;font-size:10.6px;font-style:italic;font-weight:700}"+
".tx .rh{display:flex;justify-content:space-between;font-size:7.8px;letter-spacing:.06em;color:#6b6f88;border-bottom:.5px solid rgba(40,44,70,.28);padding-bottom:3px;margin-bottom:8px}.tx .rh i{font-style:normal}"+
".tx ul{margin:2px 0 5px;padding-left:15px}.tx li{margin:0 0 1px}"+
".tx .fg{display:block;margin:6px 0;padding:6px 8px;border:.5px solid rgba(40,44,70,.4);font-size:8.4px;line-height:1.35;background:rgba(200,214,252,.3);text-align:left}"+
".tx .fn{display:block;font-size:7.9px;line-height:1.35;color:#555a78;border-top:.5px solid rgba(40,44,70,.28);padding-top:3px;margin-top:6px}"+
".kw,.wm{--hl:0;--gl:0;--u:0}"+
".kw{position:relative;z-index:0;white-space:nowrap;color:#1a1c33;text-indent:0}"+
".kw::before,.wm::before{content:'';position:absolute;left:-.1em;right:-.1em;top:.06em;bottom:-.08em;z-index:-1;border-radius:.16em;background:linear-gradient(100deg,rgba(255,112,88,.84),rgba(255,86,110,.8));transform-origin:50% 100%}"+
".kw::before{transform:rotate(-.6deg);clip-path:inset(0 calc((1 - var(--hl))*100%) 0 0)}"+
".kw::after,.wm .g{content:'';position:absolute;left:-.5em;right:-.5em;top:-.35em;bottom:-.35em;z-index:-2;border-radius:50%;background:radial-gradient(closest-side,rgba(255,110,90,.5),transparent);opacity:var(--gl);filter:blur(.15em)}"+
".br{inset:0;opacity:0;pointer-events:none}"+
".bgl{left:50%;top:50%;width:90vmin;height:60vmin;margin:-30vmin 0 0 -45vmin;background:radial-gradient(closest-side,rgba(255,255,255,.95),rgba(255,255,255,0));opacity:0}.sqd .bgl{background:radial-gradient(closest-side,rgba(90,134,245,.3),rgba(90,134,245,0))}"+
".wm{left:50%;top:50%;z-index:0;white-space:nowrap;font:400 10px/normal "+SERIF+";color:#1a1c33;transform:translate(-50%,-50%)}"+
".wm::before{top:calc(.06em + var(--mt,0px));bottom:calc(-.08em - var(--mb,0px));transform:translateY(calc(var(--u)*.16em)) rotate(calc(-.6deg*(1 - var(--u)))) scaleY(calc(1 - var(--u)*.945));clip-path:inset(0 calc((1 - var(--hl))*100%) 0 0)}"+
".wm::after{content:attr(data-t);position:absolute;left:0;top:0;white-space:nowrap;color:transparent;background:linear-gradient(105deg,transparent 38%,rgba(255,255,255,.95) 50%,transparent 62%) no-repeat;background-size:260% 100%;background-position:var(--sw,130%) 0;-webkit-background-clip:text;background-clip:text}"+
".sqd .wm::after{background-image:linear-gradient(105deg,transparent 38%,rgba(255,196,176,.95) 50%,transparent 62%)}"+
".lb{left:50%;top:50%;opacity:0;white-space:nowrap;font-family:"+SANS+";font-weight:600;transform:translate(-50%,-50%)}"+
/* ---------- book copy ---------- */
var LH='<span class="rh"><i>148</i><i>Methods of Study</i></span><h3>4.2&ensp;Reading Actively</h3>'+
'<p class="n">Reading is not a passive act. A page is understood only when the reader returns to it with a question, and the strongest students learn to ask before they read, while they read, and again once the chapter has closed.</p>'+
'<p>Three habits recur in careful study. The first is survey: a quick pass over headings, figures and summaries to learn what the chapter intends. The second is question, turning every heading into something the page must answer. The third is recall, which means closing the book and saying aloud what was just read.</p>'+
'<h4>Why summaries matter</h4><p class="n">A summary written in the margin forces a decision about what is essential. Over a term these small decisions gather into a map of the whole course, and a map is far easier to revise from than a pile of unsorted notes.</p>'+
'<span class="fg"><b>Table 4.1</b>&ensp;A typical revision cycle. Survey, 10 min; read, 35 min; recall, 10 min; review the next day, 15 min.</span>'+
'<p>Revision then becomes a rhythm rather than a rush. Short sessions repeated across several days outperform a single long night, a result confirmed in studies of memory for well over a century.</p>'+
'<span class="fn">1&ensp;The spacing effect is treated in full in Chapter 7.</span>',
RH='<span class="rh"><i>The Private Collection</i><i>149</i></span><h3>4.3&ensp;The Private Collection</h3>'+
'<p class="n">A reader\u2019s collection is more than a shelf of documents. Each file records a question once asked, and each question points toward the next. When lectures, notes and past papers are kept together, revision stops being a search and becomes a conversation with one\u2019s own understanding.</p>'+
'<h4>Gathering what you know</h4>'+
'<p class="n">Few collections have made this habit as gentle as <span class="kw">Squashberry</span>, a library built for students who prefer calm study to clutter. Its shelves hold presentations, notes and practice questions, numbered so that every file can be found at once and read at its own pace.</p>'+
'<ul><li>Gather the material in one place.</li><li>Read each file with a purpose.</li><li>Test yourself before moving on.</li><li>Return to it the following day.</li></ul>'+
'<span class="fg"><b>Figure 4.2</b>&ensp;The cycle of gathering, reading, testing and returning.</span>'+
'<p>The method is simple, but its value lies in repetition. A collection that is opened often becomes familiar, and what is familiar is easier to recall under the pressure of an examination.</p>';
/* ---------- texture for fast-moving leaves ---------- */
function tex(seed,x0,x1){
 var s=seed,r=function(){s=s*16807%2147483647;return s/2147483647},c=d.createElement("canvas"),k=1.5;
 c.width=W*k;c.height=H*k;var g=c.getContext("2d");if(!g)return"";g.scale(k,k);g.fillStyle="rgba(38,42,66,.82)";
 var wd="the of and a library study notes reading memory chapter method review recall question summary page margin concept evidence practice revision lecture figure table cycle habit".split(" "),y=36;
 function ln(fs,last,b){g.font=(b?"bold ":"")+fs+"px Georgia,serif";var a=[],w=0,sp=fs*.28,m=x1-x0;
  for(;;){var t=wd[r()*wd.length|0],tw=g.measureText(t).width;if(w+tw+(a.length?sp:0)>m)break;a.push([t,tw]);w+=tw+(a.length>1?sp:0);if(last&&w>m*(.3+.4*r()))break}
  var tot=0;a.forEach(function(p){tot+=p[1]});var gap=last||a.length<2?sp:(m-tot)/(a.length-1),x=x0;a.forEach(function(p){g.fillText(p[0],x,y);x+=p[1]+gap});y+=fs*1.43}
 g.fillStyle="rgba(90,94,120,.7)";ln(7.8,1);y+=5;g.fillStyle="rgba(38,42,66,.82)";ln(13.5,1,1);y+=7;
 for(var p=0;p<5&&y<H-30;p++){var n=3+(r()*4|0);for(var j=0;j<n&&y<H-26;j++)ln(10,j==n-1);y+=5;if(p==1){ln(10.6,1,1);y+=3}}
 try{return c.toDataURL("image/png")}catch(e){return""}}
/* ---------- leaves (nested bendable strips) ---------- */
function mkLeaf(lw,lh,ff,bf){
 var r=el("lf",bk,"width:"+lw+"px;height:"+lh+"px;top:"+(-lh/2)+"px"),sw=lw/K,S=[],p=r;
 for(var i=0;i<K;i++){var s=el("sg",p,"left:"+(i?sw:0)+"px;width:"+(sw+(i<K-1?.8:0))+"px;height:"+lh+"px"),f=el("fc f",s),b=el("fc b",s);
  ff(f,-i*sw);bf(b,-(lw-(i+1)*sw));S.push({s:s,f:el("sh",f),b:el("sh",b)});p=s}
 return{r:r,S:S,sh:true,ph:-1,bt:-1}}
function pgBg(f,ox,url,dir){
 var g="linear-gradient(to "+(dir=="r"?"right":"left")+",rgba(70,52,36,.3),rgba(70,52,36,0) 15%)",z=W+"px "+H+"px",st=f.style;
 st.backgroundImage=url?"url("+url+"),"+g:g;st.backgroundSize=url?z+","+z:z;st.backgroundPosition=url?ox+"px 0,"+ox+"px 0":ox+"px 0";st.backgroundRepeat="no-repeat";st.backgroundColor="#fbf6ea"}
var EMB='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 327 440"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3dc9e"/><stop offset=".5" stop-color="#c9a24f"/><stop offset="1" stop-color="#e8c97f"/></linearGradient></defs><g fill="none" stroke="url(#g)" stroke-linejoin="round"><rect x="26" y="26" width="281" height="388" rx="3" stroke-width="1.6"/><rect x="33" y="33" width="267" height="374" rx="2" stroke-width=".7"/><g transform="translate(106 140) scale(3.6)" stroke-width="1.1"><path d="M6 8.5c4.2-2.1 8-.8 10 1.1 2-1.9 5.8-3.2 10-1.1v15c-4.2-2.1-8-.8-10 1.1-2-1.9-5.8-3.2-10-1.1v-15Z"/><path d="M16 9.7v14.9"/></g><path d="M118 300h91" stroke-width=".9"/><path d="M163.5 292l6 8-6 8-6-8z" stroke-width=".9"/></g><path d="M16 0v440" stroke="#0c1032" stroke-opacity=".55" stroke-width="2"/></svg>';
function cvF(f,ox){
 var st=f.style,z=CW+"px "+CH+"px";
 st.backgroundImage='linear-gradient(105deg,transparent 40%,rgba(255,236,190,.36) 50%,transparent 60%),url("data:image/svg+xml,'+encodeURIComponent(EMB)+'"),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(0deg,rgba(0,0,0,.08) 1px,transparent 1px),linear-gradient(90deg,#131a46,#1d2658 10%,#232d66 55%,#1b2354)';
 st.backgroundSize=(CW*2.4)+"px 100%,"+z+",3px 100%,100% 3px,"+z;
 st.backgroundRepeat="no-repeat,no-repeat,repeat-x,repeat-y,no-repeat";
 st.backgroundPosition="calc(var(--sx,-700px) + "+ox+"px) 0,"+ox+"px 0,"+ox+"px 0,0 "+ox+"px,"+ox+"px 0"}
function cvB(f,ox){var st=f.style,z=(CW-6)+"px "+(CH-12)+"px",p=(ox+6)+"px 6px";st.backgroundImage="linear-gradient(to left,rgba(70,52,36,.3),rgba(70,52,36,0) 15%),linear-gradient(135deg,#ebe4cf,#e1d9c0)";st.backgroundSize=z+","+z;st.backgroundPosition=p+","+p;st.backgroundRepeat="no-repeat";st.backgroundColor="#1b2354"}
/* ---------- build ---------- */
function build(){
 sty=d.createElement("style");sty.textContent=STYLE;d.head.appendChild(sty);
 ov=el("sqi"+(dark?" sqd":""));ov.setAttribute("role","status");ov.setAttribute("aria-label","Opening Squashberry Library");
 d.body.appendChild(ov);
 if(FULL){
  var st=el("sqs",ov);bk=el("sqb",st);
  FL=el("fl",bk,"left:"+-(W+34)+"px;top:"+-(H/2+26)+"px;width:"+(2*W+68)+"px;height:"+(H+52)+"px");
  el("bd",bk,"left:0;top:"+(-CH/2)+"px;width:"+CW+"px;height:"+CH+"px;transform:translateZ(1.2px)");
  SPN=el("spn",bk,"left:0;top:"+(-CH/2)+"px;width:31px;height:"+CH+"px");
  FR=el("ed",bk,"left:0;top:"+H/2+"px;width:"+W+"px;height:"+T0+"px");
  FLt=el("ed",bk,"left:"+-W+"px;top:"+H/2+"px;width:"+W+"px;height:"+T0+"px");
  FLl=el("ed v",bk,"left:"+-W+"px;top:"+-H/2+"px;width:"+T0+"px;height:"+H+"px");
  PR=el("pg r",bk,"left:0;top:"+-H/2+"px");
  if(!lite){TA=el("tx a",PR);TA.innerHTML=RH;TA.style.visibility="hidden"}
  TB=el("tx b rr",PR);TB.innerHTML=RH;KW=TB.querySelector(".kw");
  PL=el("pg l",bk,"left:"+-W+"px;top:"+-H/2+"px");var tl=el("tx lt",PL);tl.innerHTML=LH;PL.tx=tl;
  CR=el("cs",bk,"left:0;top:"+-H/2+"px;display:none");CL=el("cs",bk,"left:"+-W+"px;top:"+-H/2+"px;display:none");
  tx1=tex(7,31,295);tx2=tex(19,25,289);
  for(var i=0;i<N;i++){(function(i){
   lv.push(mkLeaf(W,H,function(f,ox){pgBg(f,ox,tx1,"r")},function(b,ox){
    if(i==N-1){pgBg(b,ox,null,"l");var t=el("tx lt",b,"left:"+ox+"px");t.innerHTML=LH}else pgBg(b,ox,tx2,"l")}))})(i)}
  cv=mkLeaf(CW,CH,cvF,cvB);
 }
 BR=el("br",ov);el("bgl",BR);
 WM=el("wm",BR);WM.textContent="Squashberry";WM.setAttribute("data-t","Squashberry");el("g",WM);
 LB=el("lb",BR);LB.textContent="Library";
 V=null;
 if(FULL){V=el("sqv");ov.insertBefore(V,BR)}
}
/* ---------- layout & measurement ---------- */
function layout(){
 VW=window.innerWidth||d.documentElement.clientWidth;VH=window.innerHeight||d.documentElement.clientHeight;
 if(!FULL){FS=Math.max(40,Math.min(VW*.13,100))}
 else{
  Zc=Math.min(VW*.62/CW,VH*.6/(.59*CH+30));Zs=Math.min(Zc,VW*.84/(2*CW));Z0=Zc*.8;
  var kwW=KW.offsetWidth||58;KX=KW.offsetLeft+kwW/2;KY=KW.offsetTop+KW.offsetHeight/2;WX=KX;WY=-H/2+KY;
  kwFS=parseFloat(getComputedStyle(KW).fontSize)||10;
  LZ3=Math.log(Math.min(Math.max(VW*.62,250),600)/kwW/(Zs*2.2));
  var t0=T;render(TH);var r=KW.getBoundingClientRect();FS=kwFS*(r.width/kwW);T=t0;
 }
 WM.style.fontSize=FS+"px";LB.style.fontSize=(FS*.19)+"px";
 if(FULL){var t1=T;render(TH);var a=KW.getBoundingClientRect(),c=WM.getBoundingClientRect();WM.style.setProperty("--mt",(a.top-c.top)+"px");WM.style.setProperty("--mb",(c.bottom-a.bottom)+"px");T=t1}
 render(T);
}
/* ---------- the timeline ---------- */
function bend(L,phi,b){
 if(L.ph===phi&&L.bt===b)return;L.ph=phi;L.bt=b;
 for(var j=0;j<K;j++){var S=L.S[j];if(j)S.s.style.transform="rotateY("+b+"deg)";var sh=.34*Math.pow(Math.abs(Math.sin((phi-j*b)*Math.PI/180)),1.15);S.f.style.opacity=sh;S.b.style.opacity=sh}}
function brand(t){
 var bo=FULL?sg(t,7.5,7.58):sg(t,7.8,8.4),u=io(sg(t,8.05,8.8)),lift=.2*io(sg(t,8.35,9.25)),lbp=io(sg(t,8.55,9.3)),w=WM.style;
 BR.style.opacity=bo;BR.firstChild.style.opacity=io(sg(t,8,9));
 w.setProperty("--u",u);w.setProperty("--hl",1);w.setProperty("--gl",(FULL?io(sg(t,7.2,7.9)):.6*io(sg(t,7.9,8.4)))*(1-.4*io(sg(t,8.4,9.2))));
 w.transform="translate(-50%,-50%) translateY("+(-lift*FS)+"px)";
 if(!RM){var sw=lp(130,-40,io(sg(t,8.6,9.4)));WM.style.setProperty("--sw",sw+"%")}
 w.color=dark?"rgb("+Math.round(lp(26,241,io(sg(t,7.8,8.6))))+","+Math.round(lp(28,243,io(sg(t,7.8,8.6))))+","+Math.round(lp(51,255,io(sg(t,7.8,8.6))))+")":"";
 LB.style.opacity=lbp;LB.style.letterSpacing=lp(.7,.34,lbp)+"em";LB.style.transform="translate(-50%,-50%) translateY("+(FS*(1.0-.03*lbp))+"px)";
 if(t>TOT-.6&&!ov.classList.contains("out"))ov.classList.add("out")}
function render(t){
 if(!FULL){brand(t);return}
 var i,pe=[],f=0,L,op=io(sg(t,1.1,2.65));
 for(i=0;i<N;i++){pe[i]=io(sg(t,LF[i][0],LF[i][0]+LF[i][1]));f+=pe[i]}
 f=f/N*.45;var Tr=T0*(1-f),Tl=T0*f,zR=3+Tr,zL=3+Tl;
 var Z=Math.exp(Math.log(Z0)+.2231*io(sg(t,0,3))+Math.log(Zs/Zc)*op+Math.log(2.2)*io(sg(t,3.5,6))+LZ3*io(sg(t,5.5,7.5)));
 var fo=io(sg(t,4.5,7.5)),px=lp(lp(W/2,0,op),WX,fo),py=lp(0,WY,fo),ra=io(sg(t,0,2.6)),rb=io(sg(t,4,6.2)),
 fx=54-8*ra-46*rb,fz=-7+4*ra+3*rb,dy=(1-io(sg(t,0,1.3)))*26;
 bk.style.transform="translate3d(0,"+dy+"px,0) scale3d("+Z+","+Z+","+Z+") rotateX("+fx+"deg) rotateZ("+fz+"deg) translate3d("+-px+"px,"+-py+"px,0)";
 FL.style.transform="translateZ(-1px) translateX("+lp(W/2,0,op)+"px) scaleX("+lp(.56,1,op)+")";
 SPN.style.transform="translateZ(1.2px) rotateY(-90deg) scaleX("+(32/31)+")";SPN.style.opacity=op<.5?1:0;
 if(t<2.8)bk.style.setProperty("--sx",lp(-540,160,io(sg(t,.35,1.6)))+"px");
 var k1=Math.max(.001,Tr/T0),k2=Math.max(.001,Tl/T0);
 FR.style.transform="translateZ(3px) rotateX(90deg) scaleY("+k1+")";FLt.style.transform="translateZ(3px) rotateX(90deg) scaleY("+k2+")";FLl.style.transform="translateZ(3px) rotateY(-90deg) scaleX("+k2+")";
 var tR=0;while(tR<N&&pe[tR]>=.9999)tR++;var tL=tR-1,best=-1,bd=9;
 for(i=0;i<N;i++){L=lv[i];var fl=pe[i]>0&&pe[i]<1,show=(fl||i==tR||i==tL)&&!(i==N-1&&pe[i]>=1);
  if(show!==L.sh){L.r.style.display=show?"":"none";L.sh=show}
  if(show){L.r.style.transform="translateZ("+lp(zR+(N-i)*.7,zL+(i+1)*.7,pe[i])+"px) rotateY("+-180*pe[i]+"deg)";bend(L,180*pe[i],fl?(i>=N-2?9.5:8)*6/K*Math.sin(Math.PI*pe[i]):0)}
  if(fl&&Math.abs(pe[i]-.5)<bd){bd=Math.abs(pe[i]-.5);best=i}}
 var landed=pe[N-1]>=1;PL.style.display=landed?"":"none";PL.style.transform="translateZ("+(zL+N*.7+.02)+"px)";PR.style.transform="translateZ("+(zR+.05)+"px)";
 cv.r.style.transform="translateZ("+lp(zR+N*.7+1.5,1.8,op)+"px) rotateY("+-180*op+"deg)";bend(cv,180*op,6*6/K*Math.sin(Math.PI*op));
 if(best>=0){var ph=pe[best]*Math.PI,ct=Math.cos(ph),a=Math.sin(ph)*.4,x=Math.abs(W*ct),c="rgba(24,16,30,",
  g="linear-gradient(to "+(ct>0?"right":"left")+","+c+a+") 0,"+c+a*.6+") "+x*.8+"px,"+c+"0) "+(x+16)+"px)";
  CR.style.display=ct>0?"":"none";CL.style.display=ct>0?"none":"";(ct>0?CR:CL).style.background=g;
  CR.style.transform="translateZ("+(zR+N*.7+.3)+"px)";CL.style.transform="translateZ("+(zL+N*.7+.3)+"px)"}
 else{CR.style.display="none";CL.style.display="none"}
 /* depth of field */
 var bl=3.4*io(sg(t,4.1,6)),Rs=VW*lp(1.05,.62,io(sg(t,4.2,7))),rx=Rs/Z,m;
 if(!lite){
  TA.style.visibility=bl>.02?"visible":"hidden";TA.style.filter=bl>.02?"blur("+bl/Z+"px)":"";
  PL.tx.style.filter=bl>.02?"blur("+bl/Z+"px)":"";
  m=bl>.02?"radial-gradient(ellipse "+rx+"px "+rx*.52+"px at "+KX+"px "+KY+"px,#000 0,#000 55%,rgba(0,0,0,0) 100%)":"none";
  TB.style.webkitMaskImage=m;TB.style.maskImage=m;
 }else TB.style.color="rgba(42,45,68,"+lp(1,.34,io(sg(t,4.4,6.4)))+")";
 var s=KW.style;s.setProperty("--hl",io(sg(t,6.9,7.5)));s.setProperty("--gl",io(sg(t,7.2,7.9))*(1-.4*io(sg(t,8.4,9.2))));
 V.style.opacity=Math.max(1-io(sg(t,0,1.2)),io(sg(t,7.72,8.5)));
 bk.style.display=t>8.6?"none":"";
 brand(t)}
/* ---------- loop & lifecycle ---------- */
function releaseBoot(){
 var boot=d.getElementById("splashBoot");
 d.documentElement.classList.remove("splash-lock");
 if(d.body)d.body.classList.remove("splash-lock");
 if(boot){boot.classList.add("is-leaving");setTimeout(function(){try{boot.remove()}catch(e){}},650)}
}
function showFallback(){
 if(done)return;
 done=true;cancelAnimationFrame(raf);window.removeEventListener("resize",onRs);
 try{ov&&ov.remove();sty&&sty.remove()}catch(e){}
 var boot=d.getElementById("splashBoot");
 if(boot){
  boot.classList.add("fallback");
  var status=boot.querySelector("[data-splash-status]");
  if(status)status.textContent="Welcome to your Library";
  setTimeout(releaseBoot,2800);
 }else releaseBoot();
}
function tick(ts){
 if(done)return;
 var dt=last?Math.min((ts-last)/1000,.05):.016;last=ts;
 T+=dt;
 try{render(T)}catch(e){console.warn("Intro stopped; using the branded fallback.",e);showFallback();return}
 if(T>=TOT){end();return}
 raf=requestAnimationFrame(tick)}
function end(){
 if(done)return;done=true;cancelAnimationFrame(raf);window.removeEventListener("resize",onRs);
 if(ov){ov.classList.add("out");setTimeout(function(){try{ov.remove();sty.remove()}catch(e){}releaseBoot()},700)}
 else releaseBoot();
}
function onRs(){try{layout()}catch(e){console.warn("Intro resize failed; using the branded fallback.",e);showFallback()}}
try{
 build();layout();
 window.addEventListener("resize",onRs);
 raf=requestAnimationFrame(tick);
}catch(e){console.warn("Intro unavailable; using the branded fallback.",e);showFallback()}
})();