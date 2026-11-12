/* Marilyn Benavente · Panel inmobiliario · v41 (nube + TikTok en vivo) */
'use strict';
const CF=window.PANEL_CFG||{};
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const D={'Cercado':[-16.399,-71.537,26],'Yanahuara':[-16.388,-71.546,22],'Cayma':[-16.372,-71.540,34],'Cerro Colorado':[-16.372,-71.578,52],'Sachaca':[-16.426,-71.570,34],'J.L. Bustamante':[-16.425,-71.523,28],'Miraflores':[-16.390,-71.517,24],'A. Selva Alegre':[-16.380,-71.508,28],'Mariano Melgar':[-16.410,-71.500,28],'Paucarpata':[-16.430,-71.495,34],'Socabaya':[-16.458,-71.535,34],'Jacobo Hunter':[-16.446,-71.546,22],'Tiabaya':[-16.440,-71.585,30],'Characato':[-16.470,-71.488,30],'Sabandía':[-16.457,-71.490,24]};
const LS={g:(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?d:v}catch(e){return d}},s:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}};
let thb=LS.g('mb_thb',{}),arch=(a=>Array.isArray(a)?a:[])(LS.g('mb_arch',[])),data=(a=>Array.isArray(a)?a:[])(LS.g('mb_props',[])),kwB=(a=>Array.isArray(a)?a:[])(LS.g('mb_brand',[])),sel=null,flt='todas';
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),
age=p=>{const d=p.fbd||p.last;return d?Math.floor((Date.now()-new Date(d+'T00:00:00'))/864e5):Infinity},
DUE=7,fbOn=p=>!!(p.fb||p.fbu),due=p=>fbOn(p)&&age(p)>=DUE,ak=p=>{const a=age(p);return a==Infinity?-1:a},
money=p=>p.pr?(p.mon=='USD'?'US$ ':'S/ ')+Number(p.pr).toLocaleString('es-PE')+(p.op=='alquiler'?' /mes':''):'Precio a consultar',
feat=p=>[p.m2?p.m2+' m²':'',p.hab!=null?p.hab+' dorm':'',p.ban!=null?p.ban+' baños':'',p.coch?p.coch+' coch.':''].filter(Boolean).join(' · ')||'Sin detalles',
hs=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h},
flash=m=>{const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(flash.t);flash.t=setTimeout(()=>t.hidden=true,3800)};
const norm=t=>String(t??'').normalize('NFKC').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim(),tok=t=>norm(t).split(/[^a-z0-9]+/).filter(w=>w.length>2);
let srt='';const SO={pr:(a,b)=>(+b.pr||0)-(+a.pr||0),d:(a,b)=>String(a.dist).localeCompare(String(b.dist))};
const vis=()=>{const q=norm($('#q').value);return [...data].sort(SO[srt]||(()=>0)).filter(p=>(flt=='todas'||flt==p.op||(flt=='rep'&&due(p)))&&(!q||norm(p.t+' '+(p.t2||'')+' '+p.dist+' '+(p.ref||'')+' '+(p.desc||'')).includes(q)))};
function pos(p){if(p.lat!=null&&p.lng!=null&&isFinite(p.lat)&&isFinite(p.lng))return[+p.lat,+p.lng];const d=D[p.dist]||D.Cercado,h=hs(p.id),a=h%360*Math.PI/180,r=(h>>>9)%100/100*.006;return[d[0]+Math.sin(a)*r,d[1]+Math.cos(a)*r]}

/* ================= NUBE: datos compartidos, edición solo con tu usuario ================= */
const sb=(CF.url&&CF.key&&window.supabase)?window.supabase.createClient(CF.url,CF.key,{auth:{persistSession:true,autoRefreshToken:true,storageKey:'mb_auth'}}):null;
let OWN=!sb,cloudReady=!sb,saving=0;
const COL={prop:()=>data,arch:()=>arch,tt:()=>kwB},IDF={prop:p=>String(p.id||''),arch:p=>String(p.id||''),tt:r=>ttKey(r)};
let synced={prop:new Map(),arch:new Map(),tt:new Map()};const dirty=new Set();let flT=0;
function cacheW(){if(!LS.s('mb_props',data)&&!sb)flash('No se pudo guardar en este navegador');LS.s('mb_arch',arch);LS.s('mb_brand',kwB)}
function persist(c){cacheW();if(!sb||!OWN||!cloudReady)return;dirty.add(c);clearTimeout(flT);flT=setTimeout(flush,450)}
async function flush(){const cs=[...dirty];dirty.clear();saving++;setLive();
 for(const c of cs){const cur=new Map();COL[c]().forEach(x=>{const id=IDF[c](x);if(id)cur.set(id,JSON.stringify(x))});
  const up=[],del=[],now=new Date().toISOString();cur.forEach((j,id)=>{if(synced[c].get(id)!==j)up.push({col:c,id,doc:JSON.parse(j),updated_at:now})});synced[c].forEach((_,id)=>{if(!cur.has(id))del.push(id)});
  try{for(let i=0;i<up.length;i+=60){const{error}=await sb.from('panel_items').upsert(up.slice(i,i+60));if(error)throw error}
   for(let i=0;i<del.length;i+=100){const{error}=await sb.from('panel_items').delete().eq('col',c).in('id',del.slice(i,i+100));if(error)throw error}
   synced[c]=cur}
  catch(e){dirty.add(c);flash('No se pudo guardar en la nube ('+(e.message||e.code||'sin conexión')+'). Lo reintento solo.');clearTimeout(flT);flT=setTimeout(flush,8000)}}
 saving--;setLive()}
const sk=p=>{const id=String(p.id);if(id.startsWith('ei_'))return[2,-(+id.slice(3)||0)];const m=id.match(/^p([0-9a-z]+)$/);return[id.startsWith('m_')?1:0,m?parseInt(m[1],36):0]};
const byK=(a,b)=>{const x=sk(a),y=sk(b);return x[0]-y[0]||x[1]-y[1]};
async function cloudLoad(){const all=[];for(let f=0;;f+=1000){const{data:r,error}=await sb.from('panel_items').select('col,id,doc').range(f,f+999);if(error)throw error;all.push(...r);if(r.length<1000)break}
 const g={prop:[],arch:[],tt:[]};all.forEach(r=>{if(g[r.col]&&r.doc)g[r.col].push(r.doc)});g.prop.sort(byK);
 const s={};for(const c in g)s[c]=new Map(g[c].map(x=>[IDF[c](x),JSON.stringify(x)]));return{g,s}}
let rlT=0;function schedReload(){clearTimeout(rlT);rlT=setTimeout(async()=>{if(saving||dirty.size){schedReload();return}try{const{g,s}=await cloudLoad();
 const ch=JSON.stringify([g.prop,g.arch,g.tt])!==JSON.stringify([[...synced.prop.values()].map(j=>JSON.parse(j)),[...synced.arch.values()].map(j=>JSON.parse(j)),[...synced.tt.values()].map(j=>JSON.parse(j))]);
 if(!ch)return;synced=s;data=g.prop;arch=g.arch;kwB=g.tt;if(sisRows)applySis(sisRows,0,1);cacheW();$('#brd').__sg='';draw()}catch(e){}},700)}
let liveState='',sisOk=null;
function setLive(){const e=$('#live');if(!e)return;let t,bad=0;
 if(saving)t='Guardando en la nube…';else if(sb&&!cloudReady)t='Conectando…';else if(sb&&liveState=='off'){t='Sin conexión · mostrando lo último guardado';bad=1}
 else if(sb)t='En vivo'+(sisOk===false?' · sistema EI sin conexión':sisOk?' · sistema '+sisOk:'');else t='Guardado en este navegador';
 e.className='live'+(bad?' bad':'');e.innerHTML='<i></i>'+esc(t)}
function setOwner(v){v=!!v;if(OWN===v&&document.body.classList.contains('is-owner')===v)return;OWN=v;document.body.classList.toggle('is-owner',v);document.body.classList.toggle('ro',!v);
 const a=$('#acc');if(a){a.querySelector('span').textContent=v?(sb?'Salir':'Edición local'):'Ingresar';a.title=v?'Cerrar sesión de edición':'Ingresar con tu usuario para editar';a.hidden=!sb}const a2=$('#acc2');if(a2){a2.textContent=v?'Salir':'Ingresar';a2.hidden=!sb}
 $('#brd').__sg='';draw();if(v){ttMaybeLoadThumbs();ttFinish()}}
/* bloqueo de seguridad en solo lectura (además de ocultar los botones) */
const BLOCK='[data-arch],[data-edit],[data-a="edit"],[data-a="del"],[data-a="foto"],[data-a="nofoto"],[data-a="today"],[data-ch],[data-rn],[data-pub],[data-badd],[data-bdel],[data-tsave],[data-rest],[data-delx],[data-est],[data-bi],[data-notif],[data-sync],[data-ttc],[data-ttr],#arc,#sy,#add,#im,#ex';
['click','submit','paste','drop'].forEach(ev=>document.addEventListener(ev,e=>{if(OWN)return;const t=e.target;if(t&&t.closest&&t.closest(BLOCK)){e.preventDefault();e.stopImmediatePropagation()}},true));

/* ================= unir repetidas (Sistema + manual) ================= */
const ddEi=p=>String(p.id).startsWith('ei_'),ddId=u=>(String(u||'').match(/\d{8,}/)||[''])[0],
ddStop=new Set(['departamento','dpto','depa','casa','terreno','local','oficina','alquiler','venta','alquilo','vendo','arequipa','para','con','por','los','las','del','una','uno','muy','cerca','ubicado','ubicada','zona','avenida','calle','estreno']),
ddTk=p=>new Set(tok((p.t||'')+' '+(p.t2||'')+' '+(p.ref||'')).filter(w=>!ddStop.has(w))),ddKey=p=>norm(p.desc||'').replace(/[^a-z0-9]+/g,'').slice(0,60),
ddN=(x,y,pw,nw,tol)=>{x=+x||0;y=+y||0;return x&&y?(Math.abs(x-y)<=Math.max(x,y)*tol?pw:nw):0},ddI=(x,y)=>x==null||y==null||x===''||y===''?0:(+x==+y?1:-1),ddEmp=v=>v==null||v===''||v===0||v===false;
function ddScore(a,b){const ea=ddEi(a),eb=ddEi(b);if(ea&&eb)return 0;if(a.op!=b.op)return 0;let same=0;
 const x=ddId(a.fbu),y=ddId(b.fbu);if(x&&y){if(x==y)same=1;else return 0}if(same)return 99;if(ea==eb)return 0;
 let tx=0;const da=ddKey(a);if(da.length>=30&&da==ddKey(b))tx+=3;const A=ddTk(a),B=ddTk(b);let sh=0;A.forEach(w=>{if(B.has(w))sh++});tx+=sh>=3?3:sh==2?1:0;if(!tx)return 0;
 const s=tx+ddN(a.pr,b.pr,3,-2,.005)+ddN(a.m2,b.m2,3,-2,.03)+ddI(a.hab,b.hab)+ddI(a.ban,b.ban)+ddI(a.coch,b.coch);return s>=6?s:0}
function ddMerge(e,m){const o={...e};for(const k in m){if(k!='id'&&ddEmp(o[k]))o[k]=m[k]}for(const k of['grp','leads'])if(e[k]||m[k])o[k]=Math.max(+e[k]||0,+m[k]||0);
 if((m.last||'')>(e.last||''))o.last=m.last;if((m.fbd||'')>(e.fbd||''))o.fbd=m.fbd;if(ddEmp(e.pr)&&m.pr)o.mon=m.mon||o.mon;if(e.dist==='Cercado'&&m.dist&&m.dist!=='Cercado')o.dist=m.dist;
 o.sis=!!(e.sis||m.sis);o.fb=!!(e.fb||m.fb||o.fbu);if(m.t&&m.t!==e.t&&!e.t2)o.t2=m.t;return o}
function dedupe(arr){let a=arr.slice(),k=0;for(;;){let best=null,bs=0;for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++){const s=ddScore(a[i],a[j]);if(s>bs){bs=s;best=[i,j]}}
 if(!best)break;let[i,j]=best,x=a[i],y=a[j];if(!ddEi(x)&&ddEi(y)){const t=x;x=y;y=t}if(sel==y.id)sel=x.id;a[i]=ddMerge(x,y);a.splice(j,1);k++}return k?a:arr}
function ddv(q){const n=data.length;data=dedupe(data);const k=n-data.length;if(k>0&&!q&&OWN)flash('Se unieron '+k+(k>1?' propiedades repetidas':' propiedad repetida')+' (Sistema + manual)');return k>0}
const sv=()=>{ddv();persist('prop')},svA=()=>persist('arch'),ttSave=()=>persist('tt');
async function put(id,o,full){const i=data.findIndex(x=>x.id==id);if(i<0)data.push({id,...o});else data[i]=full?{id,...o}:{...data[i],...o};sv();draw()}
async function X(id){if(sel==id)sel=null;data=data.filter(x=>x.id!=id);sv();draw()}

