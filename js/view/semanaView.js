/* VIEW · Pestaña «Semana»: los 7 días plegables del menú. */

import { el, svg, ICON, linkBtn } from "./dom.js";
import { mealName, dishBlock } from "./dishBlock.js";
import { openSwapSheet } from "./sheets/weekSheets.js";
import { openSearchSheet } from "./sheets/searchSheet.js";
import { openDishSheet } from "./sheets/dishSheet.js";

export function renderSemana(host,vm){
  host.textContent="";
  host.append(el("button",{className:"searchbar",onClick:()=>openSearchSheet(vm)},
    svg(ICON.search,"1.8"), el("span",{style:{flex:"1"},text:"Buscar un plato en las 4 semanas"})));

  vm.semana().forEach(day=>{
    const art=el("article",{className:"day"+(day.open?" open":"")+(day.weekend?" wknd":"")});

    const head=el("button",{className:"day-head","aria-expanded":day.open?"true":"false"},
      el("span",{className:"chip",text:day.ini}),
      el("span",{className:"day-meta"},
        el("span",{className:"day-name"},day.name, day.isToday ? el("span",{className:"today-tag",text:"hoy"}) : null),
        el("span",{className:"sum"},day.summary.flatMap(s=>[
          el("span",{className:"sum-k",text:s.meal}),
          el("span",{className:"sum-v",text:s.text})]))),
      el("span",{className:"chev"},svg(ICON.chev,"2")));
    /* abrir y cerrar el día no repinta nada: sólo se anima */
    head.addEventListener("click",()=>{
      vm.toggleDay(day.idx);
      const open=art.classList.toggle("open");
      head.setAttribute("aria-expanded",open?"true":"false");
    });

    const pad=el("div",{className:"day-body-pad"});
    day.meals.forEach(meal=>{
      pad.append(el("div",{className:"meal"},
        el("div",{className:"meal-head"},mealName(meal),el("span",{className:"meal-rule"})),
        meal.dishes.map(dish=>dishBlock(vm,dish)),
        el("button",{className:"add-dish",text:"+ Añadir plato a "+meal.name.toLowerCase(),
          onClick:()=>openDishSheet(vm,vm.addDish(meal.ref,day.idx))})));
    });
    pad.append(el("div",{className:"foot-links",style:{margin:"10px 0 0"}},
      linkBtn("Cambiar con otro día",()=>openSwapSheet(vm,day.idx))));

    art.append(head, el("div",{className:"day-body"},el("div",{className:"day-body-in"},pad)));
    host.append(art);
  });
}
