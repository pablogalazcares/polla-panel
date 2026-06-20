"use strict";

/* mapa de selecciones: bandera + codigo de 3 letras (generado del modelo) */
const TEAM = {"mexico": {"flag": "🇲🇽", "tri": "MEX"}, "sudafrica": {"flag": "🇿🇦", "tri": "RSA"}, "corea del sur": {"flag": "🇰🇷", "tri": "KOR"}, "republica checa": {"flag": "🇨🇿", "tri": "CZE"}, "suiza": {"flag": "🇨🇭", "tri": "SUI"}, "catar": {"flag": "🇶🇦", "tri": "QAT"}, "canada": {"flag": "🇨🇦", "tri": "CAN"}, "bosnia herzegovina": {"flag": "🇧🇦", "tri": "BIH"}, "estados unidos": {"flag": "🇺🇸", "tri": "USA"}, "turquia": {"flag": "🇹🇷", "tri": "TUR"}, "australia": {"flag": "🇦🇺", "tri": "AUS"}, "paraguay": {"flag": "🇵🇾", "tri": "PAR"}, "escocia": {"flag": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "tri": "SCO"}, "brasil": {"flag": "🇧🇷", "tri": "BRA"}, "marruecos": {"flag": "🇲🇦", "tri": "MAR"}, "haiti": {"flag": "🇭🇹", "tri": "HAI"}, "curazao": {"flag": "🇨🇼", "tri": "CUW"}, "ecuador": {"flag": "🇪🇨", "tri": "ECU"}, "alemania": {"flag": "🇩🇪", "tri": "GER"}, "costa de marfil": {"flag": "🇨🇮", "tri": "CIV"}, "paises bajos": {"flag": "🇳🇱", "tri": "NED"}, "japon": {"flag": "🇯🇵", "tri": "JPN"}, "suecia": {"flag": "🇸🇪", "tri": "SWE"}, "tunez": {"flag": "🇹🇳", "tri": "TUN"}, "uruguay": {"flag": "🇺🇾", "tri": "URU"}, "espana": {"flag": "🇪🇸", "tri": "ESP"}, "cabo verde": {"flag": "🇨🇻", "tri": "CPV"}, "arabia saudita": {"flag": "🇸🇦", "tri": "KSA"}, "belgica": {"flag": "🇧🇪", "tri": "BEL"}, "egipto": {"flag": "🇪🇬", "tri": "EGY"}, "nueva zelanda": {"flag": "🇳🇿", "tri": "NZL"}, "iran": {"flag": "🇮🇷", "tri": "IRN"}, "noruega": {"flag": "🇳🇴", "tri": "NOR"}, "irak": {"flag": "🇮🇶", "tri": "IRQ"}, "senegal": {"flag": "🇸🇳", "tri": "SEN"}, "francia": {"flag": "🇫🇷", "tri": "FRA"}, "argelia": {"flag": "🇩🇿", "tri": "ALG"}, "austria": {"flag": "🇦🇹", "tri": "AUT"}, "argentina": {"flag": "🇦🇷", "tri": "ARG"}, "jordania": {"flag": "🇯🇴", "tri": "JOR"}, "ghana": {"flag": "🇬🇭", "tri": "GHA"}, "inglaterra": {"flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "tri": "ENG"}, "croacia": {"flag": "🇭🇷", "tri": "CRO"}, "panama": {"flag": "🇵🇦", "tri": "PAN"}, "colombia": {"flag": "🇨🇴", "tri": "COL"}, "rd congo": {"flag": "🇨🇩", "tri": "COD"}, "uzbekistan": {"flag": "🇺🇿", "tri": "UZB"}, "portugal": {"flag": "🇵🇹", "tri": "POR"}};

const MES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const $ = (s, r=document) => r.querySelector(s);

function norm(s){ return (s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim(); }
function esc(s){ const d=document.createElement("div"); d.textContent=(s==null?"":String(s)); return d.innerHTML; }
function tinfo(name){ return TEAM[norm(name)] || {flag:"", tri:(name||"?").slice(0,3).toUpperCase()}; }
function flag(name){ return tinfo(name).flag; }
function tri(name){ return tinfo(name).tri; }
function clp(n){ return n==null ? "—" : "$"+Math.round(n).toLocaleString("es-CL"); }

function teamCell(home, away){
  const fh=flag(home), fa=flag(away);
  return `<span class="full">${fh} ${esc(home)} – ${esc(away)} ${fa}</span>`+
         `<span class="abbr">${fh} ${tri(home)} – ${tri(away)} ${fa}</span>`;
}

const KO = {dieciseisavos:"16vos", octavos:"8vos", cuartos:"4tos", semifinal:"Semi", final:"Final", eliminatoria:"Elim"};
const KO_ORDER = ["16vos","8vos","4tos","Semi","Final"];
function phaseShort(f){
  if(!f) return "";
  const low = norm(f);
  for(const k in KO){ if(low.includes(k)) return KO[k]; }
  const mg = low.match(/grupo\s+([a-z0-9]+)/), mj = low.match(/jornada\s+(\d+)/);
  if(mg) return "G"+mg[1].toUpperCase()+(mj?" J"+mj[1]:"");
  return f;
}
function groupOf(f){ const m=norm(f||"").match(/grupo\s+([a-z0-9]+)/); return m?m[1].toUpperCase():null; }
function phaseKey(f){
  const low = norm(f||"");
  const mg = low.match(/grupo\s+([a-z0-9]+)/), mj = low.match(/jornada\s+(\d+)/);
  if(mj) return (mj[1].padStart(2,"0"))+"-"+(mg?mg[1].toUpperCase():"Z");
  const sh = phaseShort(f), i = KO_ORDER.indexOf(sh);
  return i>=0 ? "9"+String(i).padStart(2,"0") : "99"+sh;
}

function parseISO(s){ const t=Date.parse(s||""); return isNaN(t)?null:t; }
function koLabel(iso){
  const m = (iso||"").match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if(!m) return (iso||"").slice(0,16);
  return `${+m[3]} ${MES[+m[2]-1]} ${m[4]}:${m[5]}`;
}
function relTime(iso){ const t=parseISO(iso); if(!t) return ""; let s=Math.max(0,(Date.now()-t)/1000);
  if(s<90) return "hace instantes"; if(s<3600) return "hace "+Math.round(s/60)+" min";
  if(s<86400) return "hace "+Math.round(s/3600)+" h"; return "hace "+Math.round(s/86400)+" d"; }
function countdown(iso){ const t=parseISO(iso); if(!t) return ""; let s=(t-Date.now())/1000;
  if(s<=0) return "en juego"; const d=Math.floor(s/86400); s-=d*86400; const h=Math.floor(s/3600); const m=Math.floor((s-h*3600)/60);
  if(d>0) return `en ${d}d ${h}h`; if(h>0) return `en ${h}h ${m}m`; return `en ${m}m`; }
function signed(x, dec=1){ if(typeof x!=="number") return "·"; const c=x>0?"pos":(x<0?"neg":"zero");
  return `<span class="${c}">${x>=0?"+":""}${x.toFixed(dec)}</span>`; }
function numOr(x, dec, dash="—"){ return typeof x==="number" ? x.toFixed(dec) : dash; }

/* ---------- gráficos SVG (cero dependencias, offline) ---------- */
function spark(vals, w=88, h=24, color="#58a6ff"){
  const v = (vals||[]).filter(x=>typeof x==="number");
  if(v.length<2 || Math.max(...v)===Math.min(...v)) return "";
  const mn=Math.min(...v), mx=Math.max(...v), dx=w/(v.length-1);
  const pts=v.map((y,i)=>`${(i*dx).toFixed(1)},${(h-2-(h-4)*(y-mn)/(mx-mn)).toFixed(1)}`).join(" ");
  return `<svg class="spk" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`+
    `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.6"/></svg>`;
}
function progress(expected, max, captured, color, baseline){
  if(!max) return "";
  const pe=Math.min(100,100*expected/max), pc=Math.min(100,100*(captured||0)/max);
  const mark=typeof baseline==="number"?`<span class="mark" title="tu vara" style="left:${Math.min(100,100*baseline/max).toFixed(1)}%"></span>`:"";
  const tip=`Capturado (real): ${(captured||0).toFixed(0)}\nEsperado (proyección): ${expected.toFixed(0)}`+
    (typeof baseline==="number"?`\nTu vara (pre-torneo): ${baseline.toFixed(0)}`:"")+`\nMáx alcanzable: ${max}`;
  return `<div class="prog"><div class="prog-bar" data-tip="${esc(tip).replace(/"/g,"&quot;")}"><span class="pe" style="width:${pe}%;background:${color}"></span>`+
    `<span class="pc" style="width:${pc}%"></span>${mark}</div>`+
    `<div class="prog-lbl"><span>capturado ${(captured||0).toFixed(0)}</span><span>esperado ${expected.toFixed(0)}</span>`+
    `${typeof baseline==="number"?`<span class="vara">vara ${baseline.toFixed(0)}</span>`:""}<span>máx ${max}</span></div></div>`;
}
function groupBars(groups, color){
  return `<div class="gbars">`+(groups||[]).map(g=>{
    const pe=Math.min(100,100*g.expected/g.max), pc=Math.min(100,100*g.real/g.max);
    const mark=typeof g.baseline==="number"?`<span class="mark" style="left:${Math.min(100,100*g.baseline/g.max).toFixed(1)}%"></span>`:"";
    const tip=`Grupo ${g.group}\nReal acumulado: ${g.real}\nEsperado actual: ${g.expected}`+
      (g.baseline!=null?`\nTu vara (pre-torneo): ${g.baseline}`:"")+`\nMáx alcanzable: ${g.max}`;
    return `<div class="gbar" data-tip="${esc(tip).replace(/"/g,"&quot;")}"><div class="gbar-h"><span class="gl">Grupo ${esc(g.group)}</span>`+
      `<span class="muted">real ${g.real} · esp ${g.expected}${g.baseline!=null?` · vara ${g.baseline}`:""} · máx ${g.max}</span></div>`+
      `<div class="prog-bar"><span class="pe" style="width:${pe}%;background:${esc(color)}"></span>`+
      `<span class="pc" style="width:${pc}%"></span>${mark}</div></div>`;
  }).join("")+`</div>`;
}
function multiLine(series, color, w=320, h=140){
  const rawTs=(series&&series.ts)||[], rawLines=(series&&series.lines)||[];
  // el eje son snapshots de CI (no partidos): deja solo las tomas donde el puntaje cambió.
  // null = participante que aún no entraba -> se trata como 0 (si no, el goteo de altas en la
  // zona inicial en 0 crea muchos puntos "vacíos" que no son cambios reales de standings).
  const keyAt=i=>rawLines.map(l=>l.pts[i]==null?0:l.pts[i]).join("|");
  const keep=[];
  for(let i=0;i<rawTs.length;i++){
    if(i===0 || keyAt(i)!==keyAt(i-1)) keep.push(i);
  }
  const ts=keep.map(i=>rawTs[i]);
  const lines=rawLines.map(l=>({...l, pts:keep.map(i=>l.pts[i])}));
  if(ts.length<2) return "";   // sin evolución aún (1 solo estado)
  let mx=0; lines.forEach(l=>l.pts.forEach(v=>{ if(typeof v==="number"&&v>mx) mx=v; }));
  mx=mx||1; const dx=w/(ts.length-1), pad=4;
  const path=l=>l.pts.map((v,i)=> (typeof v!=="number")?null:`${(i*dx).toFixed(1)},${(h-pad-(h-2*pad)*v/mx).toFixed(1)}`)
    .filter(Boolean).join(" ");
  const others=lines.filter(l=>!l.mine).map(l=>`<polyline points="${path(l)}" fill="none" stroke="#30363d" stroke-width="1.2"/>`).join("");
  const mineLines=lines.filter(l=>l.mine);
  const mine=mineLines.map(l=>`<polyline points="${path(l)}" fill="none" stroke="${color}" stroke-width="2.4"/>`).join("");
  const Y=v=>(h-pad-(h-2*pad)*v/mx).toFixed(1);
  // puntos sobre mi línea (afordancia de hover) + zonas invisibles con el ranking de cada toma
  const dots=mineLines.map(l=>l.pts.map((v,i)=>typeof v==="number"
    ?`<circle cx="${(i*dx).toFixed(1)}" cy="${Y(v)}" r="2" fill="${color}"/>`:"").join("")).join("");
  POS_PTS=[];
  const hits=ts.map((t,i)=>{
    const rows=lines.map(l=>({label:l.label,pts:l.pts[i],mine:l.mine}))
      .filter(r=>typeof r.pts==="number").sort((a,b)=>b.pts-a.pts);
    if(!rows.length){ POS_PTS.push(null); return ""; }
    const myi=rows.findIndex(r=>r.mine);
    POS_PTS.push({i, when:t, mypts:myi>=0?rows[myi].pts:null, mypos:myi>=0?myi+1:null, total:rows.length});
    const tip=koLabel(t)+"\n"+rows.map((r,k)=>`${k+1}. ${r.mine?"★ ":""}${r.label}: ${r.pts}`).join("\n");
    return `<rect x="${(i*dx-dx/2).toFixed(1)}" y="0" width="${dx.toFixed(1)}" height="${h}" fill="transparent" data-i="${i}" data-tip="${esc(tip).replace(/"/g,"&quot;")}"></rect>`;
  }).join("");
  return `<svg class="ml" width="100%" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${others}${mine}${dots}${hits}</svg>`;
}
function trendChart(vals, baseline, color, w=300, h=60){
  const v=(vals||[]).filter(x=>typeof x==="number");
  if(v.length<2) return "";
  const all=v.concat(typeof baseline==="number"?[baseline]:[]);
  const mn=Math.min(...all), mx=Math.max(...all), rng=(mx-mn)||1, pad=5;
  const y=val=>(h-pad-(h-2*pad)*(val-mn)/rng).toFixed(1), dx=w/(v.length-1);
  const pts=v.map((val,i)=>`${(i*dx).toFixed(1)},${y(val)}`).join(" ");
  const base=typeof baseline==="number"
    ? `<line x1="0" y1="${y(baseline)}" x2="${w}" y2="${y(baseline)}" stroke="#8b949e" stroke-width="1" stroke-dasharray="4 3"/>` : "";
  return `<svg class="spk" width="100%" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${base}`+
    `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2"/></svg>`;
}
function trendCum(matches, color, w=300, h=60, big=false){
  // Eje X = partidos (orden de inicio). Línea sólida (color) = puntos REALES acumulados
  // (solo lo ya jugado). Punteada = PROYECCIÓN hacia adelante: real + EP de lo pendiente.
  const ms=(matches||[]).filter(m=>typeof m.ep==="number")
    .slice().sort((a,b)=>((a.kickoff||"")>(b.kickoff||"")?1:(a.kickoff||"")<(b.kickoff||"")?-1:(a.id||0)-(b.id||0)));
  if(ms.length<2) return "";
  let cum=0, lastPlayed=-1; const proj=[], isP=[];
  ms.forEach((m,i)=>{
    const played=m.actual_result!=null && typeof m.points_earned==="number";
    cum += played ? m.points_earned : m.ep;
    proj.push(cum); isP.push(played);
    if(played) lastPlayed=i;
  });
  const mx=Math.max(...proj, 1), pad=big?6:2, n=ms.length, dx=w/(n-1);
  const X=i=>i*dx, Y=v=>h-pad-(h-2*pad)*v/mx;
  const seg=(from,to)=>{ const a=[]; for(let i=from;i<=to;i++) a.push(`${X(i).toFixed(1)},${Y(proj[i]).toFixed(1)}`); return a.join(" "); };
  const real = lastPlayed>=1 ? `<polyline points="${seg(0,lastPlayed)}" fill="none" stroke="${color}" stroke-width="2.2"/>` : "";
  // proyección desde el último jugado (o desde el inicio si no hay nada jugado)
  const fwdFrom = Math.max(0, lastPlayed);
  const fwd = fwdFrom < n-1 ? `<polyline points="${seg(fwdFrom,n-1)}" fill="none" stroke="${color}" stroke-width="1.6" stroke-dasharray="4 3" opacity="0.65"/>` : "";
  let dots="", hits="";
  if(big){
    TREND_PTS=ms.map((m,i)=>({i, cum:proj[i], cumprev:i>0?proj[i-1]:0,
      gain:(isP[i]?m.points_earned:(+m.ep)), played:isP[i],
      lbl:`${tri(m.home)}-${tri(m.away)}`, when:m.kickoff}));
    dots=ms.map((m,i)=>isP[i]?`<circle cx="${X(i).toFixed(1)}" cy="${Y(proj[i]).toFixed(1)}" r="2" fill="${color}"/>`:"").join("");
    hits=ms.map((m,i)=>{
      const t=`${i+1}. ${m.home} vs ${m.away}  (${m.fase||""})\n`+
        (isP[i]?`Jugado: ${m.actual_result} → +${m.points_earned}\nReal acumulado: ${proj[i].toFixed(1)}`
               :`Sin jugar · tu pick ${m.user_pick||"—"} · EP ${(+m.ep).toFixed(2)}\nProyección acumulada: ${proj[i].toFixed(1)}`);
      return `<rect x="${(X(i)-dx/2).toFixed(1)}" y="0" width="${dx.toFixed(1)}" height="${h}" fill="transparent" data-i="${i}" data-tip="${esc(t).replace(/"/g,"&quot;")}"></rect>`;
    }).join("");
  }
  return `<svg class="spk" width="${big?'100%':w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">`+
    `${fwd}${real}${dots}${hits}</svg>`;
}
function standingsList(rows){
  return `<div class="stand">`+rows.map(r=>
    `<div class="st-row${r.mine?" me":""}"><span class="st-pos">${r.pos}º</span>`+
    `<span class="st-lbl">${esc(r.label)}</span><span class="st-pts">${r.pts}</span></div>`).join("")+`</div>`;
}
function barChart(items, color){   // items: [{label, value}] -> barras horizontales (0..max)
  const mx=Math.max(...items.map(i=>i.value), 0.001);
  return `<div class="bars">`+items.map(i=>
    `<div class="bar"><span class="bl">${esc(i.label)}</span>`+
    `<span class="bt"><span style="width:${(100*i.value/mx).toFixed(0)}%;background:${color}"></span></span>`+
    `<span class="bv">${i.value.toFixed(2)}</span></div>`).join("")+`</div>`;
}

/* balance si la polla cerrara HOY: pago según mi posición actual − mi aporte.
   Empates: los jugadores empatados ocupan los puestos [pos .. pos+N-1] y se REPARTEN la suma
   de esos premios (división equitativa), en vez de cobrar cada uno el premio completo. */
function closeBalance(p){
  const mo=p.money, st=p.standing;
  if(!mo || !st || typeof st.position!=="number") return null;
  const stand=p.standings||[]; const mine=stand.find(x=>x.mine);
  const tied = mine ? Math.max(1, stand.filter(x=>x.pts===mine.pts).length) : 1;
  let sum=0;
  for(let k=0;k<tied;k++){ const pr=(mo.prizes||[]).find(x=>x.place===st.position+k);
    if(pr) sum += pr.refund ? (mo.stake||0) : (pr.amount||0); }
  const payout = Math.round(sum/tied);
  const pr0=(mo.prizes||[]).find(x=>x.place===st.position);
  return {position:st.position, payout, net:payout-(mo.stake||0), inMoney:sum>0, refund:!!(pr0&&pr0.refund), tied};
}
function moneyDelta(n){ const c=n>0?"pos":(n<0?"neg":"zero"); const s=n>0?"+":(n<0?"−":""); return `<span class="${c}">${s}${clp(Math.abs(n))}</span>`; }

/* diferencia de puntos con el líder: si voy 1º, ventaja (+) sobre el 2º; si no, distancia (−) al 1º */
function leaderGap(p){
  const st=p.standings||[]; if(!st.length) return null;
  const me=st.find(r=>r.mine); if(!me || typeof me.pts!=="number") return null;
  const others=st.filter(r=>!r.mine && typeof r.pts==="number");
  if(me.pos===1 || !others.some(r=>r.pts>me.pts)){            // lidero (o empato arriba)
    if(!others.length) return {first:true, diff:0};
    return {first:true, diff: me.pts - Math.max(...others.map(r=>r.pts))};
  }
  return {first:false, diff: me.pts - Math.max(...st.map(r=>r.pts))};   // negativo: lo que me falta
}

/* ---------- carga ---------- */
const LS_KEY = "polla:data";
async function loadData(force){
  try{ const r=await fetch("./data/polla.json",{cache:force?"reload":"no-store"});
    if(r.ok){ const d=await r.json(); try{localStorage.setItem(LS_KEY,JSON.stringify(d));}catch(e){} return {d,src:"red"}; }
  }catch(e){}
  if(window.__POLLA__) return {d:window.__POLLA__, src:"bundle"};
  try{ const c=localStorage.getItem(LS_KEY); if(c) return {d:JSON.parse(c), src:"cache"}; }catch(e){}
  return {d:null, src:"none"};
}
function pools(d){ return d && Array.isArray(d.pools) ? d.pools : []; }
function poolById(d, id){ return pools(d).find(p=>p.id===id); }
/* partidos del torneo (union de las pollas, deduplicados; mismos fixtures) */
function allMatches(d){
  const seen={};
  pools(d).forEach(p=>(p.matches||[]).forEach(m=>{
    const k=norm(m.home)+"|"+norm(m.away);   // por equipos (las zonas horarias difieren entre pollas)
    if(!seen[k] || (m.actual_result && !seen[k].actual_result)) seen[k]=m;
  }));
  return Object.values(seen);
}
function nextClose(p){
  const fut=(p.matches||[]).filter(m=>!m.actual_result && parseISO(m.kickoff)>Date.now());
  return fut.length ? fut.reduce((a,b)=>parseISO(a.kickoff)<parseISO(b.kickoff)?a:b).kickoff : null;
}

/* ---------- estado + router ---------- */
let DATA=null, TAB="resumen";
// datos por punto de los gráficos grandes, para la selección de tramo (dos toques).
let TREND_PTS=[], POS_PTS=[];
function route(){
  const m=(location.hash||"").match(/^#\/p\/([^/]+)/);
  const pool=m?poolById(DATA, decodeURIComponent(m[1])):null;
  if(pool) renderDetail(pool); else renderRoot();
}

/* ---------- raíz (hub) ---------- */
function renderRoot(){
  $("#title").textContent="Mis Pollas"; $("#back").hidden=true;
  const ps=pools(DATA), tot=DATA.totals||{};
  const bal=ps.map(closeBalance).filter(Boolean);
  const totNet=bal.reduce((a,b)=>a+b.net,0), todayGross=bal.reduce((a,b)=>a+b.payout,0);
  const maxWin=ps.reduce((a,p)=>{ const pr=((p.money&&p.money.prizes)||[]).find(x=>x.place===1); return a+(pr?(pr.amount||0):0); },0);
  const agg=`<div class="agg"><div><b>${clp(tot.invertido)}</b><span>invertido</span></div>`+
    `<div><b>${clp(tot.pozo)}</b><span>en juego (pozos)</span></div>`+
    `<div><b>${clp(maxWin)}</b><span>máximo a ganar <span class="mini">(1º en todas)</span></span></div>`+
    `<div><b>${clp(todayGross)}</b><span>ganando hoy · neto ${moneyDelta(totNet)}</span></div></div>`;

  const now=Date.now();
  // próximos 5 PARTIDOS (deduplicados por equipos); cada uno despliega la apuesta y EP por polla
  const up5=allMatches(DATA).filter(m=>!m.actual_result && parseISO(m.kickoff)>now)
    .sort((a,b)=>parseISO(a.kickoff)-parseISO(b.kickoff)).slice(0,5);
  const nextHtml = up5.length ? up5.map(m=>{
    const key=norm(m.home)+"|"+norm(m.away);
    const per=ps.map(p=>{ const mm=(p.matches||[]).find(x=>norm(x.home)+"|"+norm(x.away)===key);
      return mm?{name:p.name,color:p.color,pick:mm.user_pick,ep:mm.ep}:null; }).filter(Boolean);
    const distinct=[...new Set(per.map(x=>x.pick||"—"))];
    const head=distinct.length>1?`<span class="pick varia">varía ▾</span>`:`<span class="pick">${esc(distinct[0]||"—")} ▾</span>`;
    const det=per.map(x=>`<div class="pp"><span class="dot" style="background:${esc(x.color)}"></span>`+
      `<span class="pp-name">${esc(x.name)}</span><span class="pp-pick">${esc(x.pick||"—")}</span>`+
      `<span class="pp-ep">EP ${numOr(x.ep,2,"—")}</span></div>`).join("");
    return `<div class="nx exp"><div class="nx-h"><span class="who"><span class="chip">${esc(phaseShort(m.fase))}</span>${teamCell(m.home,m.away)}</span>`+
      `${head}<span class="cd" data-cd="${esc(m.kickoff)}">${countdown(m.kickoff)}</span></div>`+
      `<div class="pp-list">${det}</div></div>`;
  }).join("") : `<div class="nx muted">Sin partidos próximos.</div>`;

  const cards=ps.map(p=>{
    const t=p.totals||{}, pt=p.points||{}, mo=p.money||{}, er=p.expected_return, cb=closeBalance(p);
    const players=(p.standing&&p.standing.total_players)||mo.players;
    const stand=p.standing?`<span class="badge">${p.standing.position}º/${p.standing.total_players}</span>`
      :(players?`<span class="badge ghost">${players} jug.</span>`:"");
    const sp=trendCum(p.matches, p.color, 80, 22, false);
    const pct=pt.expected_pct!=null?`${pt.expected_pct}%`:"—";
    return `<a class="pool" href="#/p/${encodeURIComponent(p.id)}" style="--pc:${esc(p.color)}">`+
      `<div class="pool-h"><span class="pool-name">${esc(p.name)}</span>${stand}</div>`+
      `<div class="pool-kpis">`+
        `<div><b>${numOr(t.pts_real,0,"0")}</b><span>pts</span></div>`+
        `<div><b>${numOr(t.proj_final,0,"—")}</b><span>proy</span></div>`+
        `<div><b>${pct}</b><span>de máx ${pt.max||"—"}</span></div>`+
        `<div class="sp">${sp}</div>`+
      `</div>`+
      `<div class="pool-f">`+
        `<span class="muted">${mo.stake?clp(mo.stake):""}${mo.pot?(" · pozo "+clp(mo.pot)):""}</span>`+
        `${(p.bonuses&&p.bonuses.length)?`<span class="badge ghost">+${pt.bonus_max} bonus</span>`:""}`+
        `${cb?`<span class="hoy">hoy ${moneyDelta(cb.net)}</span>`:""}`+
        `<span class="cd" data-cd="${esc(nextClose(p)||"")}">${nextClose(p)?("próx. "+countdown(nextClose(p))):""}</span>`+
      `</div></a>`;
  }).join("");

  // En vivo (en juego ahora) y Últimos resultados — nivel torneo (reciclado de P3)
  const tm=allMatches(DATA);
  const LIVE_MS=135*60*1000;   // ventana de juego: 90' + entretiempo + adición
  const inWindow=m=>{ const t=parseISO(m.kickoff); return t && now>=t && now<=t+LIVE_MS; };
  // "final" = resultado OFICIAL, o provisorio ya fuera de la ventana de juego. Un marcador
  // provisorio (en vivo) DENTRO de la ventana NO finaliza el partido: sigue "En vivo".
  const isFinal=m=>m.actual_result && (!m.provisional || !inWindow(m));
  const live=tm.filter(m=>inWindow(m) && !isFinal(m)).sort((a,b)=>parseISO(a.kickoff)-parseISO(b.kickoff));
  const recent=tm.filter(isFinal).sort((a,b)=>parseISO(b.kickoff)-parseISO(a.kickoff)).slice(0,6);
  const liveHtml = live.length ? `<section><h2>En vivo</h2><p class="cap">Marcador en juego y los puntos que llevas con ese resultado en cada polla.</p><div class="next">`+live.map(m=>{
    const key=norm(m.home)+"|"+norm(m.away);
    const per=ps.map(p=>{ const mm=(p.matches||[]).find(x=>norm(x.home)+"|"+norm(x.away)===key);
      return mm?{name:p.name,color:p.color,pick:mm.user_pick,ep:mm.ep,lp:mm.live_points,lr:mm.live_result,lc:mm.live_clock}:null; }).filter(Boolean);
    const lr=(per.find(x=>x.lr)||{}).lr, lc=(per.find(x=>x.lc)||{}).lc;   // marcador/minuto (igual en todas)
    const det=per.map(x=>`<div class="pp"><span class="dot" style="background:${esc(x.color)}"></span>`+
      `<span class="pp-name">${esc(x.name)}</span><span class="pp-pick">${esc(x.pick||"—")}</span>`+
      (typeof x.lp==="number"
        ? `<span class="pp-pe">${"+"+x.lp+" pts"}</span>`
        : `<span class="pp-ep">EP ${numOr(x.ep,2,"—")}</span>`)+`</div>`).join("");
    const head = lr
      ? `<span class="score b live">${esc(lr)}${lc?` <span class="cd live">${esc(lc)}</span>`:""} ▾</span>`
      : `<span class="cd live">en juego ▾</span>`;
    return `<div class="nx exp live"><div class="nx-h"><span class="who"><span class="chip">${esc(phaseShort(m.fase))}</span>${teamCell(m.home,m.away)}</span>`+
      head+`</div><div class="pp-list">${det}</div></div>`;
  }).join("")+`</div></section>` : "";
  const recentHtml = recent.length ? `<section><h2>Últimos resultados</h2><p class="cap">Toca un resultado para ver tus puntos esperados y ganados en cada polla. "pend." = esa polla aún no liquida el partido en su fuente.</p><div class="next">`+recent.map(m=>{
    const key=norm(m.home)+"|"+norm(m.away);
    // todas las pollas que tienen el partido (no solo las que ya lo liquidaron): el EP se conoce
    // siempre; los puntos quedan "pend." en las pollas cuya fuente aún no marcó el resultado.
    const per=ps.map(p=>{ const mm=(p.matches||[]).find(x=>norm(x.home)+"|"+norm(x.away)===key);
      return mm?{name:p.name,color:p.color,pick:mm.user_pick,ep:mm.ep,pe:mm.points_earned,done:!!mm.actual_result}:null; }).filter(Boolean);
    const det=per.map(x=>{ const d=(typeof x.pe==="number"&&typeof x.ep==="number")?x.pe-x.ep:null;
      return `<div class="pp"><span class="dot" style="background:${esc(x.color)}"></span>`+
      `<span class="pp-name">${esc(x.name)}</span><span class="pp-pick">${esc(x.pick||"—")}</span>`+
      `<span class="pp-ep">EP ${numOr(x.ep,2,"—")}</span>`+
      `<span class="pp-pe">${typeof x.pe==="number"?("+"+x.pe+" pts"):(x.done?"·":"pend.")}</span>`+
      `<span class="pp-d">${d!=null?signed(d,1):""}</span></div>`; }).join("");
    return `<div class="nx exp"><div class="nx-h"><span class="who"><span class="chip">${esc(phaseShort(m.fase))}</span>${teamCell(m.home,m.away)}</span>`+
      `<span class="score b">${esc(m.actual_result)}${m.provisional?'<span class="prov">*</span>':''} ▾</span>`+
      `<span class="cd muted">${relTime(m.kickoff)}</span></div>`+
      `<div class="pp-list">${det}</div></div>`;
  }).join("")+`</div></section>` : "";

  $("#view").innerHTML = agg+ liveHtml+
    `<section><h2>Próximos partidos</h2><p class="cap">Toca un partido para ver tu apuesta y los puntos esperados en cada polla.</p><div class="next">${nextHtml}</div></section>`+
    `<section><h2>Mis pollas</h2><div class="pools">${cards}</div></section>`+ recentHtml;
  $("#view").querySelectorAll(".nx.exp .nx-h").forEach(h=>h.addEventListener("click",()=>h.parentElement.classList.toggle("open")));
  tickCountdowns();
}

/* ---------- detalle (dashboard con pestañas) ---------- */
function renderDetail(p){
  $("#title").textContent=p.name; $("#back").hidden=false;
  const t=p.totals||{}, pt=p.points||{};
  const kpis=[
    ["Mis puntos", numOr(t.pts_real,0,"0"), `${t.n_played||0}/${t.n_total||0} jugados`],
    ["Proyección", numOr(t.proj_final,0,"—"), pt.max?`de máx ${pt.max}`:""],
    ["% esperado", pt.expected_pct!=null?pt.expected_pct+"%":"—", "esperado/máx"],
  ];
  if(p.standing) kpis.push(["Posición", `${p.standing.position}º`, `de ${p.standing.total_players}`]);
  const gap=leaderGap(p);
  if(gap) kpis.push([gap.first?"Ventaja sobre 2º":"Diferencia con 1º",
    signed(gap.diff,0), gap.first?"vas liderando":"para alcanzar al líder"]);
  const heroHtml=kpis.map(([l,v,s])=>`<div class="kpi"><div class="v">${v}</div><div class="l">${esc(l)}</div><div class="s">${esc(s)}</div></div>`).join("");

  const tabs=["resumen","apuestas",
    ...(p.standings&&p.standings.length?["posiciones"]:[]),
    ...(p.bonuses&&p.bonuses.length?["bonus"]:[]),
    ...(p.changes&&p.changes.length?["cambios"]:[])];
  const tabBar=`<div class="tabs">`+tabs.map(tb=>
    `<button class="tab${tb===TAB?" on":""}" data-tab="${tb}">${tb[0].toUpperCase()+tb.slice(1)}</button>`).join("")+`</div>`;

  $("#view").innerHTML=`<section class="kpis">${heroHtml}</section>`+
    `<p class="cap">Puntaje: ${esc(p.scoring_label||"")}</p>`+
    tabBar+`<div id="tabbody"></div>`;
  $("#view").querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{ TAB=b.dataset.tab; renderDetail(p); }));
  if(!tabs.includes(TAB)) TAB="resumen";
  renderTab(p);
  tickCountdowns();
}

function moneyBlock(p){
  const mo=p.money, er=p.expected_return;
  if(!mo) return "";
  const prizes=(mo.prizes||[]).map(pr=>{
    const v=pr.refund?`devolución (${clp(mo.stake)})`:clp(pr.amount);
    return `<span class="pz"><b>${pr.place}º</b> ${v}</span>`;
  }).join("");
  const evLine = er ? `<div class="er">Retorno esperado base: <b>${signed(er.ev,0)}</b> `+
    `<span class="muted">(${esc(er.basis)})</span>`+
    (er.breakeven_pwin!=null?` · break-even P(ganar) ≥ <b>${(er.breakeven_pwin*100).toFixed(0)}%</b>`:"")+
    `<div class="muted hint">El edge del modelo es el upside sobre esta base.</div></div>` : "";
  const cb=closeBalance(p);
  const hoyLine = cb ? `<div class="mrow hoy-row"><span>Si cierra hoy (${cb.position}º${cb.tied>1?`, empate ${cb.tied}`:""})</span>`+
    `<b>${cb.inMoney?(cb.refund?`devolución ${clp(cb.payout)}`:clp(cb.payout))+(cb.tied>1?" (repartido)":""):"fuera de premios"} · neto ${moneyDelta(cb.net)}</b></div>` : "";
  return `<section class="money"><h2>💰 Dinero</h2><div class="mcard">`+
    `<div class="mrow"><span>Mi aporte</span><b>${clp(mo.stake)}</b></div>`+
    `<div class="mrow"><span>Pozo</span><b>${clp(mo.pot)}${mo.players?` · ${mo.players} jug.`:""}</b></div>`+
    `<div class="prizes">${prizes}</div>${hoyLine}${evLine}</div></section>`;
}

function renderTab(p){
  const body=$("#tabbody"); const t=p.totals||{}, pt=p.points||{};
  if(TAB==="resumen"){
    const base=p.baseline&&typeof p.baseline.proj==="number"?p.baseline.proj:null;
    const bonusPot=(p.bonuses&&p.bonuses.length)?`<div class="stat"><b>+${pt.bonus_max}</b><span>bonus en juego</span></div>`:"";
    const liveStat=pt.provisional_n?`<div class="stat live"><b>${pt.live}</b><span>en vivo (prov.)</span></div>`:"";
    // redondea cada término como la barra (esperado/vara) para que el stat sea consistente
    const dv=(base!=null)?(Math.round(t.proj_final)-Math.round(base)):null;
    const vara=(dv!=null)?`<div class="stat vara ${dv>0?"up":dv<0?"down":""}"><b>${dv>=0?"+":"−"}${Math.abs(dv)}</b><span>vs tu vara</span></div>`:"";
    body.innerHTML = moneyBlock(p)+
      `<section><h2>Rendimiento</h2>${progress(pt.expected||0, pt.max||0, pt.captured||0, p.color, base)}`+
      `<div class="stats"><div class="stat"><b>${pt.expected_pct!=null?pt.expected_pct+"%":"—"}</b><span>esperado/máx</span></div>`+
      `<div class="stat"><b>${pt.max||"—"}</b><span>máx (fase actual)</span></div>${vara}${liveStat}${bonusPot}</div></section>`+
      ((p.groups&&p.groups.length)?`<section><h2>Por grupo</h2><p class="cap">Por grupo: <b>real</b> acumulado · <b>esperado</b> actual · marca = <b>tu vara</b> (esperado pre-torneo) · barra completa = <b>máx</b> alcanzable.</p>${groupBars(p.groups,p.color)}</section>`:"")+
      ((p.matches&&p.matches.length>=2)?`<section><h2>Tendencia</h2><div class="bigspark">${trendCum(p.matches,p.color,300,120,true)}</div><div class="rangesum" data-empty>Toca dos puntos del gráfico para marcar un tramo (cómo te fue).</div><p class="cap">Eje = partidos (orden de inicio). Línea ${esc("sólida")} = <b>puntos reales acumulados</b> (lo ya jugado) · punteada = <b>proyección</b> hacia adelante (real + EP de lo pendiente). Pasa el cursor por cada punto para ver el detalle.</p></section>`:"");
  } else if(TAB==="apuestas"){
    const hasProv=(p.matches||[]).some(m=>m.provisional);
    body.innerHTML=`<p class="cap">Toca un encabezado para ordenar.${hasProv?' <span class="prov">*</span> resultado provisorio (ESPN, antes de que la polla lo confirme).':''}</p><div class="tbl"><table id="bets" class="sortable"></table></div>`;
    buildBets(p);
  } else if(TAB==="posiciones"){
    const ml=multiLine(p.leaderboard_series, p.color);
    body.innerHTML =
      (ml?`<section><h2>Evolución de puntos</h2><div class="bigspark">${ml}</div>`+
          `<div class="rangesum" data-empty>Toca dos puntos del gráfico para marcar un tramo (cómo te fue).</div>`+
          `<p class="cap">Cada línea es un participante; la tuya resaltada en color.</p></section>`
         :`<p class="cap">La evolución aparecerá cuando se jueguen partidos (hoy todos en 0).</p>`)+
      `<section><h2>Tabla de posiciones</h2>${standingsList(p.standings)}</section>`;
  } else if(TAB==="bonus"){
    body.innerHTML=`<div class="bonus">`+(p.bonuses||[]).map(b=>
      `<div class="bo"><span class="bl">${esc(b.label)}${b.prob!=null?` · <span class="bprob">${Math.round(b.prob*100)}%</span>`:""}</span>`+
      `<span class="bp">${flag(b.pick)} ${esc(b.pick||"—")}</span>`+
      `<span class="bpts">${b.points!=null?("+"+b.points):""}</span></div>`).join("")+`</div>`+
      `<p class="cap">El % es la probabilidad del modelo de que ese equipo logre ese puesto (Monte Carlo del bracket). Goleador/jugadores no tienen modelo.</p>`;
  } else if(TAB==="cambios"){
    body.innerHTML=`<div id="changes" class="changes"></div>`; renderChanges(p);
  }
  // selección de tramo (dos toques) en los gráficos grandes; nunca debe tumbar el render
  try{
    if(TAB==="resumen") wireRange($("#tabbody .bigspark"), TREND_PTS, "trend", p.color);
    else if(TAB==="posiciones") wireRange($("#tabbody .bigspark"), POS_PTS, "pos", p.color);
  }catch(e){ console.warn("rango: no se pudo enganchar", e); }
}

/* ---------- selección de tramo en gráficos (dos toques: inicio / fin) ---------- */
function fmtDay(iso){ const t=parseISO(iso); if(!t) return ""; const d=new Date(t); return d.getDate()+" "+MES[d.getMonth()]; }
function rsSigned(x){ const r=Math.round(x*10)/10; const s=r>0?"+":(r<0?"−":""); return s+Math.abs(r); }

function trendSummary(a,b){
  const A=TREND_PTS[a], B=TREND_PTS[b]; if(!A||!B) return "tramo";
  const delta=B.cum-A.cumprev;                       // puntos del tramo a..b (real + EP de lo pendiente)
  const span=TREND_PTS.slice(a,b+1), played=span.filter(p=>p.played);
  let best=null, worst=null;
  played.forEach(p=>{ if(!best||p.gain>best.gain) best=p; if(!worst||p.gain<worst.gain) worst=p; });
  const npend=span.length-played.length;
  const head=`<b>Partidos ${a+1}→${b+1}</b> · ${rsSigned(delta)} pts`+(npend?` <span class="rs-mut">(${npend} proyectados)</span>`:"");
  const extra=played.length?`<div class="rs-x">mejor ${best.lbl} +${best.gain} · peor ${worst.lbl} ${worst.gain>0?"+":""}${worst.gain}</div>`:"";
  return `<div class="rs-h">${head}</div>${extra}`;
}
function posSummary(a,b){
  const A=POS_PTS[a], B=POS_PTS[b]; if(!A||!B) return "tramo";
  const dpos=(A.mypos!=null&&B.mypos!=null)?(A.mypos-B.mypos):null;   // + = subiste (mejor puesto)
  const dpts=(A.mypts!=null&&B.mypts!=null)?(B.mypts-A.mypts):null;
  const mov=dpos==null?"":(dpos>0?`subiste ${dpos} puesto${dpos>1?"s":""}`:dpos<0?`bajaste ${-dpos} puesto${-dpos>1?"s":""}`:"sin cambio de puesto");
  const head=`<b>${fmtDay(A.when)} → ${fmtDay(B.when)}</b>`+(B.mypos!=null?` · ahora P${B.mypos}/${B.total}`:"");
  const det=[mov, dpts!=null?`${rsSigned(dpts)} pts`:""].filter(Boolean).join(" · ");
  return `<div class="rs-h">${head}</div>${det?`<div class="rs-x">${det}</div>`:""}`;
}

function wireRange(spark, points, kind, color){
  if(!spark) return;
  const svg=spark.querySelector("svg"), sum=spark.parentElement.querySelector(".rangesum");
  if(!svg || !sum || !svg.querySelector("rect[data-i]")) return;
  const SVGNS="http://www.w3.org/2000/svg";
  const H=(+(svg.getAttribute("viewBox")||"0 0 300 120").split(/\s+/)[3])||120;
  let sel={a:null,b:null};
  const rectOf=i=>svg.querySelector('rect[data-i="'+i+'"]');
  const clean=()=>svg.querySelectorAll(".selband,.seledge").forEach(e=>e.remove());
  function edge(i){ const r=rectOf(i); if(!r) return;
    const x=+r.getAttribute("x")+ +r.getAttribute("width")/2;
    const ln=document.createElementNS(SVGNS,"line");
    ln.setAttribute("class","seledge"); ln.setAttribute("x1",x); ln.setAttribute("x2",x);
    ln.setAttribute("y1",0); ln.setAttribute("y2",H); ln.setAttribute("stroke",color);
    svg.appendChild(ln);
  }
  function reset(){ sel={a:null,b:null}; clean();
    sum.setAttribute("data-empty",""); sum.textContent="Toca dos puntos del gráfico para marcar un tramo (cómo te fue)."; }
  function band(a,b){ clean();
    const ra=rectOf(a), rb=rectOf(b); if(!ra||!rb) return;
    const xa=+ra.getAttribute("x"), xb=+rb.getAttribute("x")+ +rb.getAttribute("width");
    const r=document.createElementNS(SVGNS,"rect"); r.setAttribute("class","selband");
    r.setAttribute("x",Math.min(xa,xb)); r.setAttribute("y",0);
    r.setAttribute("width",Math.abs(xb-xa)||1); r.setAttribute("height",H); r.setAttribute("fill",color);
    svg.insertBefore(r, svg.firstChild);   // detrás de las líneas (para que sigan visibles)
  }
  function show(a,b){ if(a>b){ const t=a; a=b; b=t; }
    band(a,b); sum.removeAttribute("data-empty");
    sum.innerHTML=(kind==="trend"?trendSummary(a,b):posSummary(a,b))+`<button class="rs-clear" type="button">limpiar</button>`;
    sum.querySelector(".rs-clear").addEventListener("click",ev=>{ ev.stopPropagation(); reset(); });
  }
  spark.addEventListener("click",e=>{
    const r=e.target.closest&&e.target.closest("rect[data-i]"); if(!r) return;
    const i=+r.getAttribute("data-i");
    if(sel.a===null || sel.b!==null){ sel={a:i,b:null}; clean(); edge(i);
      sum.removeAttribute("data-empty"); sum.textContent="Inicio marcado — toca el otro extremo."; }
    else { sel.b=i; show(sel.a,sel.b); }
  });
}

/* ---------- tabla de apuestas ---------- */
let betsRows=[], sortState={i:null,dir:1};
function buildBets(p){
  const cols=[["Fase","text"],["Partido","text"],["Mi marc.","text"],["Real","text"],["Pts esp.","num"],["Pts real","num"],["Δ","num"],["Cierre","text"]];
  betsRows=(p.matches||[]).map(m=>{
    const played=!!m.actual_result, ep=typeof m.ep==="number"?m.ep:null;
    const pe=(played&&typeof m.points_earned==="number")?m.points_earned:null;
    const diff=(pe!=null&&ep!=null)?pe-ep:null;
    const realTxt = m.actual_result ? (esc(m.actual_result)+(m.provisional?'<span class="prov">*</span>':'')) : "·";
    return {played, prov:!!m.provisional, cells:[
      {h:`<span class="ph">${esc(phaseShort(m.fase))}</span>`, s:phaseKey(m.fase), cls:"ph"},
      {h:teamCell(m.home,m.away), s:norm(m.home), cls:"match"},
      {h:esc(m.user_pick||"—"), s:m.user_pick||"", cls:"c b"},
      {h:realTxt, s:m.actual_result||"", cls:"c"},
      {h:numOr(ep,2,"—"), s:ep==null?-1:ep, cls:"c"},
      {h:played?numOr(pe,0,"·"):"·", s:pe==null?-1:pe, cls:"c b"},
      {h:diff!=null?signed(diff,1):"·", s:diff==null?-999:diff, cls:"c"},
      {h:`<span class="ko">${esc(koLabel(m.kickoff))}</span>`, s:m.kickoff||"", cls:"ko"},
    ]};
  });
  const thead=`<thead><tr>${cols.map(([l,tp],i)=>`<th data-i="${i}" data-type="${tp}" class="${i>=4&&i<=6?'c':''}">${esc(l)}</th>`).join("")}</tr></thead>`;
  const table=$("#bets"); table.innerHTML=thead+`<tbody></tbody>`;
  table.querySelectorAll("thead th").forEach(th=>th.addEventListener("click",()=>sortBets(parseInt(th.dataset.i,10),th)));
  sortState={i:null,dir:1}; paintBets();
}
function paintBets(){ const tb=$("#bets tbody"); if(!tb) return;
  tb.innerHTML=betsRows.map(r=>`<tr class="${r.played?"played":""}${r.prov?" prov-row":""}">`+r.cells.map(c=>`<td class="${c.cls}">${c.h}</td>`).join("")+`</tr>`).join(""); }
function sortBets(i, th){
  const dir=(sortState.i===i&&sortState.dir===1)?-1:1; sortState={i,dir};
  document.querySelectorAll("#bets thead th").forEach(x=>x.classList.remove("asc","desc"));
  th.classList.add(dir===1?"asc":"desc"); const num=th.dataset.type==="num";
  betsRows.sort((a,b)=>{ let x=a.cells[i].s,y=b.cells[i].s; if(num){x=parseFloat(x);y=parseFloat(y);}else{x=String(x).toLowerCase();y=String(y).toLowerCase();} return x<y?-dir:(x>y?dir:0); });
  paintBets();
}
function renderChanges(p){
  const cs=(p.changes||[]).slice(0,60), el=$("#changes"); if(!el) return;
  if(!cs.length){ el.innerHTML=`<div class="cg muted">Sin cambios registrados.</div>`; return; }
  el.innerHTML=cs.map(c=>{
    const ep=(typeof c.ep_from==="number"&&typeof c.ep_to==="number")?`<span class="ep">${c.ep_from.toFixed(2)} → ${c.ep_to.toFixed(2)} pts</span>`:(typeof c.ep_to==="number"?`<span class="ep">${c.ep_to.toFixed(2)} pts</span>`:"");
    return `<div class="cg"><div class="row1"><span class="chip">${esc(phaseShort(c.phase))}</span>${teamCell(c.home,c.away)}`+
      `<span class="score">&nbsp;${esc(c.from||"—")} <span class="arrow">→</span> <span class="to">${esc(c.to)}</span></span>${ep}</div>`+
      `<div class="reason">${esc(c.reason||"")}</div><div class="when">${esc(relTime(c.ts))}</div></div>`;
  }).join("");
  el.querySelectorAll(".cg").forEach(d=>d.addEventListener("click",()=>d.classList.toggle("open")));
}

function tickCountdowns(){ document.querySelectorAll("[data-cd]").forEach(el=>{ const v=el.dataset.cd; if(!v) return;
  const pre=el.textContent.startsWith("próx.")?"próx. ":""; el.textContent=pre+countdown(v); }); }
function setStatus(msg, isErr){ const s=$("#status"); if(!msg){s.hidden=true;return;} s.hidden=false; s.textContent=msg; s.classList.toggle("err",!!isErr); }

async function refresh(force){
  $("#view").setAttribute("aria-busy","true");
  const {d,src}=await loadData(force);
  if(!d){ setStatus("No pude cargar los datos. Sírvelo con: python3 -m http.server", true); $("#updated").textContent="sin datos"; $("#view").setAttribute("aria-busy","false"); return; }
  DATA=d; setStatus(src==="cache"?"Mostrando última copia guardada (sin conexión).":"", false);
  // built_at = cuándo se regeneró el panel (incluye la capa provisoria ESPN) = frescura real.
  // updated_at puede ir atrasado si el scrape oficial de la polla falla. "· en vivo" si hay prov.
  const liveNow=(d.pools||[]).some(p=>(p.points||{}).provisional_n);
  $("#updated").textContent="actualizado "+relTime(d.built_at||d.updated_at)+(liveNow?" · en vivo":"");
  route(); $("#view").setAttribute("aria-busy","false");
}

// Tooltip flotante para los graficos (mouse + touch via Pointer Events).
const TIP=(()=>{ const el=document.createElement("div"); el.className="tip"; el.style.display="none"; document.body.appendChild(el); return el; })();
function showTip(text,x,y){
  TIP.textContent=text; TIP.style.display="block";
  const w=TIP.offsetWidth,h=TIP.offsetHeight,m=10;
  TIP.style.left=Math.min(window.innerWidth-w-6,Math.max(6,x-w/2))+"px";
  TIP.style.top=((y-h-m)<6?(y+m+14):(y-h-m))+"px";
}
function hideTip(){ TIP.style.display="none"; }
function tipFrom(e){ const t=e.target.closest&&e.target.closest("[data-tip]");
  if(t){ showTip(t.getAttribute("data-tip"),e.clientX,e.clientY); return true; } return false; }
document.addEventListener("pointermove",e=>{ if(!tipFrom(e)) hideTip(); },{passive:true});
document.addEventListener("pointerdown",e=>{ tipFrom(e); },{passive:true});
document.addEventListener("pointerup",()=>setTimeout(hideTip,1800),{passive:true});
window.addEventListener("scroll",hideTip,{passive:true});

$("#refresh").addEventListener("click",()=>refresh(true));
$("#back").addEventListener("click",()=>{ TAB="resumen"; if(history.length>1) history.back(); else location.hash="#/"; });
window.addEventListener("hashchange",()=>{ if(DATA) route(); });
setInterval(tickCountdowns, 60000);
refresh(false);
if("serviceWorker" in navigator && location.protocol.startsWith("http")){ navigator.serviceWorker.register("sw.js").catch(()=>{}); }