/* ================= íconos ================= */
const svgi=d=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+d+'</svg>',
kwDS={a:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h6V4"/>',b:'<path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.5"/>',w:'<path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3zM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2"/>',k:'<path d="M5 16l1.5-5A2 2 0 0 1 8.4 9.6h7.2a2 2 0 0 1 1.9 1.4L19 16M4 16h16v3H4zM7 19v1.5M17 19v1.5"/>',q:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'},
kwds=k=>'<svg class="ds" viewBox="0 0 24 24" aria-hidden="true">'+kwDS[k]+'</svg>',
kwdsp=p=>[['a',p.m2?p.m2+' m²':'','Área'],['b',p.hab,'Dormitorios'],['w',p.ban,'Baños'],['k',p.coch,'Cocheras']].filter(x=>x[1]).map(x=>'<span title="'+x[2]+'">'+kwds(x[0])+x[1]+'</span>').join('')||'<span class="mut">Sin detalles</span>',
TI={eye:svgi('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),heart:svgi('<path d="M12 20s-7.5-4.6-9-9.5C2 7 4.5 4.5 7.5 4.5c1.9 0 3.3 1 4.5 2.6 1.2-1.6 2.6-2.6 4.5-2.6 3 0 5.5 2.5 4.5 6C19.5 15.4 12 20 12 20z"/>'),chat:svgi('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'),share:svgi('<path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6M12 15V3M7.5 7.5 12 3l4.5 4.5"/>'),save:svgi('<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/>'),bolt:svgi('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),ext:svgi('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),trash:svgi('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3"/>'),search:svgi('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),photo:svgi('<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="m21 16-5-5-8 8"/>'),play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/></svg>',copy:svgi('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>'),vid:svgi('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z"/>'),users:svgi('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>'),sync:svgi('<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4"/>'),link:svgi('<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>')},
SVG={h:'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3 2 12h3v8h5v-5h4v5h5v-8h3z"/></svg>',d:'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M5 21V5l9-2v6l5 1v11z"/><path fill="#fff" d="M8 8h2v2H8zm0 4h2v2H8zm0 4h2v2H8zm5-4h2v2h-2zm0 4h2v2h-2z"/></svg>',t:'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M2 19 8.5 7l4 6 2.5-3.5L22 19z"/></svg>',c:'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 9 5 4h14l2 5a3 3 0 0 1-5.5 1.7 3 3 0 0 1-5 0A3 3 0 0 1 3 9zm2 5.5h14V20H5z"/></svg>'};
function kind(p){const t=norm(p.t+' '+(p.tipo||''));return /terreno|lote/.test(t)?'t':/local|oficina|almac|consult|hotel|comercial/.test(t)?'c':/depart|dpto|penthouse/.test(t)?'d':'h'}
function ico(p){return{t:'🌄',c:'🏬',d:'🏢',h:'🏠'}[kind(p)]}
const opx=p=>p.opx||(p.op=='venta'?'Venta':'Alquiler');

/* ================= KPIs ================= */
const kv={};
function kp(){const T=data.length,V=data.filter(p=>p.op=='venta').length,A=T-V,n=data.filter(due).length,pc=x=>T?Math.round(x/T*100):0;
 const C=[{k:'todas',n:T,t:'Propiedades',c:'#cfd6e2',s:`Sistema EI ${data.filter(p=>p.sis).length} · Marketplace ${data.filter(fbOn).length}`,b:100},
 {k:'venta',n:V,t:'En venta',c:'var(--sale)',b:pc(V),s:pc(V)+'% de la cartera'},
 {k:'alquiler',n:A,t:'En alquiler',c:'var(--rent)',b:pc(A),s:pc(A)+'% de la cartera'},
 {k:'rep',n,t:'Por republicar',c:n?'var(--acc2)':'var(--ok)',al:n&&OWN,s:n?'Renueva hoy en Marketplace':'Todo al día',b:n?100:0}];
 $('#kpis').innerHTML=C.map(c=>{const on=flt==c.k&&c.k!='todas';return `<button class="k2${on?' on':''}${c.al?' al':''}" style="--kc:${c.c}" data-kf="${c.k}" aria-pressed="${on}"><span class="k2n" data-k="${c.k}" data-to="${c.n}">${c.n}</span><span class="k2t">${c.t}</span><span class="k2s">${esc(c.s)}</span><span class="k2b"><i style="width:${c.b}%"></i></span></button>`}).join('');
 document.querySelectorAll('#kpis .k2n').forEach(el=>{const k=el.dataset.k,to=+el.dataset.to,from=kv[k]??0;kv[k]=to;if(from==to)return;el.textContent=from;const t0=performance.now(),st=t=>{const x=Math.min(1,(t-t0)/600);el.textContent=Math.round(from+(to-from)*(1-Math.pow(1-x,3)));if(x<1)requestAnimationFrame(st)};requestAnimationFrame(st)})}
$('#kpis').onclick=e=>{const b=e.target.closest('[data-kf]');if(!b)return;let k=b.dataset.kf;
 if(k=='rep'){kwMkF=data.some(due)?'due':'todos';kwView('mk');if(!data.some(due))flash('Todo al día: no hay anuncios por renovar');return}
 const nm={todas:'todas las propiedades',venta:'propiedades en venta',alquiler:'propiedades en alquiler'};
 if(flt==k&&k!='todas')k='todas';flt=k;kp();fchips();lazyList();drawMap();flash(k=='todas'?'Mostrando todas las propiedades':'Mostrando '+nm[k]+' · toca la tarjeta otra vez para quitar el filtro')};

/* ================= cajón (lista dentro del resumen) ================= */
const bg=a=>`<div class="big">${a.map(([l,v,c,w])=>`<div style="--c:var(${c||'--ink'})${w?';grid-column:span 2':''}"><b>${v}</b><small>${l}</small></div>`).join('')}</div>`;
let pnQ='';
function panel(){const g=$('.grid[data-vw="res"]');if(!g.classList.contains('dr')){panel.st=1;return}panel.st=0;const P=data.find(p=>p.id==sel);
 let h=(P?`<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px"><div style="display:flex;gap:10px;align-items:center;min-width:0">${thHtml(P,1)}<div style="min-width:0"><b>${esc(P.t)}</b><br><span class="mut" style="font-size:12px">${esc(P.dist)}${P.ref?' · '+esc(P.ref):''}</span></div></div><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end"><button class="btn own" data-arch="${esc(P.id)}">Ya no disponible</button><button class="btn" data-clear>Ver todas ✕</button></div></div>`+bg([['Operación',P.op=='venta'?'Venta':'Alquiler',P.op=='venta'?'--sale':'--rent'],['Precio',money(P),'--ink',1],['Área',P.m2?P.m2+' m²':'–'],['Dormitorios',P.hab??'–'],['Baños',P.ban??'–'],['Cocheras',P.coch??'–'],['Ubicación',P.lat!=null?'Exacta':'Aproximada']]):'');
 h+=`<label class="dsr">${kwds('q')}<input id="dq" type="search" placeholder="Buscar propiedad o distrito" autocomplete="off" aria-label="Buscar propiedad" value="${esc(pnQ)}"><em id="dn">${data.length}</em></label><div class="dl">`+data.map(p=>`<button class="di ${p.op=='venta'?'v':'a'} ${p.id==sel?'on':''}" data-go="${esc(p.id)}" data-s="${esc(p.t+' '+p.dist)}"><span class="dic">${SVG[kind(p)]}</span><span class="dm"><b>${esc(p.t)}</b><small>${esc(p.dist)} · ${money(p)}</small></span><span class="dop">${esc(opx(p))}</span><span class="fts">${kwdsp(p)}</span></button>`).join('')+'</div><p class="mut dne" hidden>Sin resultados para tu búsqueda.</p>';
 $('#pn').innerHTML=h;pnRun()}
function pnRun(){const t=norm(pnQ),A=$('#pn').querySelectorAll('.di');let n=0;A.forEach(b=>{const m=!t||norm(b.dataset.s).includes(t);b.hidden=!m;m&&n++});const c=$('#dn');if(c)c.textContent=t?n+'/'+A.length:A.length;const e=$('#pn .dne');if(e)e.hidden=n>0}
$('#pn').addEventListener('input',e=>{if(e.target.id=='dq'){pnQ=e.target.value;pnRun()}});
$('#pn').onclick=e=>{if(e.target.closest('[data-clear]')){setSel(null);return}const b=e.target.closest('[data-go]');b&&go(b.dataset.go,1)};
{const g=$('.grid[data-vw="res"]'),lst=$('#lst'),set=o=>{g.classList.toggle('dr',o);lst.setAttribute('aria-pressed',o?'true':'false');if(o&&panel.st!==0)panel()};
 lst.onclick=()=>set(!g.classList.contains('dr'));$('#dcl').onclick=()=>set(false);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('.mdl:not([hidden]),.ttp:not([hidden])'))set(false)})}

/* ================= tarjetas de propiedades ================= */
function ftc(p){return[['📐',p.m2?p.m2+' m²':''],['🛏️',p.hab],['🛁',p.ban],['🚗',p.coch]].filter(([,v])=>v).map(([i,v])=>`<span class="ft">${i} ${v}</span>`).join('')||'<span class="mut" style="font-size:12px">Sin detalles</span>'}
function cover(p){const u=imgU(p);return `<div class="cvr ${p.op=='venta'?'v':'a'}"><span class="ci">${ico(p)}</span>${u?`<img src="${esc(u)}" referrerpolicy="no-referrer" loading="lazy" decoding="async" alt="" onerror="this.remove()">`:''}<span class="tg">${esc(opx(p))}</span><span class="pp">${money(p)}</span></div>`}
function cdi(p){const a=age(p);if(a==Infinity)return{n:'–',pc:0,k:'var(--mut)',t:'Sin fecha'};return{n:a,pc:Math.min(100,a/DUE*100),k:a>=DUE?'var(--late)':a>=5?'#f5b14c':'var(--ok)',t:a==DUE?'¡Renueva hoy!':a>DUE?'Retraso '+(a-DUE)+' d':'Faltan '+(DUE-a)+' d'}}
const mpBlock=p=>{if(!fbOn(p))return'';const c=cdi(p);return `<div class="cdp"><span class="rg s" style="--p:${c.pc};--k:${c.k}"><b>${c.n}</b></span><span><b style="color:${c.k}">${c.t}</b><br><small class="mut">Marketplace · día ${c.n} de ${DUE}</small></span></div>`};
function sp(p){if(!p.pr)return'Consultar';const n=+p.pr,u=p.mon=='USD',t=n>=1e6?(n/1e6).toFixed(2).replace(/\.?0+$/,'')+'M':n>=1e4?Math.round(n/1e3)+'k':n>=1e3&&n%100==0&&!u?n.toLocaleString('en-US'):n>=1e3?(n/1e3).toFixed(1).replace(/\.0$/,'')+'k':String(n);return(u?'$':'S/')+t}
function fchips(){$('#fl').innerHTML=[['todas','Todas'],['venta','Venta'],['alquiler','Alquiler'],['rep','Por republicar']].map(([k,l])=>`<button class="chip ${flt==k?'on':''}" data-f="${k}">${l}</button>`).join('')}
function card(p){const gm=p.lat!=null?p.lat+','+p.lng:encodeURIComponent((p.ref||'')+' '+p.dist+' Arequipa Peru'),
 ch=[['sis','🏢','Sistema EI'],['fb','📘','Facebook']].map(([k,i,l])=>`<button class="chip ico ${p[k]?'on':''}" data-ch="${k}" title="${l}: ${p[k]?'publicada':'sin publicar'}">${i}<small>${l}</small></button>`).join(''),
 ls=[['sisu','🏢','Abrir en Sistema EI'],['fbu','📘','Abrir en Marketplace']].filter(([k])=>p[k]).map(([k,i,t])=>`<a class="btn ib" title="${t}" href="${esc(p[k])}" target="_blank" rel="noopener">${i}</a>`).join('');
 return `<article class="pc ${p.op=='venta'?'v':'a'} ${p.id==sel?'sel':''}" data-id="${esc(p.id)}">${cover(p)}<div class="pb"><b class="tt">${esc(p.t)}</b><div class="mut loc">📍 ${esc(p.dist)}${p.ref?' · '+esc(p.ref):''}</div><div class="fts">${ftc(p)}</div>${p.desc?`<p class="ds">${esc(p.desc)}</p>`:''}${mpBlock(p)}<div class="chs">${ch}</div><div class="acts">${ls}<a class="btn ib" title="Ver en Google Maps" href="https://www.google.com/maps/search/?api=1&query=${gm}" target="_blank" rel="noopener">🗺️</a><button class="btn ib own" data-a="foto" title="${p.foto?'Cambiar foto':'Subir foto'}">📷</button>${p.foto?'<button class="btn ib own" data-a="nofoto" title="Quitar foto">🚫</button>':''}<button class="btn ib" data-a="copy" title="Copiar anuncio">📋</button>${fbOn(p)?'<button class="btn own" data-a="today" title="Marca que hoy renovaste el anuncio">🔄 Renové hoy</button>':''}<button class="btn ib own" data-a="edit" title="Editar">✏️</button><button class="btn own" data-arch="${esc(p.id)}" title="Alquilada, vendida o ya no la tengo: se oculta en todo el panel">📦 Ya no disponible</button><button class="btn ib own" data-a="del" title="Borrar">🗑️</button></div></div></article>`}
function list(){list.st=0;const v=vis();$('#list').innerHTML=v.length?v.map(card).join(''):`<p class="mut">${data.length?'Sin resultados.':'Aún no hay propiedades.'}</p>`}
function lazyList(){if(kwV=='prop')list();else list.st=1}
function info(){const p=data.find(x=>x.id==sel);$('#info').innerHTML=p?`<b>${esc(p.t)}</b> · ${esc(p.dist)}<br><span class="mut">${money(p)} · ${feat(p)}</span><br><button class="btn arq-mini own" data-edit="${esc(p.id)}">✏️ Editar</button> <button class="btn arq-mini own" data-arch="${esc(p.id)}">📦 Ya no disponible</button>`:'<span class="mut">Toca un punto del mapa o una tarjeta para ver la propiedad.</span>'}

