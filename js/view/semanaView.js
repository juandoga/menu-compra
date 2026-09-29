/* VIEW · Pestaña «Semana»: elegir semana (01–04) y los 7 días plegables. */

import { el, svg, ICON, linkBtn } from "./dom.js";
import { mealCard } from "./dishBlock.js";
import { openSwapSheet } from "./sheets/weekSheets.js";
import { openSearchSheet } from "./sheets/searchSheet.js";
import { openDishSheet } from "./sheets/dishSheet.js";

export function renderSemana(host,vm){
  host.textContent="";

  host.append(el("div",{className:"vhead"},
    el("h1",{text:"Semana"}),
    el("button",{className:"ibtn","aria-label":"Buscar un plato en las 4 semanas",onClick:()=>openSearchSheet(vm)},svg(ICON.search,"2"))));

  host.append(el("div",{className:"wsel",role:"group","aria-label":"Elegir semana"},vm.weekButtons().map(b=>
    el("button",{"aria-pressed":b.selected?"true":"false",
      "aria-label":"Semana "+b.n+(b.now?", la de esta semana":""),onClick:()=>vm.selectWeek(b.w)},
      el("span",{className:"wn",text:"0"+b.n}),
      b.now ? el("span",{className:"wnow",text:"ahora"}) : null))));

  const range=vm.weekRange();
  host.append(el("div",{className:"legend"},
    el("span",null,el("i",{className:"sw"}),"Comida"),
    el("span",null,el("i",{className:"sw cena"}),"Cena"),
    range ? el("span",{className:"range",text:range}) : null));

  const list=el("div",{className:"days"});
  vm.semana().forEach(day=>{
    const art=el("article",{className:"day"+(day.open?" open":"")+(day.weekend?" wknd":"")+(day.isToday?" today":"")+(day.past?" past":"")});

    const head=el("button",{className:"day-head","aria-expanded":day.open?"true":"false"},
      el("span",{className:"dletter"},
        el("b",{text:day.ini}),
        el("small",{text: day.isToday ? "HOY" : (day.date!=null ? String(day.date) : "")})),
      el("span",{className:"dsum"},
        day.summary.map(s=>el("span",{className:"dline"},el("i",{className:"sw "+s.kind,"aria-hidden":"true"}),
          el("span",{text:s.text,"aria-label":s.meal+": "+s.text}))),
        day.hasPrep ? el("span",{className:"dprep"},svg(ICON.bell,"2.2"),"Tiene preparación previa") : null),
      el("span",{className:"chev"},svg(ICON.chev,"2")));
    /* abrir y cerrar el día no repinta nada: sólo se anima */
    head.addEventListener("click",()=>{
      vm.toggleDay(day.idx);
      const open=art.classList.toggle("open");
      head.setAttribute("aria-expanded",open?"true":"false");
    });

    const swap=linkBtn("",()=>openSwapSheet(vm,day.idx));
    swap.textContent="";
    swap.append(svg(ICON.swap,"2"),"Cambiar con otro día");
    const pad=el("div",{className:"day-body-pad"},
      day.meals.map(meal=>mealCard(vm,meal,{addDish:()=>openDishSheet(vm,vm.addDish(meal.ref,day.idx))})),
      el("div",{className:"foot-links"},swap));

    art.append(head, el("div",{className:"day-body"},el("div",{className:"day-body-in"},pad)));
    list.append(art);
  });
  host.append(list);
}
