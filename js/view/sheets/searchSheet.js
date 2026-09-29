/* VIEW · Buscador de platos en las 4 semanas. */

import { el, svg, ICON, openSheet, sheetHeader, hintLine } from "../dom.js";
import { openDishSheet } from "./dishSheet.js";

export function openSearchSheet(vm){
  openSheet(host=>{
    sheetHeader(host,"Buscar","Platos e ingredientes de las 4 semanas");
    const input=el("input",{className:"field",type:"search",placeholder:"merluza, croquetas, arroz…","aria-label":"Buscar"});
    const out=el("div",{style:{marginTop:"12px"}});
    host.append(input,out);

    function run(){
      out.textContent="";
      const hits=vm.search(input.value);
      if(hits==null){ out.append(hintLine("Escribe al menos dos letras.")); return; }
      out.append(hintLine(hits.length ? (hits.length===1?"1 plato":hits.length+" platos") : "Nada con «"+input.value.trim()+"».",{margin:"0 0 8px"}));
      if(!hits.length) return;
      out.append(el("div",{className:"rows"},hits.map(h=>el("button",{className:"hit",onClick:()=>{
          vm.openSearchResult(h.ctx);
          openDishSheet(vm,{d:h.ctx.d, mi:h.ctx.mi, si:h.ctx.si});
        }},
        el("span",{style:{flex:"1",minWidth:"0"}},
          el("span",{className:"hit-meta",text:h.where}),
          el("span",{className:"hit-name",text:h.name}),
          h.why ? el("span",{className:"hit-meta",text:h.why,
            style:{marginTop:"3px",textTransform:"none",letterSpacing:"0",fontWeight:"400",fontSize:"11.5px"}}) : null),
        svg(ICON.right,"2.2")))));
    }
    input.addEventListener("input",run);
    run();
    setTimeout(()=>input.focus(),300);
  });
}