/* ================= mapa ================= */
function pinIcon(p,o,x){return L.divIcon({className:'pmw',iconSize:[1,1],iconAnchor:[0,0],popupAnchor:[0,-46],tooltipAnchor:[0,-42],html:`<div class="pm ${p.op=='venta'?'v':'a'}${o?' sel':''}${x?' ap':''}"><i>${SVG[kind(p)]}</i><span class="t">${x?'≈':''}${esc(sp(p))}</span></div>`})}
function clIcon(c){const m=c.getAllChildMarkers(),v=m.filter(x=>x.options.op=='venta').length;return L.divIcon({className:'clw',iconSize:[46,46],html:`<div class="cl" style="--v:${Math.round(v/m.length*360)}deg"><b>${m.length}</b></div>`})}
const mp=L.map('map',{maxZoom:19,preferCanvas:false,zoomSnap:.5}).setView([-16.3989,-71.535],13),mk={},lay=L.markerClusterGroup({maxClusterRadius:52,showCoverageOnHover:false,spiderfyOnMaxZoom:true,disableClusteringAtZoom:17,iconCreateFunction:clIcon,chunkedLoading:true}).addTo(mp),
TL=[['https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',{attribution:'© Esri',maxNativeZoom:18}],['https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',{subdomains:'abc',attribution:'© OpenStreetMap'}],['https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}]],
sat=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'© Esri'});
let ti=0,te=0,tl=0,base,so=0;
const ms=(t,bad)=>{const e=$('#ms');e.textContent=t;e.style.color=bad?'var(--late)':''};
function setBase(){base&&mp.removeLayer(base);te=0;tl=0;const b=base=L.tileLayer(TL[ti][0],{maxZoom:19,keepBuffer:4,updateWhenIdle:true,...TL[ti][1]});b.on('tileload',()=>{if(!tl++)ms('Mapa cargado ✓')});
 b.on('tileerror',()=>{if(b!==base)return;if(++te>=4&&!tl){if(ti<TL.length-1){ti++;ms('Probando otro proveedor de mapa…');setBase()}else ms('No se descargan los mapas: revisa tu conexión a internet.',1)}});if(!so)b.addTo(mp)}
setBase();
const zc=()=>mp.getContainer().classList.toggle('lowz',mp.getZoom()<12);mp.on('zoomend',zc);zc();
$('#sw').onclick=()=>{so=!so;if(so){mp.removeLayer(base);sat.addTo(mp)}else{mp.removeLayer(sat);base.addTo(mp)}$('#sw').textContent=so?'Ver calles':'Ver satélite'};
let rzT=0;addEventListener('resize',()=>{clearTimeout(rzT);rzT=setTimeout(()=>mp.invalidateSize({pan:false}),120)});addEventListener('load',()=>mp.invalidateSize());
{const mbx=$('#map').closest('.box'),fs=$('#fs'),fix=()=>{[60,260].forEach(t=>setTimeout(()=>mp.invalidateSize({pan:false}),t))};
 mp.scrollWheelZoom.disable();mp.on('click',()=>mp.scrollWheelZoom.enable());$('#map').addEventListener('mouseleave',()=>{if(!mbx.classList.contains('mapfs'))mp.scrollWheelZoom.disable()});
 window.kwMapFs=on=>{const was=mbx.classList.contains('mapfs');if(on===was)return;mbx.classList.toggle('mapfs',on);document.body.classList.toggle('mapfs-on',on);fs.textContent=on?'Cerrar mapa grande':'Ampliar mapa';fs.setAttribute('aria-pressed',on?'true':'false');on?mp.scrollWheelZoom.enable():mp.scrollWheelZoom.disable();fix()};
 fs.onclick=()=>kwMapFs(!mbx.classList.contains('mapfs'));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&mbx.classList.contains('mapfs'))kwMapFs(false)})}
const pop=p=>{const u=imgU(p),gm=p.lat!=null?p.lat+','+p.lng:encodeURIComponent((p.ref||'')+' '+p.dist+' Arequipa Peru');return `<div class="pp2">${u?`<img src="${esc(u)}" referrerpolicy="no-referrer" alt="" onerror="this.remove()">`:''}<span class="pt ${p.op=='venta'?'v':'a'}">${esc(opx(p))}</span><b class="pn">${esc(p.t)}</b><div class="pm2">${money(p)}</div><div class="pl3">📍 ${esc(p.dist)}${p.lat==null?' (aprox.)':''}</div><div class="fts">${ftc(p)}</div><div class="pa"><a href="https://www.google.com/maps/dir/?api=1&destination=${gm}" target="_blank" rel="noopener">🧭 Cómo llegar</a>${[['sisu','🏢 Sistema EI'],['fbu','📘 Marketplace']].filter(([k])=>p[k]).map(([k,l])=>`<a href="${esc(p[k])}" target="_blank" rel="noopener">${l}</a>`).join('')}<a href="#" role="button" class="own" data-edit="${esc(p.id)}">✏️ Editar</a><a href="#" role="button" class="own" data-arch="${esc(p.id)}">📦 Ya no disponible</a></div></div>`};
function drawMap(force){const v=vis(),sg=JSON.stringify(v.map(p=>[p.id,p.lat,p.lng,p.pr,p.mon,p.op,p.opx,p.t,p.dist,p.ref,p.m2,p.hab,p.ban,p.coch,p.sisu,p.fbu,p.fs,p.foto?p.foto.length:0]));
 if(!force&&sg===drawMap.sg){selPins();return}drawMap.sg=sg;lay.clearLayers();for(const k in mk)delete mk[k];const b=[],ms2=[];
 v.forEach(p=>{const ll=pos(p),o=p.id==sel,x=p.lat==null;b.push(ll);const m=L.marker(ll,{icon:pinIcon(p,o,x),zIndexOffset:o?1000:0,op:p.op}).bindTooltip(esc(p.t)+' · '+money(p),{direction:'top'}).bindPopup(()=>pop(p),{maxWidth:260,minWidth:220,autoPanPadding:[24,24]}).on('click',()=>{setSel(p.id);const el=document.querySelector('.pc[data-id="'+CSS.escape(p.id)+'"]');el&&el.scrollIntoView({block:'nearest',behavior:'smooth'})});m._sel=o;mk[p.id]=m;ms2.push(m)});
 lay.addLayers(ms2);if(!drawMap.f&&b.length){mp.fitBounds(b,{padding:[30,30],maxZoom:16});drawMap.f=1}}
function selPins(){for(const id in mk){const m=mk[id],o=id==sel;if(m._sel!==o){const p=data.find(x=>x.id==id);if(p){m.setIcon(pinIcon(p,o,p.lat==null));m.setZIndexOffset(o?1000:0)}m._sel=o}}}
function setSel(id){sel=id;selPins();document.querySelectorAll('.pc.sel').forEach(e=>e.classList.remove('sel'));if(id){const c=document.querySelector('.pc[data-id="'+CSS.escape(id)+'"]');c&&c.classList.add('sel')}info();panel()}
function go(id,ns){const p=data.find(x=>x.id==id);if(!p)return;setSel(id);mp.flyTo(pos(p),17,{duration:.7});setTimeout(()=>{const m=mk[id];m&&lay.zoomToShowLayer(m,()=>m.openPopup())},760);ns||$('#map').scrollIntoView({block:'nearest',behavior:'smooth'})}

/* ================= dibujo general ================= */
function draw(){try{kwNav()}catch(e){console.error(e)}try{kwRender()}catch(e){console.error(e)}try{kwMk();kwSis()}catch(e){console.error(e)}kp();panel();fchips();lazyList();drawMap();info();alarm();archUI();setLive()}

/* ================= eventos de propiedades ================= */
$('#fl').onclick=e=>{const b=e.target.closest('[data-f]');if(b){flt=b.dataset.f;fchips();list();drawMap();kp()}};
let qT=0;$('#q').oninput=()=>{clearTimeout(qT);qT=setTimeout(()=>{list();drawMap()},140)};
$('#so2').onchange=e=>{srt=e.target.value;list()};
$('#list').addEventListener('click',e=>{const c=e.target.closest('.pc');if(!c)return;const id=c.dataset.id,p=data.find(x=>x.id==id),b=e.target.closest('button');if(!p)return;
 if(b&&b.dataset.ch){const k=b.dataset.ch,o={[k]:!p[k]};if(k=='fb'&&!p.fb&&!p.fbd){o.fbd=ymd(new Date());flash('Marketplace: la cuenta de 7 días empieza hoy (si la publicaste antes, cambia la fecha en «Editar»)')}put(id,o)}
 else if(b&&b.dataset.a=='today'){put(id,{fbd:ymd(new Date()),last:ymd(new Date())});flash('Anuncio renovado: la cuenta de 7 días vuelve a empezar')}
 else if(b&&b.dataset.a=='foto'){fid=p.id;$('#pf').click()}else if(b&&b.dataset.a=='nofoto')put(p.id,{foto:''});
 else if(b&&b.dataset.a=='copy')cp(p);
 else if(b&&b.dataset.a=='edit')openF(p);
 else if(b&&b.dataset.a=='del'){if(b.dataset.s)X(id);else{b.dataset.s=1;const o=b.textContent;b.textContent='¿Seguro?';b.classList.add('ask');setTimeout(()=>{b.dataset.s='';b.textContent=o;b.classList.remove('ask')},3000)}}
 else if(!e.target.closest('input,a,button')){kwView('res',1);go(id)}});
function cp(p){const t=`${p.op=='venta'?'🏠 EN VENTA':'🏠 EN ALQUILER'} · ${p.t}\n💰 ${money(p)}\n📍 ${p.dist}, Arequipa${p.ref?' · '+p.ref:''}\n${feat(p)}\n\n${p.desc||''}\n\n📲 Marilyn Benavente · Escríbeme para coordinar tu visita`;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>flash('Texto copiado: pégalo en Marketplace'),()=>flash('No se pudo copiar'))}

/* ================= formulario ================= */
const pll=t=>{const a=t.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)||t.match(/(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/);return a?[a[1],a[2]]:[]};
const mdl=(id,o)=>{const m=$(id);m.hidden=!o;document.documentElement.style.overflow=o?'hidden':''};
function openF(p){p={...(p||{})};p.ll=p.lat!=null?p.lat+', '+p.lng:'';const o=(a,v)=>a.map(x=>`<option ${x==v?'selected':''}>${x}</option>`).join(''),F=(n,l,t,x='')=>`<label>${l}<input name="${n}" type="${t}" ${t=='number'?'step="any" min="0"':''} value="${esc(p[n]??'')}" ${x}></label>`;
 $('#f').dataset.id=p.id||'';
 $('#f').innerHTML=`<h2>${p.id?'Editar':'Nueva'} propiedad</h2><div class="fg">${F('t','Título','text','required')}<label>Operación<select name="op">${o(['venta','alquiler'],p.op)}</select></label>${F('pr','Precio','number')}<label>Moneda<select name="mon">${o(['USD','PEN'],p.mon)}</select></label><label>Distrito<select name="dist">${o(Object.keys(D),p.dist)}</select></label>${F('ref','Referencia / dirección','text')}${F('m2','Metraje m²','number')}${F('hab','Dormitorios','number')}${F('ban','Baños','number')}${F('coch','Cocheras','number')}${F('ll','Ubicación exacta: pega «lat, lng» o el enlace de Google Maps','text')}${F('fbu','Enlace de tu anuncio en Marketplace','url')}${F('fbd','Fecha de publicación en Marketplace (desde aquí cuenta 7 días)','date')}${F('sisu','Enlace de la propiedad en el sistema','url')}</div><label>Descripción (cocina, terraza, patio…)<textarea name="desc" rows="3">${esc(p.desc||'')}</textarea></label><div class="chs">${[['sis','Sistema EI'],['fb','Facebook']].map(([k,l])=>`<label class="cb"><input type="checkbox" name="${k}" ${p[k]?'checked':''}> ${l}</label>`).join('')}</div><div class="acts"><button class="btn p">Guardar</button><button type="button" class="btn" data-close>Cancelar</button></div>`;
 fotoUI(p);$('#f [name=op]').onchange=e=>{$('#f [name=mon]').value=e.target.value=='venta'?'USD':'PEN'};mdl('#ov',1);setTimeout(()=>{const i=$('#f [name=t]');i&&!p.id&&i.focus()},50)}
$('#f').onsubmit=e=>{e.preventDefault();if(!OWN)return;const f=new FormData(e.target),g=k=>f.get(k)||'',n=k=>g(k)===''?null:+g(k),m=pll(g('ll')),id=e.target.dataset.id||'p'+Date.now().toString(36),old=data.find(x=>x.id==id)||{};
 const o={...old,t:g('t').trim(),op:g('op'),pr:n('pr'),mon:g('mon'),dist:g('dist'),ref:g('ref').trim(),m2:n('m2'),hab:n('hab'),ban:n('ban'),coch:n('coch'),lat:m.length>1?+m[0]:null,lng:m.length>1?+m[1]:null,desc:g('desc').trim(),sis:!!g('sis')||!!g('sisu'),sisu:g('sisu').trim(),fbu:g('fbu').trim(),fbd:g('fbd')||((g('fb')||g('fbu'))?(old.fbd||ymd(new Date())):''),fb:!!g('fb')||!!g('fbu'),grp:old.grp||0,leads:old.leads||0,last:old.last||''};
 if(fChanged)o.foto=fFoto;delete o.id;put(id,o,1);mdl('#ov',0)};
