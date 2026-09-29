/* PUNTO DE ARRANQUE · Conecta las tres partes:
   crea el ViewModel, le dice a la View que se repinte cada vez que algo cambie,
   y engancha lo que es de la «carcasa» de la app: pestañas, semanas, tema y modo sin conexión. */

import { createAppViewModel } from "./viewmodel/appViewModel.js";
import { el, showSnack } from "./view/dom.js";
import { renderHoy } from "./view/hoyView.js";
import { renderSemana } from "./view/semanaView.js";
import { renderCompra } from "./view/compraView.js";
import { openDataSheet } from "./view/sheets/dataSheet.js";
import { openWeekPicker } from "./view/sheets/weekSheets.js";

const vm=createAppViewModel();

const $=id=>document.getElementById(id);
const views={
  hoy:   {section:$("viewHoy"),    tab:$("tabHoy"),    render:renderHoy},
  semana:{section:$("viewSemana"), tab:$("tabSemana"), render:renderSemana},
  shop:  {section:$("viewShop"),   tab:$("tabShop"),   render:renderCompra}
};

/* ---------- pintar ---------- */
let lastView=null;
function render(){
  /* pastilla de la cabecera: qué semana miras (barra roja) y cuál toca (barra gris) */
  const pill=$("weekPill");
  pill.textContent="";
  const bars=el("span",{className:"bars","aria-hidden":"true"});
  vm.weekButtons().forEach(b=>{
    const i=el("i");
    if(b.selected) i.classList.add("on");
    if(b.now) i.classList.add("now");
    bars.append(i);
  });
  pill.append(el("span",{text:"Semana "+(vm.week+1)}),bars);
  pill.setAttribute("aria-label","Semana "+(vm.week+1)+(vm.week===vm.curWeek?", la de esta semana":"")+". Elegir otra");
  $("dataBtn").classList.toggle("nudge", !!vm.backupReminder());

  /* pestaña activa */
  for(const k in views){
    const v=views[k], on=k===vm.view;
    v.section.hidden=!on;
    v.tab.setAttribute("aria-selected",on?"true":"false");
  }
  views[vm.view].render(views[vm.view].section,vm);
  if(lastView!==vm.view){ window.scrollTo(0,0); lastView=vm.view; }
}
vm.subscribe(render);

/* ---------- carcasa ---------- */
for(const k in views) views[k].tab.addEventListener("click",()=>vm.setView(k));
$("dataBtn").addEventListener("click",()=>openDataSheet(vm));
$("weekPill").addEventListener("click",()=>openWeekPicker(vm));

/* tema claro / oscuro */
const saved=vm.theme();
if(saved==="dark"||saved==="light") document.documentElement.setAttribute("data-theme",saved);
$("themeBtn").addEventListener("click",()=>{
  const cur=document.documentElement.getAttribute("data-theme");
  const isDark = cur ? cur==="dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  const next = isDark ? "light" : "dark";
  document.documentElement.setAttribute("data-theme",next);
  vm.setTheme(next);
});

/* con o sin conexión cambia el aviso de la lista */
window.addEventListener("online", ()=>{ if(vm.view==="shop") render(); });
window.addEventListener("offline",()=>{ if(vm.view==="shop") render(); });

/* si la app se queda abierta en segundo plano y cambia el día, ponerse al día al volver */
const checkDate=()=>{ if(!document.hidden) vm.checkDate(); };
document.addEventListener("visibilitychange",checkDate);
window.addEventListener("focus",checkDate);
setInterval(checkDate,60000);

/* ---------- modo sin conexión y aviso de versión nueva ---------- */
let updateShown=false;
function showUpdate(){
  if(updateShown) return;
  updateShown=true;
  showSnack("Hay una versión nueva de Menuse","Recargar",()=>location.reload(),0);
}
if("serviceWorker" in navigator && location.protocol==="https:"){
  const hadController=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("message",e=>{ if(e.data && e.data.type==="update") showUpdate(); });
  navigator.serviceWorker.addEventListener("controllerchange",()=>{ if(hadController) showUpdate(); });
  window.addEventListener("load",()=>{
    navigator.serviceWorker.register("sw.js").catch(()=>{});
    navigator.serviceWorker.ready.then(r=>{ if(r.active) r.active.postMessage({type:"hello"}); }).catch(()=>{});
  });
}

vm.setView("hoy");
