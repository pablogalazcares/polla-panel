"use strict";

/* mapa de selecciones: bandera + codigo de 3 letras (generado del modelo) */
const TEAM = {"mexico": {"flag": "🇲🇽", "tri": "MEX"}, "sudafrica": {"flag": "🇿🇦", "tri": "RSA"}, "corea del sur": {"flag": "🇰🇷", "tri": "KOR"}, "republica checa": {"flag": "🇨🇿", "tri": "CZE"}, "suiza": {"flag": "🇨🇭", "tri": "SUI"}, "catar": {"flag": "🇶🇦", "tri": "QAT"}, "canada": {"flag": "🇨🇦", "tri": "CAN"}, "bosnia herzegovina": {"flag": "🇧🇦", "tri": "BIH"}, "estados unidos": {"flag": "🇺🇸", "tri": "USA"}, "turquia": {"flag": "🇹🇷", "tri": "TUR"}, "australia": {"flag": "🇦🇺", "tri": "AUS"}, "paraguay": {"flag": "🇵🇾", "tri": "PAR"}, "escocia": {"flag": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "tri": "SCO"}, "brasil": {"flag": "🇧🇷", "tri": "BRA"}, "marruecos": {"flag": "🇲🇦", "tri": "MAR"}, "haiti": {"flag": "🇭🇹", "tri": "HAI"}, "curazao": {"flag": "🇨🇼", "tri": "CUW"}, "ecuador": {"flag": "🇪🇨", "tri": "ECU"}, "alemania": {"flag": "🇩🇪", "tri": "GER"}, "costa de marfil": {"flag": "🇨🇮", "tri": "CIV"}, "paises bajos": {"flag": "🇳🇱", "tri": "NED"}, "japon": {"flag": "🇯🇵", "tri": "JPN"}, "suecia": {"flag": "🇸🇪", "tri": "SWE"}, "tunez": {"flag": "🇹🇳", "tri": "TUN"}, "uruguay": {"flag": "🇺🇾", "tri": "URU"}, "espana": {"flag": "🇪🇸", "tri": "ESP"}, "cabo verde": {"flag": "🇨🇻", "tri": "CPV"}, "arabia saudita": {"flag": "🇸🇦", "tri": "KSA"}, "belgica": {"flag": "🇧🇪", "tri": "BEL"}, "egipto": {"flag": "🇪🇬", "tri": "EGY"}, "nueva zelanda": {"flag": "🇳🇿", "tri": "NZL"}, "iran": {"flag": "🇮🇷", "tri": "IRN"}, "noruega": {"flag": "🇳🇴", "tri": "NOR"}, "irak": {"flag": "🇮🇶", "tri": "IRQ"}, "senegal": {"flag": "🇸🇳", "tri": "SEN"}, "francia": {"flag": "🇫🇷", "tri": "FRA"}, "argelia": {"flag": "🇩🇿", "tri": "ALG"}, "austria": {"flag": "🇦🇹", "tri": "AUT"}, "argentina": {"flag": "🇦🇷", "tri": "ARG"}, "jordania": {"flag": "🇯🇴", "tri": "JOR"}, "ghana": {"flag": "🇬🇭", "tri": "GHA"}, "inglaterra": {"flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "tri": "ENG"}, "croacia": {"flag": "🇭🇷", "tri": "CRO"}, "panama": {"flag": "🇵🇦", "tri": "PAN"}, "colombia": {"flag": "🇨🇴", "tri": "COL"}, "rd congo": {"flag": "🇨🇩", "tri": "COD"}, "uzbekistan": {"flag": "🇺🇿", "tri": "UZB"}, "portugal": {"flag": "🇵🇹", "tri": "POR"}};

const MES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const $ = (s, r=document) => r.querySelector(s);

function norm(s){ return (s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9 ]/g," ").trim(); }
function esc(s){ const d=document.createElement("div"); d.textContent=(s==null?"":String(s)); return d.innerHTML; }
function tinfo(name){ return TEAM[norm(name)] || {flag:"", tri:(name||"?").slice(0,3).toUpperCase()}; }
function flag(name){ return tinfo(name).flag; }
function tri(name){ return tinfo(name).tri; }

function teamCell(home, away){
  const fh=flag(home), fa=flag(away);
  const full = `${fh} ${esc(home)} – ${esc(away)} ${fa}`.trim();
  const ab = `${fh} ${tri(home)} – ${tri(away)} ${fa}`.trim();
  return `<span class="full">${full}</span><span class="abbr">${ab}</span>`;
}

/* fase: 'Grupo A · Jornada 3' -> 'GA J3'; 'Octavos' -> '8vos' */
const KO = {dieciseisavos:"16vos", octavos:"8vos", cuartos:"4tos", semifinal:"Semi", final:"Final", eliminatoria:"Elim"};
const KO_ORDER = ["16vos","8vos","4tos","Semi","Final"];
function phaseShort(f){
  if(!f) return "";
  const low = norm(f);
  if(KO[low]) return KO[low];
  const mg = low.match(/grupo\s+([a-z0-9]+)/), mj = low.match(/jornada\s+(\d+)/);
  if(mg) return "G"+mg[1].toUpperCase()+(mj?" J"+mj[1]:"");
  return f;
}
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
function relTime(iso){
  const t = parseISO(iso); if(!t) return "";
  let s = Math.max(0, (Date.now()-t)/1000);
  if(s<90) return "hace instantes";
  if(s<3600) return "hace "+Math.round(s/60)+" min";
  if(s<86400) return "hace "+Math.round(s/3600)+" h";
  return "hace "+Math.round(s/86400)+" d";
}
function countdown(iso){
  const t = parseISO(iso); if(!t) return "";
  let s = (t-Date.now())/1000;
  if(s<=0) return "en juego";
  const d=Math.floor(s/86400); s-=d*86400;
  const h=Math.floor(s/3600); const m=Math.floor((s-h*3600)/60);
  if(d>0) return `en ${d}d ${h}h`;
  if(h>0) return `en ${h}h ${m}m`;
  return `en ${m}m`;
}
function signed(x, dec=1){
  if(typeof x!=="number") return "·";
  const c = x>0?"pos":(x<0?"neg":"zero");
  return `<span class="${c}">${x>=0?"+":""}${x.toFixed(dec)}</span>`;
}
function numOr(x, dec, dash="—"){ return typeof x==="number" ? x.toFixed(dec) : dash; }

/* ---------- carga de datos ---------- */
const LS_KEY = "polla:data";
async function loadData(force){
  try{
    const r = await fetch("./data/polla.json", {cache: force ? "reload" : "no-store"});
    if(r.ok){ const d = await r.json(); try{ localStorage.setItem(LS_KEY, JSON.stringify(d)); }catch(e){} return {d, src:"red"}; }
  }catch(e){ /* file:// u offline */ }
  if(window.__POLLA__) return {d: window.__POLLA__, src:"bundle"};
  try{ const c = localStorage.getItem(LS_KEY); if(c) return {d: JSON.parse(c), src:"cache"}; }catch(e){}
  return {d:null, src:"none"};
}

/* ---------- render ---------- */
function renderHero(d){
  const t = d.totals||{};
  const cards = [
    ["Mis puntos", numOr(t.pts_real,0,"0"), `${t.n_played||0}/${t.n_total||0} jugados`],
    ["Proyección al cierre", numOr(t.proj_final,0,"—"), "reales + esperados"],
    ["Δ vs esperado", signed(typeof t.diff==="number"?t.diff:0,1), "en lo ya jugado"],
  ];
  if(d.ranking && d.ranking.length){
    const me = d.ranking.findIndex(r=>r.me) ;
    if(me>=0) cards.push(["Mi posición", `${me+1}º`, `de ${d.ranking.length}`]);
  }
  $("#hero").innerHTML = cards.map(([l,v,s])=>
    `<div class="kpi"><div class="v">${v}</div><div class="l">${esc(l)}</div><div class="s">${esc(s)}</div></div>`
  ).join("");
}

function renderNext(d){
  const now = Date.now(), H48 = 48*3600*1000;
  const up = (d.matches||[]).filter(m=>{
    if(m.actual_result) return false;
    const t = parseISO(m.kickoff); return t && t-now>0 && t-now<=H48;
  }).sort((a,b)=>parseISO(a.kickoff)-parseISO(b.kickoff));
  const wrap = $("#next-wrap"); wrap.hidden = false;
  if(!up.length){ $("#next").innerHTML = `<div class="nx muted">Sin cierres en las próximas 48 h.</div>`; return; }
  $("#next").innerHTML = up.map(m=>
    `<div class="nx"><span class="who"><span class="chip">${esc(phaseShort(m.fase))}</span>${teamCell(m.home,m.away)}</span>`+
    `<span class="pick">${esc(m.user_pick||"—")}</span><span class="cd" data-cd="${esc(m.kickoff)}">${countdown(m.kickoff)}</span></div>`
  ).join("");
}

let betsRows = [];
function renderBets(d){
  const wrap = $("#bets-wrap"); wrap.hidden = false;
  const cols = [
    ["Fase","text"],["Partido","text"],["Mi marc.","text"],["Real","text"],
    ["Pts esp.","num"],["Pts real","num"],["Δ","num"],["Cierre","text"]
  ];
  betsRows = (d.matches||[]).map(m=>{
    const played = !!m.actual_result;
    const ep = typeof m.ep==="number" ? m.ep : null;
    const pe = (played && typeof m.points_earned==="number") ? m.points_earned : null;
    const diff = (pe!=null && ep!=null) ? pe-ep : null;
    return {
      played,
      cells: [
        {h:`<span class="ph">${esc(phaseShort(m.fase))}</span>`, s:phaseKey(m.fase), cls:"ph"},
        {h:teamCell(m.home,m.away), s:norm(m.home), cls:"match"},
        {h:esc(m.user_pick||"—"), s:m.user_pick||"", cls:"c b"},
        {h:esc(m.actual_result||"·"), s:m.actual_result||"", cls:"c"},
        {h:numOr(ep,2,"—"), s:ep==null?-1:ep, cls:"c"},
        {h:played?numOr(pe,0,"·"):"·", s:pe==null?-1:pe, cls:"c b"},
        {h:diff!=null?signed(diff,1):"·", s:diff==null?-999:diff, cls:"c"},
        {h:`<span class="ko">${esc(koLabel(m.kickoff))}</span>`, s:m.kickoff||"", cls:"ko"},
      ]
    };
  });
  const thead = `<thead><tr>${cols.map(([l,t],i)=>`<th data-i="${i}" data-type="${t}" class="${i>=4&&i<=6?'c':''}">${esc(l)}</th>`).join("")}</tr></thead>`;
  const table = $("#bets");
  table.innerHTML = thead + `<tbody></tbody>`;
  table.querySelectorAll("thead th").forEach(th=>{
    th.addEventListener("click", ()=>sortBets(parseInt(th.dataset.i,10), th));
  });
  paintBets();
}
function paintBets(){
  const tb = $("#bets tbody");
  tb.innerHTML = betsRows.map(r=>
    `<tr class="${r.played?"played":""}">`+
    r.cells.map(c=>`<td class="${c.cls}">${c.h}</td>`).join("")+`</tr>`
  ).join("");
}
let sortState = {i:null, dir:1};
function sortBets(i, th){
  const dir = (sortState.i===i && sortState.dir===1) ? -1 : 1;
  sortState = {i, dir};
  document.querySelectorAll("#bets thead th").forEach(x=>x.classList.remove("asc","desc"));
  th.classList.add(dir===1?"asc":"desc");
  const num = th.dataset.type==="num";
  betsRows.sort((a,b)=>{
    let x=a.cells[i].s, y=b.cells[i].s;
    if(num){ x=parseFloat(x); y=parseFloat(y); } else { x=String(x).toLowerCase(); y=String(y).toLowerCase(); }
    return x<y?-dir:(x>y?dir:0);
  });
  try{ localStorage.setItem("polla:sort", JSON.stringify(sortState)); }catch(e){}
  paintBets();
}

function renderChanges(d){
  const wrap = $("#changes-wrap"); wrap.hidden = false;
  const cs = (d.changes||[]).slice(0, 60);
  if(!cs.length){ $("#changes").innerHTML = `<div class="cg muted">Sin cambios registrados.</div>`; return; }
  $("#changes").innerHTML = cs.map(c=>{
    const ep = (typeof c.ep_from==="number" && typeof c.ep_to==="number")
      ? `<span class="ep">${c.ep_from.toFixed(2)} → ${c.ep_to.toFixed(2)} pts</span>`
      : (typeof c.ep_to==="number" ? `<span class="ep">${c.ep_to.toFixed(2)} pts</span>` : "");
    return `<div class="cg"><div class="row1">`+
      `<span class="chip">${esc(phaseShort(c.phase))}</span>${teamCell(c.home,c.away)}`+
      `<span class="score">&nbsp;${esc(c.from||"—")} <span class="arrow">→</span> <span class="to">${esc(c.to)}</span></span>${ep}</div>`+
      `<div class="reason">${esc(c.reason||"")}</div>`+
      `<div class="when">${esc(relTime(c.ts))}</div></div>`;
  }).join("");
  $("#changes").querySelectorAll(".cg").forEach(el=>el.addEventListener("click", ()=>el.classList.toggle("open")));
}

function tickCountdowns(){
  document.querySelectorAll("[data-cd]").forEach(el=>{ el.textContent = countdown(el.dataset.cd); });
}

function setStatus(msg, isErr){
  const s = $("#status");
  if(!msg){ s.hidden=true; return; }
  s.hidden=false; s.textContent=msg; s.classList.toggle("err", !!isErr);
}

async function refresh(force){
  $("#app").setAttribute("aria-busy","true");
  const {d, src} = await loadData(force);
  if(!d){
    setStatus("No pude cargar los datos. Si abres el archivo local directamente, sírvelo con: python3 -m http.server", true);
    $("#updated").textContent = "sin datos";
    $("#app").setAttribute("aria-busy","false");
    return;
  }
  setStatus(src==="cache" ? "Mostrando última copia guardada (sin conexión)." : "", false);
  $("#updated").textContent = "actualizado " + relTime(d.updated_at);
  renderHero(d); renderNext(d); renderBets(d); renderChanges(d);
  // restaurar orden guardado
  try{
    const ss = JSON.parse(localStorage.getItem("polla:sort")||"null");
    if(ss && ss.i!=null){ const th=document.querySelector(`#bets thead th[data-i="${ss.i}"]`); if(th){ sortState={i:ss.i,dir:-ss.dir}; sortBets(ss.i, th); } }
  }catch(e){}
  tickCountdowns();
  $("#app").setAttribute("aria-busy","false");
}

$("#refresh").addEventListener("click", ()=>refresh(true));
setInterval(tickCountdowns, 60000);
refresh(false);

/* PWA: offline del shell (solo http/https; en file:// se omite) */
if("serviceWorker" in navigator && location.protocol.startsWith("http")){
  navigator.serviceWorker.register("sw.js").catch(()=>{});
}