$('#add').onclick=()=>openF();
let fFoto='',fChanged=0,fP=null;
function fphR(){const v=$('#fphv');if(!v)return;const u=fFoto||(fP&&!fChanged?imgU(fP):'');v.innerHTML=u?`<img src="${esc(u)}" referrerpolicy="no-referrer" alt="Foto de la propiedad">`:'<span>🏠 Sin foto</span>';const x=$('#fphx');if(x)x.hidden=!fFoto;const b=$('#fphb');if(b)b.textContent=fFoto?'📷 Cambiar foto':'📷 Elegir foto'}
function shrink(fl,max,q){return new Promise((res,rej)=>{const im=new Image(),u=URL.createObjectURL(fl);im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c.toDataURL('image/jpeg',q))};im.onerror=()=>{URL.revokeObjectURL(u);rej()};im.src=u})}
function fotoUI(p){fP=p;fFoto=p.foto||'';fChanged=0;const c=$('#f .chs');if(!c)return;
 c.insertAdjacentHTML('beforebegin','<div class="fph"><b>Foto de la propiedad</b><div class="fph-v" id="fphv"></div><div class="fph-a"><button type="button" class="btn" id="fphb">📷 Elegir foto</button><button type="button" class="btn" id="fphx">Quitar foto</button></div><input type="file" id="fphi" accept="image/*" hidden></div>');
 fphR();$('#fphb').onclick=()=>$('#fphi').click();$('#fphx').onclick=()=>{fFoto='';fChanged=1;fphR()};
 $('#fphi').onchange=e=>{const fl=e.target.files[0];e.target.value='';if(!fl)return;shrink(fl,960,.78).then(u=>{fFoto=u;fChanged=1;fphR()},()=>flash('No pude leer esa imagen'))}}
let fid='';$('#pf').onchange=e=>{const fl=e.target.files[0];e.target.value='';if(!fl||!fid)return;shrink(fl,960,.78).then(u=>put(fid,{foto:u}),()=>flash('No pude leer esa imagen'))};
/* modales: cerrar con Esc, con «Cancelar» o tocando fuera */
document.addEventListener('click',e=>{const m=e.target.classList&&e.target.classList.contains('mdl')?e.target:null;if(m&&m.id!='lg'||m&&m.id=='lg'){mdl('#'+m.id,0);if(m.id=='im2')$('#ib').innerHTML=''}const c=e.target.closest&&e.target.closest('[data-close]');if(c){const mm=c.closest('.mdl');mm&&mdl('#'+mm.id,0)}});
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const m=[...document.querySelectorAll('.mdl:not([hidden])')].pop();if(m){mdl('#'+m.id,0);if(m.id=='im2')$('#ib').innerHTML=''}});

/* ================= respaldo e importación ================= */
$('#ex').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({v:41,props:data,arch,tiktok:kwB},null,1)],{type:'application/json'}));a.download='propiedades-marilyn-'+ymd(new Date())+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)};
$('#im').onclick=()=>$('#fi').click();
$('#fi').onchange=async e=>{const fl=e.target.files[0];e.target.value='';if(!fl)return;try{const j=JSON.parse(await fl.text());let P,A=[],T=[];
 if(Array.isArray(j)){P=j.filter(x=>x&&x.id&&!x.est);A=j.filter(x=>x&&x.id&&x.est)}else if(j&&Array.isArray(j.props)){P=j.props;A=Array.isArray(j.arch)?j.arch:[];T=Array.isArray(j.tiktok)?j.tiktok:[]}else throw 0;
 const m=new Map(data.map(x=>[x.id,x]));P.forEach(x=>{if(x&&x.id)m.set(x.id,x)});A.forEach(x=>m.delete(x.id));data=[...m.values()].sort(byK);
 const ma=new Map(arch.filter(a=>!P.some(x=>x.id==a.id)).map(x=>[x.id,x]));A.forEach(x=>ma.set(x.id,x));arch=[...ma.values()];
 if(T.length)ttUpsert(T.map(r=>({...r,v:r.v??null,l:r.l??null,c:r.c??null,s:r.s??null,g:r.g??null})));
 ttMigrate();svA();sv();ttSave();$('#brd').__sg='';draw();flash('Importadas '+P.length+' propiedades'+(A.length?' y '+A.length+' archivadas':'')+(T.length?' y '+T.length+' videos':''))}catch(_){flash('Archivo no válido')}};

