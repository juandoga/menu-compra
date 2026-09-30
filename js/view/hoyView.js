/* VIEW · Pestaña «Hoy». Sólo pinta lo que le da el ViewModel (vm.hoy())
   y pasa los toques de los botones al ViewModel. */

import { el, svg, ICON, linkBtn, pick4, note } from "./dom.js";
import { mealCard } from "./dishBlock.js";
import { openSwapSheet, openWeekSheet } from "./sheets/weekSheets.js";
import { backupNote } from "./sheets/dataSheet.js";

export function renderHoy(host,vm){
  const d=vm.hoy();
  host.textContent="";

  /* tira con los 7 días: los pasados apagados, hoy en tomate. Tocar uno lleva a ese día en Semana */
  host.append(el("div",{className:"strip"},d.strip.map(s=>el("button",{
      className:(s.isToday?"today":"")+(s.past?" past":"")+(s.weekend && !s.isToday?" wknd":""),
      "aria-label":s.name+" "+s.date+(s.isToday?", hoy":""),
      "aria-current":s.isToday?"date":null,
      onClick:()=>vm.goToDay(s.idx)},
    el("span",{className:"ini",text:s.ini}),
    el("span",{className:"num",text:String(s.date)})))));

  host.append(el("div",{className:"hero"},
    el("h1",{text:d.dayName}),
    el("p",{text:d.dateLabel+(d.askWeek ? "" : " · semana "+(vm.week+1)+" del menú")})));

  /* primera vez: qué semana toca */
  if(d.askWeek){
    host.append(el("div",{className:"note"},
      el("span",{style:{flexBasis:"100%"}},
        el("span",{className:"note-q",text:"¿Qué semana del menú toca esta semana?"}),
        "Dímelo una vez y la app llevará la cuenta sola cada lunes."),
      pick4(null,w=>vm.setCurrentWeek(w))));
  }else if(d.browsingOther){
    host.append(note(
      ["Estás mirando la ", el("b",{text:"semana "+d.browsingOther.week}), ". Esta semana toca la "+d.browsingOther.current+"."],
      linkBtn("Volver",()=>vm.backToCurrentWeek())));
  }

  const bn=backupNote(vm);
  if(bn) host.append(bn);

  /* lo que hay que preparar hoy para mañana */
  d.warnings.forEach(w=>host.append(el("div",{className:"remind"},
    el("span",{className:"remind-ico"},svg(ICON.bell,"2")),
    el("span",{style:{minWidth:"0"}},
      el("span",{className:"remind-k",text:"Para mañana"}),
      el("span",{className:"remind-v"},w.prep," ",el("small",{text:"· "+w.dish}))))));

  /* un desayuno vacío no ocupa sitio en Hoy (se añade desde Semana) */
  d.meals.filter(m=>!(m.kind==="desayuno" && !m.dishes.length)).forEach(meal=>host.append(mealCard(vm,meal)));

  const swap=linkBtn("",()=>openSwapSheet(vm,vm.todayIdx));
  swap.textContent="";
  swap.append(svg(ICON.swap,"2"),"¿No te apetece? Cámbialo");
  host.append(el("div",{className:"foot-links"},
    swap,
    d.canChangeWeek ? linkBtn("Cambiar la semana en curso",()=>openWeekSheet(vm)) : null));
}
