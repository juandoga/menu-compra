/* VIEW · La tarjeta de una comida (comida, cena o libre) con sus platos.
   La usan las pestañas Hoy y Semana. El color lo pone la clase: .meal.comida / .cena / .libre */

import { el, svg, ICON } from "./dom.js";
import { openDishSheet } from "./sheets/dishSheet.js";

const MEAL_ICON={ desayuno:ICON.cup, comida:ICON.sun, cena:ICON.moon, libre:ICON.star };

export function mealCard(vm,meal,{addDish}={}){
  return el("article",{className:"meal "+meal.kind},
    el("div",{className:"meal-head"},
      svg(MEAL_ICON[meal.kind]||ICON.sun,"2"),
      el("span",{className:"meal-label",text:meal.name}),
      meal.swappedFrom ? el("span",{className:"swap-note",text:"· cambiado del "+meal.swappedFrom}) : null),
    meal.dishes.length ? meal.dishes.map(dish=>dishBlock(vm,dish))
                       : el("div",{className:"meal-empty",text:"Sin platos."}),
    addDish ? el("button",{className:"add-dish",text:"+ Añadir plato",onClick:addDish}) : null);
}

function dishBlock(vm,dish){
  /* los detalles entre paréntesis («merluza o rape») van debajo, en una línea aparte */
  const hints=dish.ingredients.filter(i=>i.hint).map(i=>i.name+": "+i.hint);
  return el("div",{className:"dish"},
    el("div",{className:"dish-head"},
      el("h2",{className:"dish-name",text:dish.name}),
      el("button",{className:"edit-btn","aria-label":"Editar "+dish.name,onClick:()=>openDishSheet(vm,dish.ref)},svg(ICON.pencil,"2"))),
    dish.ingredients.length ? el("ul",{className:"ichips"},dish.ingredients.map(i=>
      el("li",{className:"ichip"+(i.optional?" opt":i.basic?" basic":"")},
        i.qty ? el("b",{text:i.qty}) : null,
        i.qty ? " " : null,
        i.name.toLowerCase(),
        i.optional ? " · opcional" : null))) : null,
    hints.length ? el("p",{className:"dish-hints",text:hints.join(" · ")}) : null,
    dish.prep ? el("div",{className:"prep"},svg(ICON.bell,"2"),el("span",{text:"Preparar la víspera: "+dish.prep})) : null);
}