/* ================= vistas (menú lateral) ================= */
let kwV='res';
function kwInd(v){const i=Math.max(0,['res','prop','mk','tt','sis'].indexOf(v));$('#sb').style.setProperty('--i',i);document.querySelectorAll('.sb-a').forEach((b,j)=>{b.classList.toggle('on',j==i);j==i?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current')})}
function kwView(v,q){const g={prop:'prop',tt:'tt',mk:'mk',sis:'sis'}[v]||'res';kwV=g;try{localStorage.setItem('kw_v',g)}catch(e){}document.body.classList.toggle('kw-res',g=='res');window.kwMapFs&&window.kwMapFs(false);
 document.querySelectorAll('[data-vw]').forEach(e=>e.classList.toggle('kw-vh',e.dataset.vw!=g));kwInd(g);if(g=='prop'&&list.st!==0)list();if(g=='tt')kwRender();if(g=='res')requestAnimationFrame(()=>mp.invalidateSize({pan:false}))}
function kwNav(){const n=(k,v)=>{const b=document.querySelector('.sb-a[data-nav="'+k+'"] .sb-b');if(b&&b.textContent!=String(v)){b.textContent=v;b.classList.remove('bump');void b.offsetWidth;b.classList.add('bump')}},d=data.filter(due).length,a=document.querySelector('.sb-a[data-nav="mk"]');
 n('prop',data.length);n('mk',d);n('tt',ttRows().length);n('sis',data.filter(p=>p.sis).length);$('#lst').textContent='Lista ('+data.length+')';a&&a.toggleAttribute('data-al',d>0&&OWN)}
$('#sb').onclick=e=>{const n=e.target.closest('.sb-a');if(n){kwView(n.dataset.nav);$('#sb').classList.remove('open');n.blur();return}const t=e.target.closest('.sb-tg');if(t){const o=$('#sb').classList.toggle('open');t.setAttribute('aria-expanded',o?'true':'false')}};
document.addEventListener('click',e=>{if(!e.target.closest('#sb'))$('#sb').classList.remove('open')});
document.addEventListener('pointerdown',e=>{const n=e.target.closest&&e.target.closest('.sb-a');if(!n)return;const r=n.getBoundingClientRect(),d=Math.max(r.width,r.height)*2,s=document.createElement('i');s.className='sb-rp';s.style.cssText='left:'+(e.clientX-r.left)+'px;top:'+(e.clientY-r.top)+'px;width:'+d+'px;height:'+d+'px';n.appendChild(s);setTimeout(()=>s.remove(),650)});
$('#shr').onclick=()=>{const u=CF.publicUrl||location.origin+location.pathname;(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>flash('Enlace copiado: '+u),()=>flash(u))};

/* ================= TikTok ================= */
const vid=u=>(String(u||'').match(/(?:video|photo)\/(\d{8,})/)||[])[1]||'';
function ttKey(r){return String(r.id||vid(r.link)||r.link||r.k||String(r.title||'').toLowerCase())}
const ttT=t=>norm(String(t||'').replace(/\s+/g,' ')),ttN=x=>x==null?'–':Number(x).toLocaleString('es-PE'),
ttEr=r=>r.v>0&&r.l!=null?((r.l||0)+(r.c||0)+(r.s||0)+(r.g||0))/r.v:null,ttPct=x=>x==null?'–':(x*100).toFixed(x>=.1?0:1)+'%',
ttVal=(r,k)=>k=='e'?(ttEr(r)||0):k=='r'?(Date.parse(r.d)||0):(r[k]||0),ttD=d=>String(d||'').trim().split(/[ T]/)[0],
ttH=k=>{let h=0;for(const c of k)h=(h*31+c.charCodeAt(0))>>>0;return(350+h%70)%360},ttPh=r=>/\/photo\//.test(r.link||''),
ttHref=r=>/^https?:/.test(r.link||'')?r.link:(r.id?'https://www.tiktok.com/@'+((TT.pf&&TT.pf.username)||'')+'/video/'+r.id:'');
const TT={pf:null,vids:[],loaded:false};
function ttRows(){if(TT.vids.length){const man=new Map();kwB.forEach(r=>{const id=r.id||vid(r.link);if(id)man.set(String(id),r)});
  return TT.vids.map(v=>{const m=man.get(String(v.id))||{};return{id:String(v.id),link:v.share_url||'',title:String(v.title||v.description||m.title||'').trim(),d:v.create_time?ymd(new Date(v.create_time)):'',v:v.views,l:v.likes,c:v.comments,s:v.shares,g:m.g??null,cover:v.cover_url||'',live:1}})}
 return kwB}
let kwS='v',ttQ='',ttList=[];
function thbK(r){return r.id||r.link||''}
function thbG(r){if(r.cover)return r.cover;const t=thb[thbK(r)];return t&&(t.d||Date.now()-t.at<6*36e5)?t.u:''}
function ttCard(r,rk,mx){const k=ttKey(r),href=ttHref(r),u=thbG(r),t=String(r.title||'').replace(/\s+/g,' ').trim(),pct=mx>0&&r.v!=null?Math.max(3,Math.round(r.v/mx*100)):0,er=ttEr(r),d=ttD(r.d);
 return `<article class="tc" data-k="${esc(k)}"><button class="tc-cv" data-pv="${esc(k)}" style="--h:${ttH(k)}" aria-label="Ver vista previa ${rk}">${u?`<img src="${esc(u)}" referrerpolicy="no-referrer" loading="lazy" decoding="async" alt="" onerror="this.remove()">`:''}<span class="tc-cap">${esc(t.slice(0,110))||'Video'}</span><span class="tc-rk${rk<=3?' top':''}">#${rk}</span>${d?`<span class="tc-dt">${esc(d)}</span>`:''}${ttPh(r)?`<span class="tc-ph">${TI.photo}Fotos</span>`:''}<span class="tc-pl">${TI.play}</span><span class="tc-vw">${TI.eye}${ttN(r.v)}<small>vistas</small></span></button>
 <div class="tc-b"><p class="tc-t" title="${esc(t)}">${esc(t)||'Video sin descripción'}</p><div class="tc-m"><span class="${kwS=='l'?'on':''}" title="Likes">${TI.heart}${ttN(r.l)}</span><span class="${kwS=='c'?'on':''}" title="Comentarios">${TI.chat}${ttN(r.c)}</span><span class="${kwS=='s'?'on':''}" title="Compartidos">${TI.share}${ttN(r.s)}</span><span class="${kwS=='g'?'on':''}" title="Guardados">${TI.save}${ttN(r.g)}</span></div><div class="tc-bar" title="Vistas frente al video más visto"><i style="width:${pct}%"></i></div>
 <div class="tc-f"><span class="tc-er${kwS=='e'?' on':''}" title="Interacción = (likes + comentarios + compartidos + guardados) / vistas">${TI.bolt}${ttPct(er)}</span><span class="tc-ac">${href?`<a href="${esc(href)}" target="_blank" rel="noopener" title="Abrir en TikTok" aria-label="Abrir en TikTok">${TI.ext}</a>`:''}${r.live?'':`<button type="button" class="own" data-bdel="${esc(k)}" title="Quitar este video de la lista" aria-label="Quitar este video">${TI.trash}</button>`}</span></div></div></article>`}
function ttGrid(){const g=$('#tt-g');if(!g)return;const R=ttRows(),k=kwS,all=R.slice().sort((a,b)=>ttVal(b,k)-ttVal(a,k)),mx=Math.max(0,...R.map(r=>r.v||0)),q=ttT(ttQ),rk=new Map(all.map((r,i)=>[r,i+1]));
 ttList=q?all.filter(r=>ttT(r.title).includes(q)):all;
 g.innerHTML=ttList.length?ttList.map(r=>ttCard(r,rk.get(r),mx)).join(''):`<div class="kb-e tt-no"><i>${TI.search}</i><b>Ningún video coincide</b><p>Prueba con otra palabra o borra la búsqueda.</p></div>`;
 document.querySelectorAll('#brd [data-bs]').forEach(b=>b.classList.toggle('on',b.dataset.bs==k));const n=$('#tt-n');if(n)n.textContent=q?ttList.length+' de '+all.length+' videos':all.length+' video'+(all.length==1?'':'s')}
const ago=ts=>{if(!ts)return'';const s=Math.max(0,(Date.now()-Date.parse(ts))/1e3);return s<60?'hace un momento':s<3600?'hace '+Math.round(s/60)+' min':s<86400?'hace '+Math.round(s/3600)+' h':'hace '+Math.round(s/86400)+' d'};
function kwRender(){const el=$('#brd');if(!el)return;if(kwV!='tt'&&el.__sg){kwRender.st=1;return}const R=ttRows(),pf=TT.pf,live=!!TT.vids.length,at=LS.g('mb_tt','');
 const sg=JSON.stringify([OWN,live,pf&&[pf.synced_at,pf.follower_count,pf.likes_count,pf.video_count,pf.connected],R.length,R.reduce((a,r)=>a+(r.v||0)+(r.l||0)+(r.c||0)+(r.s||0)+(r.g||0),0),R.map(ttKey).join('|').length,R.map(r=>r.cover?1:0).join('')]);
 if(el.__sg===sg&&el.querySelector('.tt-w'))return;el.__sg=sg;setTimeout(loadBrandThumbs,0);
 const T=x=>R.reduce((a,r)=>a+(r[x]||0),0),tv=T('v'),hasG=R.some(r=>r.g!=null),te=tv?(T('l')+T('c')+T('s')+T('g'))/tv:null;
 const prof=pf&&pf.connected?`<div class="tt-pf"><span class="tt-av">${pf.avatar_url?`<img src="${esc(pf.avatar_url)}" referrerpolicy="no-referrer" alt="" onerror="this.remove()">`:'TT'}</span><div class="tt-id"><b>${esc(pf.display_name||'Mi cuenta de TikTok')}</b><small>${pf.username?'@'+esc(pf.username)+' · ':''}<span id="tt-ago">${pf.synced_at?'Actualizado '+ago(pf.synced_at):'Sincronizando…'}</span></small></div><div class="tt-ps"><div><b>${ttN(pf.follower_count)}</b><small>Seguidores</small></div><div><b>${ttN(pf.likes_count)}</b><small>Me gusta totales</small></div><div><b>${ttN(pf.video_count)}</b><small>Videos</small></div></div><div class="tt-lv"><span class="live"><i></i>En vivo</span><button class="btn own" data-ttr>${TI.sync}Actualizar ahora</button></div></div>${pf.last_error&&OWN?`<div class="warn">TikTok respondió: ${esc(pf.last_error)}. Si persiste, toca «Reconectar TikTok».</div>`:''}`
  :(OWN&&sb?`<div class="tt-cn"><b>Conecta tu cuenta de TikTok</b><p>Al conectarla, el panel lee tus videos publicados con sus vistas, likes, comentarios y compartidos, y se actualiza solo cada pocos minutos. Cualquiera que abra el enlace del panel ve las cifras, pero solo tú puedes conectar o desconectar la cuenta.</p><button class="btn p" data-ttc>${TI.link}Conectar TikTok</button></div>`:'');
 el.innerHTML=`<div class="tt-w"><div class="kb-h"><div><h2>TikTok <small>· ${R.length} video${R.length==1?'':'s'}${!live&&at?' · informe al '+esc(at):''}</small></h2><p class="mut">${live?'Tus videos publicados con sus estadísticas en tiempo real. Toca uno para ver la vista previa.':'Todos tus videos en un solo lugar. Toca uno para ver la vista previa.'}</p></div><div class="kb-btns own">${pf&&pf.connected?`<button class="btn" data-ttc>Reconectar TikTok</button>`:''}${live?'':'<button class="btn" data-badd>＋ Agregar enlaces</button>'}<button class="btn${live?'':' p'}" data-bi title="${live?'Sube el informe de TikTok Studio para sumar los guardados':'Sube el Excel o CSV del informe de TikTok'}">Importar informe</button></div></div>`+prof
 +(R.length?`<div class="kb-st">${[['Vistas',TI.eye,ttN(tv)],['Likes',TI.heart,ttN(T('l'))],['Comentarios',TI.chat,ttN(T('c'))],['Compartidos',TI.share,ttN(T('s'))],['Guardados',TI.save,hasG?ttN(T('g')):'–'],['Interacción',TI.bolt,ttPct(te)]].map(([n,i,v])=>`<div><i>${i}</i><b>${v}</b><small>${n}</small></div>`).join('')}</div>
 <div class="tt-bar"><label class="tt-q">${TI.search}<input id="tt-q" type="search" placeholder="Buscar en las descripciones…" autocomplete="off" value="${esc(ttQ)}" aria-label="Buscar videos"></label><div class="tt-so"><span>Ordenar</span>${[['v','Vistas'],['l','Likes'],['c','Coment.'],['s','Compart.'],['g','Guardados'],['e','Interacción'],['r','Recientes']].map(([q,n])=>`<button class="chip ${kwS==q?'on':''}" data-bs="${q}">${n}</button>`).join('')}</div><span class="tt-n" id="tt-n"></span></div><div class="tt-g" id="tt-g"></div>`
 :`<div class="kb-e"><i>${TI.vid}</i><b>Aún no hay videos de TikTok</b><p>${OWN?'Conecta tu cuenta arriba o sube el informe de TikTok.':'Pronto verás aquí los videos publicados.'}</p></div>`)+`</div>`;if(R.length)ttGrid()}
setInterval(()=>{const a=$('#tt-ago');if(a&&TT.pf&&TT.pf.synced_at)a.textContent='Actualizado '+ago(TT.pf.synced_at)},30000);
/* vista previa */
let ttPvI=0,ttPvF=null;
function ttPvR(){let o=$('#ttp');if(!o){o=document.createElement('div');o.id='ttp';o.className='ttp';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label','Vista previa del video');document.body.appendChild(o)}
 const r=ttList[ttPvI];if(!r)return ttPvX();const k=ttKey(r),id=r.id||vid(r.link),can=id&&navigator.onLine!==false,ph=ttPh(r),href=ttHref(r),u=thbG(r),t=String(r.title||'').replace(/\s+/g,' ').trim(),d=ttD(r.d),er=ttEr(r),rk=ttRows().slice().sort((a,b)=>ttVal(b,kwS)-ttVal(a,kwS)).findIndex(x=>ttKey(x)==k)+1;
 o.innerHTML=`<div class="ttp-bg" data-px></div><div class="ttp-in"><button class="ttp-x" data-px aria-label="Cerrar vista previa">✕</button><button class="ttp-n pv" data-pn="-1" aria-label="Video anterior"${ttPvI<1?' disabled':''}>‹</button><button class="ttp-n nx" data-pn="1" aria-label="Video siguiente"${ttPvI>=ttList.length-1?' disabled':''}>›</button><div class="ttp-pl" style="--h:${ttH(k)}">${u?`<img class="ttp-th" src="${esc(u)}" referrerpolicy="no-referrer" alt="" onerror="this.remove()">`:''}${can?`<button class="ttp-go" data-play="${esc(id)}" data-ph="${ph?1:0}" style="position:absolute;inset:0;border:0;background:none;color:#fff;cursor:pointer;width:100%;height:100%" aria-label="Reproducir"><span class="tc-pl">${TI.play}</span><small style="position:absolute;left:0;right:0;bottom:18px;text-align:center;font-weight:600">Toca para reproducir</small></button>`:`<div class="ttp-nv"><i>${TI.vid}</i><b>Este video no se puede reproducir aquí</b><small>${href?'No hay conexión o el enlace es corto. Ábrelo en TikTok.':'Falta el enlace del video.'}</small></div>`}</div>
 <aside class="ttp-s"><span class="ttp-rk">${ph?'Fotos':'Video'} ${ttPvI+1} de ${ttList.length} · puesto #${rk}</span><p class="ttp-t">${esc(t)||'Video sin descripción'}</p>${d?`<span class="mut">Publicado: ${esc(d)}</span>`:''}<div class="ttp-g"><div>${TI.eye}<b>${ttN(r.v)}</b><small>Vistas</small></div><div>${TI.heart}<b>${ttN(r.l)}</b><small>Likes</small></div><div>${TI.chat}<b>${ttN(r.c)}</b><small>Comentarios</small></div><div>${TI.share}<b>${ttN(r.s)}</b><small>Compartidos</small></div><div>${TI.save}<b>${ttN(r.g)}</b><small>Guardados</small></div></div><div class="ttp-e">${TI.bolt}<span>Interacción <b>${ttPct(er)}</b></span></div><div class="ttp-a">${href?`<a class="btn p" href="${esc(href)}" target="_blank" rel="noopener">Abrir en TikTok ${TI.ext}</a><button class="btn" data-pcopy>${TI.copy} Copiar enlace</button>`:''}</div><p class="mut ttp-h">¿No carga o sale un error? Toca <button class="btn" data-alt style="min-height:26px;padding:0 9px;font-size:11.5px">Usar otro reproductor</button> o ábrelo en TikTok. Usa ← → para cambiar de video y Esc para cerrar.</p></aside></div>`;
 o.hidden=false;const c=o.querySelector('.ttp-x');c&&c.focus()}
function ttPlay(box,id,alt){if(!box||!id)return;box.classList.remove('ok');box.querySelectorAll('.ttp-go,.ttp-ld,.ttp-if').forEach(e=>e.remove());const src=alt?'https://www.tiktok.com/embed/v2/'+id:'https://www.tiktok.com/player/v1/'+id+'?autoplay=1&loop=1&rel=0&description=0&music_info=0&native_context_menu=0&closed_caption=0';
 box.insertAdjacentHTML('beforeend','<div class="ttp-ld"><span class="ttp-sp"></span><small>Cargando…</small></div><iframe class="ttp-if" src="'+src+'" allow="autoplay; fullscreen; encrypted-media; picture-in-picture; clipboard-write" allowfullscreen title="Video de TikTok"></iframe>');const f=box.querySelector('.ttp-if');f.onload=()=>box.classList.add('ok')}
function ttPvX(){const o=$('#ttp');if(o){o.hidden=true;o.innerHTML=''}if(ttPvF&&ttPvF.focus&&document.contains(ttPvF))try{ttPvF.focus({preventScroll:true})}catch(e){}ttPvF=null}
function ttPv(k){const i=ttList.findIndex(r=>ttKey(r)==k);if(i<0)return;ttPvF=document.activeElement;ttPvI=i;ttPvR()}
document.addEventListener('click',e=>{const o=$('#ttp');if(!o||o.hidden||!o.contains(e.target))return;if(e.target.closest('[data-px]'))return ttPvX();const pg=e.target.closest('[data-play]');if(pg){ttPlay(pg.closest('.ttp-pl'),pg.dataset.play,pg.dataset.ph=='1');return}if(e.target.closest('[data-alt]')){const r=ttList[ttPvI],id=r&&(r.id||vid(r.link));if(id)ttPlay(o.querySelector('.ttp-pl'),id,true);return}const n=e.target.closest('[data-pn]');if(n){const i=ttPvI+ +n.dataset.pn;if(i>=0&&i<ttList.length){ttPvI=i;ttPvR()}return}
 if(e.target.closest('[data-pcopy]')){const r=ttList[ttPvI],h=r&&ttHref(r);(navigator.clipboard?navigator.clipboard.writeText(h):Promise.reject()).then(()=>flash('Enlace copiado'),()=>flash(h))}});
document.addEventListener('keydown',e=>{const o=$('#ttp');if(!o||o.hidden)return;if(e.key=='Escape'){e.stopPropagation();ttPvX()}else if(e.key=='ArrowRight'&&ttPvI<ttList.length-1){ttPvI++;ttPvR()}else if(e.key=='ArrowLeft'&&ttPvI>0){ttPvI--;ttPvR()}},true);
let ttAsk=null,ttAskT=0;
$('#brd').onclick=e=>{const s=e.target.closest('[data-bs]');if(s){kwS=s.dataset.bs;ttGrid();return}
 if(e.target.closest('[data-bi]')){$('#tf').click();return}
 if(e.target.closest('[data-badd]')){ttAdd();return}
 if(e.target.closest('[data-ttc]')){ttConnect();return}
 const rf=e.target.closest('[data-ttr]');if(rf){rf.disabled=true;ttPing(1).then(j=>{rf.disabled=false;if(j&&j.ok)flash('TikTok actualizado');else flash('TikTok: '+((j&&j.error)||'no se pudo actualizar'));ttLoad()});return}
 const p=e.target.closest('[data-pv]');if(p){ttPv(p.dataset.pv);return}
 const d=e.target.closest('[data-bdel]');if(d){const k=d.dataset.bdel;if(ttAsk!==k){ttAsk=k;d.classList.add('ask');d.textContent='¿Quitar?';clearTimeout(ttAskT);ttAskT=setTimeout(()=>{if(ttAsk===k){ttAsk=null;if(d.isConnected){d.classList.remove('ask');d.innerHTML=TI.trash}}},3000);return}
  ttAsk=null;kwB=kwB.filter(r=>ttKey(r)!=k);ttSave();$('#brd').__sg='';kwNav();kwRender();flash('Video quitado de la lista')}};
$('#brd').addEventListener('input',e=>{if(e.target.id=='tt-q'){ttQ=e.target.value;ttGrid()}});
/* informe manual (Excel/CSV) */
const KEYS=[['i',/^(video )?id$|^id (del )?video$/],['u',/link|enlace|url/],['t',/titulo|title|descrip|caption/],['v',/view|visualiz|vista|reproduc/],['l',/like|me gusta/],['c',/comment|comentar/],['s',/share|compart/],['g',/favorit|guardad|saved|saves|collect/],['d',/fecha|date|post time|posted|publica|publish|hora/]],
num=x=>{if(typeof x=='number')return Math.round(x);let t=String(x??'').replace(/\s/g,'');if(!/\d/.test(t))return null;if(/^\d{1,3}([.,]\d{3})+$/.test(t))t=t.replace(/[.,]/g,'');else t=t.replace(',','.').replace(/[^\d.]/g,'');return Math.round(parseFloat(t))||0};
function parseRows(R,H){H=H||{};for(let i=0;i<Math.min(R.length,60);i++){const h=(R[i]||[]).map(norm),ix={},used=[];KEYS.forEach(([k,re])=>{const j=h.findIndex((x,j)=>x&&!used.includes(j)&&re.test(x));if(j>=0){ix[k]=j;used.push(j)}});
 if(['v','l','c','s','g'].filter(k=>k in ix).length>=2&&('u' in ix||'t' in ix||'i' in ix)){const out=[];for(let r=i+1;r<R.length;r++){const w=R[r]||[];if(!w.some(x=>x!==''&&x!=null))continue;
  let link=String(w[ix.u]??'').trim();if(!/^https?:\/\//i.test(link)){link='';const c=[...(H[r]||[]),...w.map(x=>String(x??''))].map(x=>x.trim()).find(x=>/^https?:\/\/\S*tiktok\.com/i.test(x));if(c)link=c}
  const idc=String(w[ix.i]??'').trim(),id=(link.match(/(?:video|photo)\/(\d{8,})/)||[])[1]||(/^\d{8,}$/.test(idc)?idc:''),title=String(w[ix.t]??'').replace(/\s+/g,' ').trim(),g=k=>k in ix?num(w[ix[k]]):null;
  if(!['v','l','c','s','g'].some(k=>g(k)!=null)&&!link&&!id)continue;if(!link&&!id&&w.some(x=>/^(total|totales|suma|promedio|average|grand total)\b/.test(norm(x))))continue;
  out.push({id,link,title,d:'d' in ix?String(w[ix.d]??'').trim():'',v:g('v'),l:g('l'),c:g('c'),s:g('s'),g:g('g')})}if(out.length)return out}}return null}
const loadJs=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)});
async function readTT(fl){if(!window.XLSX)await loadJs(CF.xlsx||'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');let wb;const bf=await fl.arrayBuffer();
 if(/\.(csv|txt)$/i.test(fl.name)){let t=new TextDecoder('utf-8').decode(bf);if(t.includes('�'))t=new TextDecoder('windows-1252').decode(bf);wb=XLSX.read(t.replace(/^﻿/,''),{type:'string',raw:true})}else wb=XLSX.read(bf,{type:'array'});
 const P=[];for(const n of wb.SheetNames){const ws=wb.Sheets[n],H={};try{const rg=XLSX.utils.decode_range(ws['!ref']||'A1');for(const a in ws){if(a[0]=='!')continue;const c=ws[a];if(c&&c.l&&c.l.Target){const p=XLSX.utils.decode_cell(a),k=p.r-rg.s.r;(H[k]=H[k]||[]).push(c.l.Target)}}}catch(e){}
  const r=parseRows(XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false,blankrows:true}),H);if(r&&r.length)P.push(r)}
 if(!P.length)return null;P.sort((a,b)=>b.length-a.length);const base=P[0].slice(),ix=new Map(),reg=r=>{if(r.id)ix.set('i'+r.id,r);if(r.link)ix.set('l'+r.link,r)};base.forEach(reg);
 P.slice(1).forEach(L=>L.forEach(r=>{const x=(r.id&&ix.get('i'+r.id))||(r.link&&ix.get('l'+r.link));if(x){['v','l','c','s','g'].forEach(k=>{if(r[k]!=null&&(r[k]||0)>(x[k]||0))x[k]=r[k]});if(!x.title&&r.title)x.title=r.title}else if(r.id||r.link){base.push(r);reg(r)}}));return base}
