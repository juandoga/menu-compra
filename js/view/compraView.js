/* VIEW · Pestaña «Compra»: la lista de la semana, ordenada por pasillos. */

import { el, svg, ICON, linkBtn, note, switchBtn, showUndo } from "./dom.js";
import { openIngredientSheet, openAisleSheet, openCloseSheet, openShareSheet } from "./sheets/shopSheets.js";

export function renderCompra(host,vm){
  const d=vm.compra();
  host.textContent="";

  host.append(el("div",{className:"vhead"},
    el("h1",{text:"Compra"}),
    el("button",{className:"ibtn","aria-label":"Ocultar lo ya comprado","aria-pressed":d.hideDone?"true":"false",
      onClick:()=>vm.toggleHideDone()},svg(d.hideDone?ICON.eyeOff:ICON.eye,"2")),
    el("button",{className:"ibtn","aria-label":"Compartir la lista",onClick:()=>openShareSheet(vm)},svg(ICON.share,"2")),
    el("button",{className:"ibtn","aria-label":"Orden de los pasillos",onClick:()=>openAisleSheet(vm)},svg(ICON.sort,"2"))));

  if(!navigator.onLine){
    host.append(el("div",{className:"offline"},svg(ICON.off,"1.8"),el("span",{text:"Sin conexión — la lista sigue aquí"})));
  }
  if(d.autoWeek){
    host.append(note(
      ["Es fin de semana, así que te enseño la compra de la ", el("b",{text:"semana que viene ("+d.autoWeek+")"}), "."],
      linkBtn("Ver la de esta",()=>vm.declineAutoWeek())));
  }

  /* tarjeta fuerte: cuánto llevas, personas y ajustes */
  const left=d.total-d.done;
  host.append(el("div",{className:"pcard"},
    el("div",{className:"ptop"},
      el("div",{className:"pnum"},el("b",{text:String(d.done)}),el("span",{text:"/ "+d.total})),
      el("div",{className:"pside"},
        el("b",{text:"Semana "+(vm.week+1)}),
        el("span",{text: left ? "quedan "+left : "¡todo comprado!"}))),
    el("div",{className:"pbar"},el("i",{style:{width:d.pct+"%"}})),
    el("div",{className:"prow"},
      el("span",{text:"Cantidades para"}),
      el("div",{className:"stepper"},
        el("button",{text:"−","aria-label":"Una persona menos",disabled:d.people<=1,onClick:()=>vm.changePeople(-1)}),
        el("output",{text:d.people+(d.people===1?" persona":" personas")}),
        el("button",{className:"plus",text:"+","aria-label":"Una persona más",disabled:d.people>=12,onClick:()=>vm.changePeople(1)}))),
    el("div",{className:"prow"},
      el("span",{text:"Ocultar básicos de despensa"}),
      switchBtn("Ocultar básicos de despensa",d.hideBasics,()=>vm.toggleHideBasics())),
    el("button",{className:"pdone",text:"Compra hecha",onClick:()=>openCloseSheet(vm)})));

  /* filtro por pasillo */
  if(d.filters.length>2){
    host.append(el("div",{className:"afilter",role:"group","aria-label":"Filtrar por pasillo"},d.filters.map(f=>
      el("button",{"aria-pressed":f.selected?"true":"false",onClick:()=>vm.setAisle(f.id)},
        f.label.replace(" y verdura",""), el("span",{text:String(f.count)})))));
  }

  /* avisos breves: días ya pasados (no se compran, salvo que los pidas) y comprados ocultos */
  const infos=el("div",{className:"infos"});
  if(d.pastDays){
    const n=d.pastDays.names, many=n.length>1;
    const days=many ? n.slice(0,-1).join(", ")+" y "+n[n.length-1] : "el "+n[0];
    infos.append(el("p",{className:"infoline"},
      (d.pastDays.excluded ? "Sin " : "Con ")+days+(many?", ya pasados.":", ya pasado."),
      linkBtn(d.pastDays.excluded ? (many?"Incluirlos":"Incluirlo") : (many?"Quitarlos":"Quitarlo"),
        ()=>vm.setIncludePast(d.pastDays.excluded))));
  }
  if(d.hideDone && d.hiddenDone){
    infos.append(el("p",{className:"infoline"},
      d.hiddenDone+(d.hiddenDone===1?" comprado oculto.":" comprados ocultos."),
      linkBtn("Mostrar",()=>vm.toggleHideDone())));
  }
  if(infos.childNodes.length) host.append(infos);

  if(d.empty) host.append(el("div",{className:"empty",text:d.empty}));

  const row=r=>el("div",{className:"row"+(r.checked?" done":"")},
    el("button",{className:"tick","aria-pressed":r.checked?"true":"false",
      "aria-label":(r.checked?"Desmarcar ":"Marcar ")+r.name,onClick:()=>vm.toggleChecked(r.key)},
      el("i",null,svg(ICON.check,"3"))),
    el("button",{className:"row-main","aria-label":r.name+(r.qty?", "+r.qty:"")+". Ver de qué comidas viene",onClick:()=>openIngredientSheet(vm,r.key)},
      el("span",{className:"row-text"},
        el("span",{className:"row-name",text:r.name}),
        r.hint ? el("span",{className:"row-hint",text:r.hint}) : null),
      r.tag ? el("span",{className:"tag "+({"tuyo":"mine","siempre":"fixed","opcional":"opt","básico":"basic"})[r.tag],text:r.tag}) : null,
      r.qty ? el("span",{className:"row-qty",text:r.qty}) : null));

  const section=(title,count,rows,extra)=>el("section",{className:"sec"+(extra||"")},
    el("div",{className:"sec-head"},el("h2",{text:title}),el("span",{text:count})),
    rows.map(row));

  d.visibleSections.forEach(s=>host.append(section(s.label, s.done+" de "+s.rows.length, s.rows)));
  if(d.showOptionals && d.optionals.length) host.append(section("Opcionales","fuera del total",d.optionals," optionals"));

  /* añadir algo que no viene del menú: fijo abajo, al alcance del pulgar */
  const input=el("input",{type:"text",placeholder:"Añadir algo a la lista…","aria-label":"Añadir a la lista",enterkeyhint:"done"});
  const add=()=>{
    const n=input.value.trim();
    if(!n){ input.focus(); return; }
    const undo=vm.addCustom(n,null,"");
    showUndo(n.charAt(0).toUpperCase()+n.slice(1)+" añadido a la lista", undo);
  };
  input.addEventListener("keydown",e=>{ if(e.key==="Enter") add(); });
  host.append(el("div",{className:"addbar"},el("div",{className:"addbar-in"},
    input, el("button",{"aria-label":"Añadir",onClick:add},svg(ICON.plus,"2.4")))));
}
