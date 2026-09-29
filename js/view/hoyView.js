/* VIEW · Pestaña «Hoy». Sólo pinta lo que le da el ViewModel (vm.hoy())
   y pasa los toques de los botones al ViewModel. */

import { el, svg, ICON, linkBtn, pick4, note } from "./dom.js";
import { mealName, dishBlock } from "./dishBlock.js";
import { openSwapSheet, openWeekSheet } from "./sheets/weekSheets.js";
import { backupNote } from "./sheets/dataSheet.js";

export function renderHoy(host,vm){
  const d=vm.hoy();
  host.textContent="";

  /* primera vez: qué semana toca */
  if(d.askWeek){
    const n=el("div",{className:"note"},
      el("span",{style:{flexBasis:"100%"}},
        el("span",{className:"note-q",text:"¿Qué semana del menú toca esta semana?"}),
        "Dímelo una vez y la app llevará la cuenta sola cada lunes."),
      pick4(null,w=>vm.setCurrentWeek(w)));
    host.append(n);
  }else if(d.browsingOther){
    host.append(note(
      ["Estás mirando la ", el("b",{text:"semana "+d.browsingOther.week}), ". Esta semana toca la "+d.browsingOther.current+"."],
      linkBtn("Volver",()=>vm.backToCurrentWeek())));
  }

  const bn=backupNote(vm);
  if(bn) host.append(bn);

  /* lo que hay que preparar hoy para mañana */
  if(d.warnings.length){
    host.append(el("div",{className:"banner"},
      svg(ICON.bell,"1.8"),
      el("div",{style:{minWidth:"0"}},
        el("div",{className:"banner-k",text:"Para mañana"}),
        d.warnings.map(w=>el("div",{className:"banner-v"},el("em",{text:w.prep})," — "+w.dish)))));
  }

  d.meals.forEach(meal=>{
    host.append(el("div",{className:"mealcard"+(d.weekend?" wknd":"")},
      mealName(meal),
      el("div",{className:"dishes"},
        meal.dishes.length ? meal.dishes.map(dish=>dishBlock(vm,dish))
                           : el("div",{className:"empty",text:"Sin platos.",style:{padding:"10px 0"}}))));
  });

  host.append(el("div",{className:"foot-links"},
    linkBtn("¿No te apetece? Cambiar con otro día",()=>openSwapSheet(vm,vm.todayIdx)),
    d.canChangeWeek ? linkBtn("Cambiar la semana en curso",()=>openWeekSheet(vm)) : null));
}