function ttUpsert(rows){let nw=0,up=0;const bI=new Map(),bL=new Map(),bT=new Map(),seen=new Set(),reg=r=>{const id=r.id||vid(r.link);if(id)bI.set(String(id),r);if(r.link)bL.set(r.link,r);if(!id&&!r.link){const t=ttT(r.title);(bT.get(t)||bT.set(t,[]).get(t)).push(r)}};kwB.forEach(reg);
 rows.forEach(r=>{const link=/^https?:/.test(r.link||'')?r.link:'',id=String(r.id||vid(link)||''),m={};['v','l','c','s','g'].forEach(q=>{if(r[q]!=null)m[q]=r[q]});let x=(id&&bI.get(id))||(link&&bL.get(link))||null;
  if(!x&&!id&&!link)x=(bT.get(ttT(r.title))||[]).find(y=>!seen.has(y))||null;
  if(x){if(seen.has(x))Object.keys(m).forEach(q=>{if(m[q]>(x[q]||0))x[q]=m[q]});else Object.assign(x,m);if(!x.title&&r.title)x.title=r.title;if(!x.link&&link)x.link=link;if(!x.id&&id)x.id=id;if(!x.d&&r.d)x.d=r.d;seen.add(x);up++}
  else{const o={id,link:link||(id?'https://www.tiktok.com/@/video/'+id:''),title:r.title||'',d:r.d||'',v:null,l:null,c:null,s:null,g:null,...m};if(!id&&!link)o.k='r'+Date.now().toString(36)+kwB.length;kwB.push(o);reg(o);seen.add(o);nw++}});return{nw,up}}
function ttMigrate(){const TTF=['ttu','tt','tv','tl','tc','ts','tg','tvs','ttt'];let ch=0;const add=[];
 const strip=p=>{if(!TTF.some(k=>k in p))return p;const L=Array.isArray(p.tvs)?p.tvs:(p.ttu?[{id:vid(p.ttu),link:p.ttu,title:p.ttt||'',v:p.tv,l:p.tl,c:p.tc,s:p.ts}]:[]);add.push(...L);const o={...p};TTF.forEach(k=>delete o[k]);ch=1;return o};
 data=data.map(strip);arch=arch.map(strip);if(add.length)ttUpsert(add);return ch}
function ttAdd(){$('#ib').innerHTML=`<div class="arq"><div class="arq-h"><h2>Agregar videos por enlace</h2><button class="btn" data-close>Cerrar ✕</button></div><p class="mut">Pega uno o varios enlaces de TikTok, uno por línea. Las cifras se completan al importar el informe.</p><textarea id="tadd" rows="5" style="width:100%" placeholder="https://www.tiktok.com/@usuario/video/…"></textarea><div class="arq-o"><button class="btn p" data-tsave>Agregar</button></div></div>`;mdl('#im2',1)}
$('#tf').onchange=async e=>{const fl=e.target.files[0];e.target.value='';if(!fl)return;if(/\.zip$/i.test(fl.name))return flash('Es un .zip: descomprímelo y elige el archivo .csv o .xlsx de los videos');
 try{flash('Leyendo el informe…');const r=await readTT(fl);if(!r||!r.length)return flash('No encontré la tabla de videos en ese archivo');const{nw,up}=ttUpsert(r);LS.s('mb_tt',ymd(new Date()));ttSave();$('#brd').__sg='';draw();
  flash('Informe leído: '+r.length+' fila'+(r.length==1?'':'s')+' · '+nw+' nuevo'+(nw==1?'':'s')+' · '+up+' actualizado'+(up==1?'':'s'))}catch(x){console.error(x);flash('No pude leer el archivo')}};
/* portadas para videos cargados a mano */
const BAD=/rsrc\.php|static\.xx\.fbcdn|fb_logo|facebook_logo/i;let thbBusy=false;const thbFail=new Map();
async function thbData(u){try{const r=await fetch(u,{mode:'cors',referrerPolicy:'no-referrer'});if(!r.ok)return'';const bm=await createImageBitmap(await r.blob()),k=Math.min(1,320/Math.max(bm.width,bm.height)),cv=document.createElement('canvas');cv.width=Math.round(bm.width*k);cv.height=Math.round(bm.height*k);cv.getContext('2d').drawImage(bm,0,0,cv.width,cv.height);return cv.toDataURL('image/jpeg',.72)}catch(e){return''}}
function thbSave(){for(let i=0;i<200;i++){if(LS.s('mb_thb',thb))return;const ks=Object.keys(thb).sort((a,b)=>thb[a].at-thb[b].at);if(!ks.length)return;delete thb[ks[0]]}}
function ttThbApply(r){const k=ttKey(r),el=[...document.querySelectorAll('#tt-g .tc')].find(e=>e.dataset.k==k),u=thbG(r);if(!el||!u)return;const cv=el.querySelector('.tc-cv');if(cv&&!cv.querySelector('img')){const i=document.createElement('img');i.src=u;i.alt='';i.referrerPolicy='no-referrer';i.onerror=()=>i.remove();cv.insertBefore(i,cv.firstChild)}}
async function loadBrandThumbs(){if(thbBusy||TT.vids.length)return;const Q=kwB.filter(r=>{const k=thbK(r),f=thbFail.get(k);return k&&!thbG(r)&&!(f&&Date.now()-f.at<Math.min(2e4*2**f.n,6e5))});if(!Q.length)return;
 thbBusy=true;let ch=0,tt=0,i=0;
 const one=async()=>{while(i<Q.length){const r=Q[i++],k=thbK(r),c=/^https?:/.test(r.link||'')?r.link:(r.id?'https://www.tiktok.com/@tiktok/video/'+r.id:'');if(!c)continue;let u='',ti='';
  try{const j=await(await fetch('https://www.tiktok.com/oembed?url='+encodeURIComponent(c))).json();u=(j&&j.thumbnail_url)||'';ti=(j&&j.title)||''}catch(e){}
  if(ti&&!r.title){r.title=ti;tt=1}
  if(u){const d=await thbData(u);thb[k]={u:d||u,at:Date.now(),d:d?1:0};ch=1;ttThbApply(r)}else thbFail.set(k,{n:Math.min(((thbFail.get(k)||{}).n||0)+1,5),at:Date.now()})}};
 try{await Promise.all([one(),one(),one(),one()])}finally{thbBusy=false}
 if(ch)thbSave();if(tt&&OWN){ttSave();$('#brd').__sg='';kwRender()}}
function ttMaybeLoadThumbs(){if(kwB.length&&!TT.vids.length)loadBrandThumbs()}
addEventListener('online',()=>{thbFail.clear();loadBrandThumbs()});
/* TikTok en vivo (API oficial vía funciones seguras de Supabase) */
let ttLT=0;function ttSched(){clearTimeout(ttLT);ttLT=setTimeout(ttLoad,600)}
async function ttLoad(){if(!sb)return;try{const[p,v]=await Promise.all([sb.from('tt_profile').select('*').eq('id',1).maybeSingle(),sb.from('tt_videos').select('id,title,description,create_time,cover_url,share_url,views,likes,comments,shares').eq('active',true).order('create_time',{ascending:false}).limit(2000)]);
 if(p.error||v.error)throw p.error||v.error;TT.pf=p.data||null;TT.vids=(TT.pf&&TT.pf.connected)?(v.data||[]):[];TT.loaded=true;$('#brd').__sg='';kwNav();kwRender()}catch(e){console.warn('TikTok',e)}}
async function fnCall(name,body){const h={'Content-Type':'application/json',Authorization:'Bearer '+(CF.fnKey||CF.key),apikey:CF.fnKey||CF.key};if(OWN&&sb){const s=(await sb.auth.getSession()).data.session;if(s)h['x-user-token']=s.access_token}
 const r=await fetch(CF.url+'/functions/v1/'+name,{method:'POST',headers:h,body:JSON.stringify(body||{})});const j=await r.json().catch(()=>({}));if(!r.ok&&!j.error)j.error='el servidor respondió '+r.status;return j}
async function ttPing(force){if(!sb)return{ok:false,error:'sin nube'};try{return await fnCall('tiktok-sync',{force:!!force})}catch(e){return{ok:false,error:e.message}}}
async function ttConnect(){if(!sb||!OWN)return;flash('Abriendo TikTok…');try{const j=await fnCall('tiktok-auth',{action:'start'});if(!j.url)throw new Error(j.error||'sin respuesta');location.href=j.url}catch(e){flash('No pude abrir TikTok: '+e.message)}}
async function ttFinish(){let p=null;try{p=JSON.parse(sessionStorage.getItem('mb_ttcb')||'null')}catch(e){}if(!p||!OWN)return;sessionStorage.removeItem('mb_ttcb');flash('Terminando de conectar TikTok…');kwView('tt');
 try{const j=await fnCall('tiktok-auth',{action:'callback',code:p.code,state:p.state});if(!j.ok)throw new Error(j.error||'no se pudo');flash('TikTok conectado: tus videos se cargan en vivo');await ttLoad()}catch(e){flash('TikTok no se conectó: '+e.message)}}
setInterval(()=>{if(sb&&!document.hidden)ttPing(0)},4*60*1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&sb){ttPing(0);if(TT.pf&&TT.pf.synced_at&&Date.now()-Date.parse(TT.pf.synced_at)>6e5)ttLoad()}});

/* ================= Sistema EI (propiedades de la inmobiliaria) ================= */
const FOT={},SBU='https://crnvavaaxsoesabipcho.supabase.co/rest/v1/ei_props?select=*&asesor=ilike.*marilyn*&order=created_at.desc',SBK="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNybnZhdmFheHNvZXNhYmlwY2hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTc1OTQsImV4cCI6MjA4OTQ5MzU5NH0.P00sHTHvoZBvaL7WnAGdHWQqu9kUvXexLQ9B0IH1dR4";
const imgU=p=>p.foto||(FOT[p.id]&&FOT[p.id][0])||p.fs||'';
function thHtml(p,sm){const u=imgU(p);return `<div class="ph${sm?' s':''}">${u?`<img src="${esc(u)}" referrerpolicy="no-referrer" loading="lazy" alt="" onerror="this.remove()">`:`<span>🏠${sm?'':' Sin foto'}</span>`}${sm?'':'<b>Sistema EI</b>'}</div>`}
function pth(p){const u=imgU(p);return `<div class="mth"><span>${ico(p)}</span>${u?`<img src="${esc(u)}" referrerpolicy="no-referrer" loading="lazy" alt="" onerror="this.remove()">`:''}</div>`}
function distOf(u,st){const t=norm(u);let b='',bi=1e9;for(const d of Object.keys(D)){const i=t.indexOf(norm(d));if(i>=0&&i<bi){bi=i;b=d}}return b||(st?'':'Cercado')}
function llOf(t){const a=pll(String(t||''));if(a.length<2)return null;const la=+a[0],lo=+a[1];return la<-15.5&&la>-17.5&&lo<-70.5&&lo>-72.5?[la,lo]:null}
let sisRows=null,sisBusy=0;
async function syncSis(b){if(sisBusy)return;sisBusy=1;try{const r=await fetch(SBU,{headers:{apikey:SBK,Authorization:'Bearer '+SBK}}),rows=await r.json();if(!Array.isArray(rows))throw 0;sisRows=rows;applySis(rows,b);sisOk=new Date().toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})}
 catch(e){sisOk=false;b&&flash('No pude conectar con el sistema de la inmobiliaria')}finally{sisBusy=0;setLive();try{kwSis()}catch(e){}}}
