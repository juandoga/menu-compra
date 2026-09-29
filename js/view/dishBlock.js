/* VIEW · Cómo se pinta un plato y el nombre de una comida.
   Lo usan las pestañas Hoy y Semana. */

import { el, svg, ICON } from "./dom.js";
import { openDishSheet } from "./sheets/dishSheet.js";

/* nombre de la comida, con «cambiado del martes» si viene de otro día */
export function mealName(meal){
  return el("span",{className:"meal-name",text:meal.name},
    meal.swappedFrom ? el("span",{className:"swap-note",text:"· cambiado del "+meal.swappedFrom}) : null);
}

export function dishBlock(vm,dish){
  const ings=el("ul",{className:"ings"},dish.ingredients.map(i=>
    el("li",{className:"ing"},
      el("span",{className:"q",text:i.qty}),
      el("span",{className:"n"},
        i.name,
        i.optional ? el("span",{className:"opt-mark",text:"opcional"}) : null,
        i.basic ? el("span",{className:"dot",title:"Básico de despensa"}) : null,
        i.hint ? el("span",{className:"h",text:i.hint}) : null))));
  return el("div",{className:"dish"},
    el("div",{className:"dish-head"},
      el("h3",{className:"dish-name",text:dish.name}),
      el("button",{className:"icon-btn",onClick:()=>openDishSheet(vm,dish.ref)},svg(ICON.pencil,"2"),"Editar")),
    ings,
    dish.prep ? el("div",{className:"prep"},svg(ICON.bell,"1.8"),el("span",{text:dish.prep})) : null);
}
