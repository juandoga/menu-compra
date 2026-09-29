/* VIEW · Pestaña «Compra»: la lista de la semana, ordenada por pasillos. */

import { el, svg, ICON, linkBtn, note, switchBtn, showUndo } from "./dom.js";
import { openIngredientSheet, openAisleSheet, openCloseSheet, openShareSheet } from "./sheets/shopSheets.js";

export function renderCompra(host,vm){
  const d=vm.compra();
  host.textContent="";

  if(!navigator.onLine){
    host.append(el("div",{className:"offline"},svg(ICON.off,"1.7"),el("span",{text:"Sin conexión — la lista sigue aquí"})));
  }
  if(d.autoWeek){
    host.append(note(
      ["Es fin de semana, así que te enseño la compra de la ", el("b",{text:"semana que viene ("+d.autoWeek+")"}), "."],
      linkBtn("Ver la de esta",()=>vm.declineAutoWeek())));
  }

  /* tarjeta de arriba: progreso y ajustes */
  const peopleLabel = d.people===d.basePeople ? "Cantidades para "+d.people+" personas"
                    : "Cantidades para "+d.people+" personas (el menú es para "+d.basePeople+")";
  host.append(el("div",{className:"progress-card"},
    el("div",{className:"progress-top"},
      el("div",{className:"progress-num"},String(d.done),el("span",{text:" de "+d.total+" comprados"})),
      el("button",{className:"linkbtn",text:"Compra hecha",onClick:()=>openCloseSheet(vm)})),
    el("div",{className:"bar"},el("i",{style:{width:d.pct+"%"}})),
    el("div",{className:"switchrow"},
      el("span",{text:"Ocultar básicos de despensa"}),
      switchBtn("Ocultar básicos de despensa",d.hideBasics,()=>vm.toggleHideBasics())),
    el("div",{className:"switchrow"},
      el("span",{text:peopleLabel}),
      el("div",{className:"stepper"},
        el("button",{text:"−","aria-label":"Una persona menos",disabled:d.people<=1,onClick:()=>vm.changePeople(-1)}),
        el("output",{text:String(d.people)}),
        el("button",{text:"+","aria-label":"Una persona más",disabled:d.people>=12,onClick:()=>vm.changePeople(1)}))),
    el("div",{className:"toolrow"},
      el("button",{className:"tool",onClick:()=>openShareSheet(vm)},svg(ICON.share,"1.8"),"Compartir"),
      el("button",{className:"tool",onClick:()=>openAisleSheet(vm)},svg(ICON.sort,"1.8"),"Pasillos"))));

  if(d.empty) host.append(el("div",{className:"empty",text:d.empty}));

  const row=r=>el("div",{className:"row"+(r.checked?" done":"")},
    el("button",{className:"tick","aria-pressed":r.checked?"true":"false",
      "aria-label":(r.checked?"Desmarcar ":"Marcar ")+r.name,onClick:()=>vm.toggleChecked(r.key)},svg(ICON.check,"3")),
    el("button",{className:"row-main","aria-label":"Ver de qué comidas viene "+r.name,onClick:()=>openIngredientSheet(vm,r.key)},
      el("span",{className:"row-text"},
        el("span",{className:"row-name",text:r.name}),
        r.hint ? el("span",{className:"row-hint",text:r.hint}) : null),
      el("span",{className:"row-tags"},
        r.tag ? el("span",{className:"tag "+({"tuyo":"mine","opcional":"opt","básico":"basic"})[r.tag],text:r.tag}) : null),
      el("span",{className:"row-qty",text:r.qty}),
      el("span",{className:"row-chev"},svg(ICON.right,"2.2"))));

  const section=(title,count,rows,extraClass)=>el("section",{className:"sec"+(extraClass||"")},
    el("div",{className:"sec-head"},
      el("span",{className:"sec-title",text:title}),
      el("span",{className:"sec-rule"}),
      el("span",{className:"sec-count",text:count})),
    el("div",{className:"rows"},rows.map(row)));

  d.sections.forEach(s=>host.append(section(s.label, s.done+"/"+s.rows.length, s.rows)));
  if(d.optionals.length) host.append(section("Opcionales","fuera del total",d.optionals," optionals"));

  /* añadir algo que no viene del menú */
  const name=el("input",{className:"field",type:"text",placeholder:"Por ejemplo: papel de cocina"});
  const qty=el("input",{className:"field",type:"number",min:"0",step:"any",inputmode:"decimal",placeholder:"Cant."});
  const unit=el("input",{className:"field",type:"text",placeholder:"g, ml, ud"});
  const add=el("button",{className:"btn",text:"Añadir",onClick:()=>{
    const n=name.value.trim();
    if(!n){ name.focus(); return; }
    const undo=vm.addCustom(n, qty.value.trim() ? parseFloat(qty.value) : null, unit.value.trim());
    showUndo(n.charAt(0).toUpperCase()+n.slice(1)+" añadido a la lista", undo);
  }});
  host.append(el("div",{className:"addbox"},
    el("h3",{text:"Añadir a la lista"}), name, el("div",{className:"addrow"},qty,unit,add)));
}