function applySis(rows,b,quiet){const mine=rows.filter(x=>/benavente/i.test(x.asesor||'')&&(!x.estado||x.estado=='Activa')),old=new Map(data.map(p=>[p.id,p]));
 const nw=mine.map(r=>{const id='ei_'+r.id,o=old.get(id)||{},c=r.caract||'',m=re=>{const x=c.match(re);return x?+x[1]:null},ll=llOf((r.direccion||'')+' '+(r.ficha||''));let fo=[];try{fo=JSON.parse(r.fotos_urls||'[]')}catch(e){}
  FOT[id]=(Array.isArray(fo)?fo:[]).map(x=>typeof x=='string'?x:x&&(x.url||x.src)).filter(Boolean);const op=String(r.operacion||'Venta');
  return{...o,id,t:((r.tipo||'Propiedad')+' · '+(r.direccion||r.ubicacion||'')).slice(0,70),op:/^alquiler/i.test(op)?'alquiler':'venta',opx:/^(venta|alquiler)$/i.test(op)?'':op,pr:+r.precio||0,mon:/usd|\$|dol/i.test(r.moneda||'USD')?'USD':'PEN',dist:distOf(r.ubicacion,1)||o.dist||'Cercado',ref:r.direccion||'',m2:+r.area||null,hab:m(/(\d+)\s*dorm/i),ban:m(/(\d+)\s*ba[ñn]/i),coch:m(/(\d+)\s*cochera/i),desc:String(r.ficha||c).replace(/[#*_`>|]+/g,' ').replace(/\s+/g,' ').trim().slice(0,600),sis:true,fs:(FOT[id]&&FOT[id][0])||o.fs||'',lat:ll?ll[0]:(o.lat??null),lng:ll?ll[1]:(o.lng??null)}});
 const got=new Set(nw.map(p=>p.id)),gone=data.filter(p=>String(p.id).startsWith('ei_')&&p.t2&&!got.has(p.id)).map(p=>({...p,id:'m_'+p.id,t:p.t2,t2:''})),nv=nw.filter(p=>!arch.some(a=>a.id==p.id));
 const before=JSON.stringify(data),nd=[...data.filter(p=>!String(p.id).startsWith('ei_')),...gone,...nv];data=nd;ddv(1);
 if(JSON.stringify(data)!==before){if(!quiet)persist('prop');drawMap.sg='';if(!quiet)draw()}
 if(b)flash(nw.length?'Sistema: '+nv.length+' propiedades de Marilyn'+(nw.length>nv.length?' ('+(nw.length-nv.length)+' archivadas)':''):'No encontré propiedades activas de Marilyn Benavente en el sistema')}
$('#sy').onclick=()=>syncSis(1);setInterval(()=>{if(!document.hidden)syncSis()},300000);

/* ================= aviso de renovación (solo para ti) ================= */
const BT=document.title,cnt=p=>{const a=age(p);return a==Infinity?'sin fecha de publicación':a>DUE?'Vencida hace '+(a-DUE)+' d':a==DUE?'¡Día 7! Renueva hoy':'Día '+a+' de '+DUE+' · faltan '+(DUE-a)+' d'};
function beep(){try{const c=new(window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=880;g.gain.value=.15;o.start();o.stop(c.currentTime+.5)}catch(e){}}
function alarm(){const L=OWN?data.filter(due).sort((a,b)=>ak(b)-ak(a)):[],el=$('#al');if(!L.length){el.hidden=true;document.title=BT;return}
 const np=typeof Notification!='undefined'?Notification.permission:'denied',sg=L.map(p=>p.id+age(p)).join()+np;
 if(alarm.i===undefined){alarm.i=1;el.classList.toggle('col',LS.g('mb_alc','1')!='0')}
 if(sg!==alarm.s){alarm.s=sg;const col=el.classList.contains('col');
  el.innerHTML=`<div class="alh"><span class="alb"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 17h12l-1.5-2V11a4.5 4.5 0 0 0-9 0v4zM10 20a2 2 0 0 0 4 0"/></svg></span><div class="alt"><b>Renueva tu anuncio en Marketplace</b><small>${L.length==1?'1 anuncio llegó':L.length+' anuncios llegaron'} al día ${DUE} · renuévalo en Facebook y toca «Ya renové»</small></div><button type="button" class="alx" data-tg aria-expanded="${col?'false':'true'}"><span class="alxt">${col?'Ver anuncios ('+L.length+')':'Ocultar anuncios'}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></div><div class="alc">${L.map(p=>{const a=age(p),od=a-DUE;return `<article class="ali${od>0?' late':''}"><div class="rg" style="--p:100;--k:var(--acc2)"><b>${a}</b></div><div class="alm"><b>${esc(p.t.slice(0,46))}</b><small>${od>0?'Vencido hace '+od+' d':'Hoy es el día 7'}</small></div><div class="ala"><button class="btn" data-go="${esc(p.id)}">Ver</button><button class="btn p" data-rn="${esc(p.id)}">Ya renové</button></div></article>`}).join('')}<div class="alf"><button class="btn p" data-mk>Abrir Marketplace completo →</button>${np=='default'?'<button class="btn" data-notif>Activar avisos del navegador</button>':''}</div></div>`}
 el.hidden=false;document.title='⏰ ('+L.length+') '+BT;
 const seen=LS.g('mb_al',{}),k=ymd(new Date()),nw=L.filter(p=>seen[p.id]!=k);
 if(nw.length){nw.forEach(p=>seen[p.id]=k);LS.s('mb_al',seen);flash('Toca renovar en Marketplace: '+nw.map(p=>p.t.slice(0,30)).join(', '));beep();if(np=='granted')nw.forEach(p=>{try{new Notification('Renueva tu anuncio en Marketplace',{body:p.t})}catch(e){}})}}
$('#al').onclick=e=>{const T=e.target,tg=T.closest('[data-tg]'),a=$('#al');if(tg){const c=a.classList.toggle('col');LS.s('mb_alc',c?'1':'0');tg.setAttribute('aria-expanded',c?'false':'true');tg.querySelector('.alxt').textContent=c?'Ver anuncios ('+a.querySelectorAll('.ali').length+')':'Ocultar anuncios';return}
 if(T.closest('[data-mk]')){kwMkF=data.some(due)?'due':'todos';kwView('mk');return}
 const r=T.closest('[data-rn]');if(r){if(!r.classList.contains('ask')){r.classList.add('ask');r.textContent='¿Confirmar?';clearTimeout(r._t);r._t=setTimeout(()=>{r.classList.remove('ask');r.textContent='Ya renové'},2800);return}
  r.closest('.ali').classList.add('done');setTimeout(()=>{put(r.dataset.rn,{fbd:ymd(new Date())});flash('Anuncio renovado · el contador vuelve a 0')},600);return}
 if(T.closest('[data-notif]')){Notification.requestPermission().then(()=>{alarm.s='';alarm()});return}const b=T.closest('[data-go]');if(b){a.classList.add('col');go(b.dataset.go,1)}};
document.addEventListener('click',e=>{const a=$('#al');if(a&&!a.hidden&&!a.classList.contains('col')&&!e.target.closest('#al')&&matchMedia('(min-width:861px)').matches){a.classList.add('col');const t=a.querySelector('[data-tg]');if(t){t.setAttribute('aria-expanded','false');t.querySelector('.alxt').textContent='Ver anuncios ('+a.querySelectorAll('.ali').length+')'}}});
setInterval(()=>{if(!document.hidden)alarm()},60000);

/* ================= Marketplace y Sistema EI ================= */
let kwMkF='todos',kwMkQ='',kwSisF='todas',kwSisQ='';
const kwVm=id=>{kwView('res',1);setTimeout(()=>go(id,1),160)},
kwQ=(el,q,s)=>{const t=norm(q);el.querySelectorAll(s).forEach(c=>{c.hidden=!!t&&!norm(c.dataset.s).includes(t)})},
kwTile=(n,l,c,h)=>`<div class="vs" style="--c:${c}"><b>${n}</b><small>${l}</small>${h?`<em>${h}</em>`:''}</div>`,
kwChips=(L,cur,at)=>`<div class="vch" role="group">${L.map(([k,l,n])=>`<button type="button" class="chip ${cur==k?'on':''}" ${at}="${k}" aria-pressed="${cur==k}">${l} <b>${n}</b></button>`).join('')}</div>`,
kwHead=(t,sub,act)=>`<div class="vh2"><div><h2>${t}</h2><p class="mut">${sub}</p></div><div class="vha">${act||''}</div></div>`,
kwEmpty=el=>{const g=el.querySelector('.vgrid,.sgrid'),m=el.querySelector('.vempty');if(!g||!m)return;m.hidden=[...g.children].some(c=>c.offsetParent!==null)};
function kwMk(force){const el=$('#mkv');const L=data.filter(fbOn).sort((a,b)=>ak(b)-ak(a)),P=data.filter(p=>!fbOn(p)),sg=JSON.stringify([OWN,L.map(p=>[p.id,p.t,p.fbd,p.last,p.pr,p.dist,p.fbu,p.foto?p.foto.length:0,p.fs]),P.map(p=>[p.id,p.t,p.pr,p.dist,p.fs,p.foto?1:0]),ymd(new Date())]);
 if(!force&&el.__sg===sg)return;el.__sg=sg;const sc=el.scrollTop,dn=L.filter(due).length,nf=L.filter(p=>age(p)==Infinity).length,ok=L.length-dn-nf,nx=L.filter(p=>!due(p)&&age(p)!=Infinity).sort((a,b)=>ak(b)-ak(a))[0],
 card=p=>{const c=cdi(p),a=age(p),st=due(p)?'due':a==Infinity?'nofecha':'ok';return `<article class="mc" data-st="${st}" data-s="${esc(p.t+' '+p.dist)}">${pth(p)}<span class="rg" style="--p:${c.pc};--k:${c.k}"><b>${c.n}</b></span><div class="mcb"><b class="mct">${esc(p.t)}</b><span class="mut">${esc(p.dist)} · ${esc(money(p))}</span><small style="color:${c.k}">${esc(cnt(p))}</small><i class="mcp"><i style="width:${a==Infinity?0:Math.min(100,a/DUE*100)}%;background:${c.k}"></i></i></div><div class="mca"><button class="btn own ${st=='due'?'p':''}" data-rn="${esc(p.id)}">Renové hoy</button><button class="btn" data-vm="${esc(p.id)}">Ver en mapa</button>${p.fbu?`<a class="btn" href="${esc(p.fbu)}" target="_blank" rel="noopener">Abrir anuncio ↗</a>`:''}<button class="btn own" data-edit="${esc(p.id)}" data-focus="fbu">✏️ Editar anuncio</button><button class="btn own" data-arch="${esc(p.id)}">📦 Ya no disponible</button></div></article>`},
 pcard=p=>`<article class="mc pend" data-s="${esc(p.t+' '+p.dist)}">${pth(p)}<div class="mcb"><b class="mct">${esc(p.t)}</b><span class="mut">${esc(p.dist)} · ${esc(money(p))}</span><small class="mut">Aún no está en Marketplace</small></div><div class="mca"><button class="btn p own" data-pub="${esc(p.id)}">Marcar publicada hoy</button><button class="btn own" data-edit="${esc(p.id)}" data-focus="fbu">✏️ Editar</button><button class="btn" data-vm="${esc(p.id)}">Ver en mapa</button><button class="btn own" data-arch="${esc(p.id)}">📦 Ya no disponible</button></div></article>`;
 el.innerHTML=kwHead('Marketplace','Facebook pide renovar cada anuncio al día '+DUE+'. Aquí ves cuáles tocan hoy, renuevas con un clic y detectas qué propiedades aún no se publicaron.','<a class="btn own" href="https://www.facebook.com/marketplace/you/selling" target="_blank" rel="noopener">Mis publicaciones en Facebook ↗</a>')
 +`<div class="vstats">${kwTile(L.length,'Anuncios activos','#cfd6e2')}${kwTile(dn,'Por renovar','var(--acc2)',dn?'Hoy o vencidos':'Todo al día')}${kwTile(ok,'Al día','var(--ok)','Dentro de los '+DUE+' días')}${kwTile(nf,'Sin fecha','var(--mut)',nf?'Pon la fecha en «Editar»':'')}${kwTile(nx?(DUE-age(nx))+' d':'–','Próxima renovación','var(--warn)',nx?esc(nx.t.slice(0,30)):'Nada pendiente')}</div>`
 +`<div class="vbar">${kwChips([['todos','Todos',L.length],['due','Por renovar',dn],['ok','Al día',ok],['nofecha','Sin fecha',nf]],kwMkF,'data-mf')}<input id="mkq" type="search" placeholder="Buscar anuncio o distrito…" autocomplete="off" aria-label="Buscar anuncio" value="${esc(kwMkQ)}"></div>`
 +(L.length?`<div class="vgrid">${L.map(card).join('')}</div><p class="mut vempty" hidden>Ningún anuncio coincide con el filtro.</p>`:'<div class="vnone"><b>Aún no hay anuncios de Marketplace</b><p>Las propiedades marcadas como publicadas en Facebook aparecen aquí con su cuenta de 7 días.</p></div>')
 +(P.length?`<h3 class="vh3">Sin publicar en Marketplace <small>· ${P.length} propiedad${P.length==1?'':'es'}</small></h3><div class="sgrid" style="grid-template-columns:repeat(auto-fill,minmax(440px,1fr))">${P.map(pcard).join('')}</div>`:'');
 el.dataset.f=kwMkF;el.scrollTop=sc;kwQ(el,kwMkQ,'.mc');kwEmpty(el)}
$('#mkv').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const el=$('#mkv');
 if(b.dataset.mf){kwMkF=b.dataset.mf;el.dataset.f=kwMkF;el.querySelectorAll('[data-mf]').forEach(x=>{const o=x.dataset.mf==kwMkF;x.classList.toggle('on',o);x.setAttribute('aria-pressed',o)});kwEmpty(el);return}
 if(b.dataset.vm){kwVm(b.dataset.vm);return}
 if(b.dataset.pub){put(b.dataset.pub,{fb:true,fbd:ymd(new Date())});flash('Marketplace: la cuenta de 7 días empieza hoy');return}
 if(b.dataset.rn){if(!b.classList.contains('ask')){const o=b.textContent;b.classList.add('ask');b.textContent='¿Confirmar?';clearTimeout(b._t);b._t=setTimeout(()=>{b.classList.remove('ask');b.textContent=o},2800);return}
  put(b.dataset.rn,{fbd:ymd(new Date()),last:ymd(new Date())});flash('Anuncio renovado: la cuenta de 7 días vuelve a empezar')}});
$('#mkv').addEventListener('input',e=>{if(e.target.id=='mkq'){kwMkQ=e.target.value;kwQ($('#mkv'),kwMkQ,'.mc');kwEmpty($('#mkv'))}});
function kwSis(force){const el=$('#sisv');const S=[...data.filter(p=>p.sis),...data.filter(p=>!p.sis)],sg=JSON.stringify([OWN,sisOk,S.map(p=>[p.id,p.t,p.pr,p.fbd,p.fb,p.fbu,p.lat,p.foto?p.foto.length:0,p.fs,p.sisu]),ymd(new Date())]);
 if(!force&&el.__sg===sg)return;el.__sg=sg;const sc=el.scrollTop,nFm=S.filter(p=>!fbOn(p)).length,nFu=S.filter(p=>p.lat==null).length,off=sisOk===false,
 ch=(st,t,sub)=>`<span class="ch2 ${st}"><i></i><b>${t}</b><small>${sub}</small></span>`,
 row=p=>{const fm=fbOn(p),ex=p.lat!=null;return `<article class="sr" data-s="${esc(p.t+' '+p.dist)}" data-fm="${fm?0:1}" data-fu="${ex?0:1}">${thHtml(p,1)}<div class="srb"><b class="mct">${esc(p.t)}</b><span class="mut">${esc(p.dist)} · ${esc(money(p))}</span><span class="sbd ${p.op}">${esc(opx(p))}</span></div><div class="src">${ch(fm?(due(p)?'warn':'on'):'off','Marketplace',fm?esc(cdi(p).t):'Falta')}${ch(ex?'on':'off','Ubicación',ex?'Exacta':'Aproximada')}</div><div class="mca"><button class="btn" data-vm="${esc(p.id)}">Ver en mapa</button><button class="btn own" data-edit="${esc(p.id)}">✏️ Editar</button>${p.sisu?`<a class="btn" href="${esc(p.sisu)}" target="_blank" rel="noopener">Abrir ficha ↗</a>`:''}<button class="btn own" data-arch="${esc(p.id)}">📦 Ya no disponible</button></div></article>`};
 el.innerHTML=kwHead('Sistema EI','Todas las propiedades en una sola lista (las del sistema de la inmobiliaria primero) y en qué canales ya están difundidas.','<button class="btn p own" data-sync>Sincronizar ahora</button>')
 +`<div class="vsync ${off?'bad':''}"><i></i><span>${off?'Sin conexión con el sistema':sisOk?'Sistema sincronizado · '+sisOk:'Conectando con el sistema…'}</span><small>· se actualiza solo cada 5 minutos</small></div>`
 +`<div class="vstats">${kwTile(S.length,'Propiedades','#cfd6e2')}${kwTile(S.filter(p=>p.op=='venta').length,'En venta','var(--sale)')}${kwTile(S.filter(p=>p.op!='venta').length,'En alquiler','var(--rent)')}${kwTile(S.length-nFm,'En Marketplace','var(--ok)',nFm?nFm+' por publicar':'Todas publicadas')}${kwTile(S.length-nFu,'Ubicación exacta','var(--info)',nFu?nFu+' aproximadas':'Todas ubicadas')}</div>`
 +(S.length?`<div class="vbar">${kwChips([['todas','Todas',S.length],['fm','Falta Marketplace',nFm],['fu','Ubicación aproximada',nFu]],kwSisF,'data-sf')}<input id="sisq" type="search" placeholder="Buscar propiedad o distrito…" autocomplete="off" aria-label="Buscar propiedad del sistema" value="${esc(kwSisQ)}"></div><div class="sgrid">${S.map(row).join('')}</div><p class="mut vempty" hidden>Ninguna propiedad coincide con el filtro.</p>`
 :`<div class="vnone"><b>Aún no hay propiedades del sistema</b><p>${off?'No hay conexión con el sistema de la inmobiliaria.':'Conectando con el sistema de la inmobiliaria…'}</p></div>`);
 el.dataset.f=kwSisF;el.scrollTop=sc;kwQ(el,kwSisQ,'.sr');kwEmpty(el)}
$('#sisv').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const el=$('#sisv');
 if(b.dataset.sf){kwSisF=b.dataset.sf;el.dataset.f=kwSisF;el.querySelectorAll('[data-sf]').forEach(x=>{const o=x.dataset.sf==kwSisF;x.classList.toggle('on',o);x.setAttribute('aria-pressed',o)});kwEmpty(el);return}
 if(b.dataset.vm){kwVm(b.dataset.vm);return}
 if(b.hasAttribute('data-sync')){b.disabled=true;b.textContent='Sincronizando…';syncSis(1).finally(()=>{b.disabled=false;b.textContent='Sincronizar ahora';kwSis(1)})}});
$('#sisv').addEventListener('input',e=>{if(e.target.id=='sisq'){kwSisQ=e.target.value;kwQ($('#sisv'),kwSisQ,'.sr');kwEmpty($('#sisv'))}});

/* ================= archivadas ================= */
const EST={alquilada:['Alquilada','🔑'],vendida:['Vendida','🏷️'],retirada:['Ya no la tengo','🚫']},archDate=d=>{const x=new Date(d+'T00:00:00');return isNaN(x)?'':x.toLocaleDateString('es-PE',{day:'numeric',month:'short',year:'numeric'})};
function archUI(){const b=$('#arc');b.hidden=!arch.length;b.textContent='Archivadas · '+arch.length}
function archAsk(id){const p=data.find(x=>x.id==id);if(!p)return;$('#ib').innerHTML=`<div class="arq"><div class="arq-h"><h2>¿Qué pasó con esta propiedad?</h2><button class="btn" data-close>Cerrar ✕</button></div><p><b>${esc(p.t)}</b> · ${esc(p.dist)}</p><p class="mut">Se oculta del mapa, la lista, Marketplace y Sistema EI. No se borra: la puedes reactivar desde «Archivadas».</p><div class="arq-o">${Object.entries(EST).map(([k,v])=>`<button class="btn" data-est="${k}" data-eid="${esc(id)}">${v[1]} ${v[0]}</button>`).join('')}</div></div>`;mdl('#im2',1)}
function archDo(id,est){const p=data.find(x=>x.id==id);if(!p||!EST[est])return;if(sel==id)sel=null;arch=[{...p,est,estd:ymd(new Date())},...arch.filter(x=>x.id!=id)];data=data.filter(x=>x.id!=id);svA();sv();draw();mdl('#im2',0);$('#ib').innerHTML='';flash('«'+p.t+'» quedó como «'+EST[est][0].toLowerCase()+'» y se ocultó del panel. La encuentras en «Archivadas».')}
function archList(){const L=arch;$('#ib').innerHTML=`<div class="arq"><div class="arq-h"><h2>Propiedades archivadas <small>· ${L.length}</small></h2><button class="btn" data-close>Cerrar ✕</button></div><p class="mut">No aparecen en ninguna parte del panel. Si una vuelve a estar disponible, reactívala.</p>${L.length?`<div class="arq-l">${L.map(p=>`<article class="arq-i"><div><b>${esc(p.t)}</b><span class="mut"><span class="arq-b ${esc(p.est)}">${esc((EST[p.est]||['Archivada'])[0])}</span>${esc(p.dist||'')}${p.estd?' · '+esc(archDate(p.estd)):''}</span></div><div class="arq-x"><button class="btn p" data-rest="${esc(p.id)}">Reactivar</button><button class="btn" data-delx="${esc(p.id)}">Borrar para siempre</button></div></article>`).join('')}</div>`:'<p class="mut">No hay propiedades archivadas.</p>'}</div>`;mdl('#im2',1)}
$('#arc').onclick=archList;
document.addEventListener('click',e=>{if(!OWN)return;const b=e.target.closest&&e.target.closest('[data-arch]');if(!b)return;e.preventDefault();e.stopPropagation();archAsk(b.dataset.arch)},true);
document.addEventListener('click',e=>{if(!OWN)return;const b=e.target.closest&&e.target.closest('[data-edit]');if(!b)return;e.preventDefault();e.stopPropagation();const p=data.find(x=>x.id==b.dataset.edit);if(!p)return;openF(p);const fo=b.dataset.focus;if(fo)setTimeout(()=>{const i=$('#f [name="'+fo+'"]');if(i){i.focus();i.scrollIntoView({block:'center'})}},60)},true);
$('#ib').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.est){archDo(b.dataset.eid,b.dataset.est);return}
 if(b.dataset.rest){const it=arch.find(x=>x.id==b.dataset.rest);if(!it)return;const{est,estd,...p}=it;arch=arch.filter(x=>x.id!=p.id);data=[...data.filter(x=>x.id!=p.id),p];svA();sv();draw();archList();flash('«'+p.t+'» volvió a tus propiedades');return}
 if(b.dataset.delx){if(!b.classList.contains('ask')){const o=b.textContent;b.classList.add('ask');b.textContent='¿Seguro?';clearTimeout(b._t);b._t=setTimeout(()=>{b.classList.remove('ask');b.textContent=o},3000);return}arch=arch.filter(x=>x.id!=b.dataset.delx);svA();archList();archUI();return}
 if(b.hasAttribute('data-tsave')){const L=(($('#tadd')||{}).value||'').match(/https?:\/\/[^\s,;]+/g)||[],have=new Set(kwB.map(ttKey));let n=0;L.forEach(l=>{const id=vid(l),k=ttKey({id,link:l});if(have.has(k))return;have.add(k);kwB.push({id,link:l,title:'',v:null,l:null,c:null,s:null,g:null});n++});
  ttSave();$('#brd').__sg='';mdl('#im2',0);$('#ib').innerHTML='';draw();flash(n?n+' video'+(n==1?'':'s')+' agregado'+(n==1?'':'s'):'No encontré enlaces nuevos')}});

