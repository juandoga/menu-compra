/* VIEW · Ventana para editar un plato: nombre, ingredientes y preparación previa.
   Cada cambio va al ViewModel al momento, que lo guarda. */

import { el, svg, ICON, openSheet, closeSheet, sheetHeader, block, hintLine, switchBtn, showUndo } from "../dom.js";

export function openDishSheet(vm,ref){
  openSheet(host=>{
    const d=vm.dish(ref);
    if(!d){ closeSheet(); return; }
    sheetHeader(host,"Editar plato",d.subtitle);

    const name=el("input",{className:"field",type:"text",value:d.name});
    name.addEventListener("input",()=>vm.renameDish(ref,name.value));
    host.append(block("Nombre del plato",name));

    /* ingredientes: se vuelven a pintar al añadir o quitar uno */
    const list=el("div");
    function drawIngredients(){
      list.textContent="";
      const ings=vm.dish(ref).ingredients;
      ings.forEach((row,idx)=>{
        const item=el("input",{className:"field",type:"text",value:row.item,placeholder:"Ingrediente"});
        item.addEventListener("input",()=>vm.setIngredient(ref,idx,"item",item.value));
        const qty=el("input",{className:"field",type:"number",step:"any",min:"0",inputmode:"decimal",value:String(row.qty),placeholder:"Cantidad"});
        qty.addEventListener("input",()=>vm.setIngredient(ref,idx,"qty",qty.value));
        const unit=el("input",{className:"field",type:"text",value:row.unit,placeholder:"g, ml, ud"});
        unit.addEventListener("input",()=>vm.setIngredient(ref,idx,"unit",unit.value));
        const x=el("button",{className:"del-x","aria-label":"Quitar ingrediente",onClick:()=>{
          const undo=vm.removeIngredient(ref,idx);
          drawIngredients();
          showUndo("Ingrediente quitado",()=>{ undo(); if(list.isConnected) drawIngredients(); });
        }},svg(ICON.close,"2.2"));
        list.append(el("div",{className:"ed-ing"},
          el("div",{className:"ed-top"},item,x),
          el("div",{className:"ed-bot"},qty,unit)));
      });
      if(!ings.length) list.append(hintLine("Este plato aún no tiene ingredientes.",{marginTop:"0"}));
    }
    drawIngredients();
    const addIng=el("button",{className:"add-dish",text:"+ Añadir ingrediente",onClick:()=>{
      vm.addIngredient(ref); drawIngredients();
      const inputs=list.querySelectorAll('input[type="text"]');
      if(inputs.length>=2) inputs[inputs.length-2].focus();
    }});
    host.append(block("Ingredientes",list,addIng,
      hintLine("Lo que pongas entre paréntesis se muestra como detalle. «(opcional)» deja el producto fuera del total de la compra.")));

    /* preparación previa y aviso la víspera */
    const prep=el("input",{className:"field",type:"text",placeholder:"Sacar el pescado del congelador",value:d.prep});
    prep.addEventListener("input",()=>vm.setPrep(ref,prep.value));
    const warn=switchBtn("Avisarme la víspera",d.prepWarn,()=>{
      vm.togglePrepWarn(ref);
      warn.setAttribute("aria-checked",vm.dish(ref).prepWarn?"true":"false");
    });
    host.append(block("Preparación previa",prep,
      el("div",{className:"switchrow",style:{marginTop:"10px"}},el("span",{text:"Avisarme la víspera"}),warn),
      hintLine("Aparece en Hoy el día anterior, para que no se te olvide descongelar o poner a remojo.")));

    host.append(el("div",{className:"sheet-actions"},
      el("button",{className:"btn full",text:"Listo",onClick:closeSheet}),
      el("button",{className:"textdanger",text:"Eliminar este plato",onClick:()=>{
        const r=vm.deleteDish(ref);
        closeSheet();
        showUndo("«"+r.name+"» eliminado",r.undo);
      }})));
  });
}