/* ================= ingreso (usuario y contraseña) ================= */
$('#acc2').onclick=()=>$('#acc').click();
$('#acc').onclick=async()=>{if(!sb)return;if(OWN){await sb.auth.signOut();flash('Sesión cerrada: el panel queda en solo lectura');return}$('#lge').textContent='';mdl('#lg',1);setTimeout(()=>$('#lgf [name=u]').focus(),50)};
$('#lgf').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),u=String(f.get('u')||'').trim(),p=String(f.get('p')||'');if(!u||!p)return;const btn=e.target.querySelector('[type=submit]');btn.disabled=true;$('#lge').textContent='';
 const email=u.includes('@')?u:u.toLowerCase()+'@'+(CF.userDomain||'panel.local');const{error}=await sb.auth.signInWithPassword({email,password:p});btn.disabled=false;
 if(error){$('#lge').textContent=/invalid/i.test(error.message)?'Usuario o contraseña incorrectos.':'No se pudo ingresar: '+error.message;return}e.target.reset();mdl('#lg',0);flash('Listo: ya puedes editar. Los cambios se ven en vivo para todos.')};

/* ================= arranque ================= */
function boot(){ttMigrate();ddv(1);try{kwView(['prop','tt','mk','sis'].includes(localStorage.getItem('kw_v'))?localStorage.getItem('kw_v'):'res',1)}catch(e){kwView('res',1)}
 document.body.classList.toggle('is-owner',OWN);document.body.classList.toggle('ro',!OWN);$('#acc').hidden=!sb;$('#acc2').hidden=!sb;draw();
 const q=new URLSearchParams(location.search);if(q.get('code')&&q.get('state')){try{sessionStorage.setItem('mb_ttcb',JSON.stringify({code:q.get('code'),state:q.get('state')}))}catch(e){}history.replaceState(null,'',location.pathname)}
 else if(q.get('error')&&q.get('state')){setTimeout(()=>flash('TikTok no se conectó: '+(q.get('error_description')||q.get('error'))),400);history.replaceState(null,'',location.pathname)}
 if(!sb){syncSis();return}
 sb.auth.getSession().then(({data:{session}})=>setOwner(!!session));sb.auth.onAuthStateChange((_e,s)=>setOwner(!!s));
 cloudLoad().then(({g,s})=>{synced=s;data=g.prop;arch=g.arch;kwB=g.tt;cloudReady=true;liveState='ok';cacheW();$('#brd').__sg='';drawMap.sg='';draw();syncSis()})
  .catch(e=>{console.warn(e);liveState='off';setLive();syncSis();setTimeout(()=>location.reload(),60000)});
 sb.channel('panel').on('postgres_changes',{event:'*',schema:'public',table:'panel_items'},schedReload).on('postgres_changes',{event:'*',schema:'public',table:'tt_videos'},ttSched).on('postgres_changes',{event:'*',schema:'public',table:'tt_profile'},ttSched).subscribe();
 ttLoad().then(()=>{if(!TT.pf||!TT.pf.synced_at||Date.now()-Date.parse(TT.pf.synced_at)>3e5)ttPing(0)})}
boot();
