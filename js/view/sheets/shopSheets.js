/* VIEW · Ventanas de la lista de la compra: ficha de un producto, orden de pasillos,
   «¿Compra hecha?» y compartir. */

import { el, svg, ICON, openSheet, closeSheet, sheetHeader, block, hintLine, switchBtn, showUndo, copyText } from "../dom.js";

/* --- ficha de un producto --- */
export function openIngredientSheet(vm,key){
  openSheet(host=>{
    const i=vm.shopItem(key);
    if(!i){ closeSheet(); return; }
    sheetHeader(host,i.title,i.subtitle);

    if(i.hint) host.append(block("En el menú pone",el("p",{text:i.hint,style:{margin:"0",fontSize:"13.5px"}})));

    const qty=el("input",{className:"field",type:"number",step:"any",min:"0",inputmode:"decimal",value:String(i.qty),placeholder:"Sin cantidad"});
    const unit=el("input",{className:"field",type:"text",value:i.unit,placeholder:"Unidad",style:{maxWidth:"90px"}});
    const save=()=>vm.setItemQty(i.key, qty.value.trim()==="" ? null : parseFloat(qty.value), unit.value.trim());
    qty.addEventListener("change",save);
    unit.addEventListener("change",save);
    host.append(block("Cantidad a comprar",el("div",{className:"qtyrow"},qty,unit),i.note ? hintLine(i.note) : null));

    if(i.custom){
      host.append(block("Añadido por ti",
        hintLine("Este producto no viene del menú, lo añadiste tú a la lista de esta semana.",{marginTop:"0"})));
    }else{
      host.append(block("Aparece en "+i.origins.length+(i.origins.length===1?" comida":" comidas"),
        i.origins.map(o=>el("div",{className:"origin"},
          el("span",{className:"od",text:o.day}),
          el("span",{className:"op"},el("b",{text:o.meal}),o.dish),
          el("span",{className:"oq",text:o.qty})))));
    }

    host.append(el("div",{className:"sheet-actions"},
      i.custom ? null : el("button",{className:"btn ghost full",text:i.basic?"Quitar de básicos":"Marcar como básico",
        onClick:()=>{ vm.toggleBasic(i.key); closeSheet(); }}),
      el("button",{className:"textdanger",text:"Quitar de la lista",onClick:()=>{
        const undo=vm.removeItem(i.key);
        closeSheet();
        showUndo(i.title+" quitado de la lista",undo);
      }})));
  });
}

/* --- orden de los pasillos --- */
export function openAisleSheet(vm){
  openSheet(host=>{
    sheetHeader(host,"Orden de los pasillos","Ponlos como recorres tu súper");
    const wrap=el("div");
    host.append(wrap);
    function draw(){
      wrap.textContent="";
      const list=vm.aisles();
      list.forEach((a,idx)=>{
        wrap.append(el("div",{className:"aisle"},
          el("span",{className:"aisle-n",text:String(idx+1)}),
          el("span",{className:"aisle-name",text:a.label}),
          el("div",{className:"aisle-btns"},
            el("button",{className:"abtn","aria-label":"Subir "+a.label,disabled:idx===0,
              onClick:()=>{ vm.moveAisle(idx,-1); draw(); }},svg(ICON.up,"2.2")),
            el("button",{className:"abtn","aria-label":"Bajar "+a.label,disabled:idx===list.length-1,
              onClick:()=>{ vm.moveAisle(idx,1); draw(); }},svg(ICON.down,"2.2")))));
      });
    }
    draw();
    host.append(el("div",{className:"sheet-actions"},
      el("button",{className:"btn full",text:"Listo",onClick:closeSheet}),
      el("button",{className:"textdanger",text:"Volver al orden original",onClick:()=>{ vm.resetAisles(); draw(); }})));
  });
}

/* --- ¿compra hecha? --- */
export function openCloseSheet(vm){
  openSheet(host=>{
    const s=vm.closingSummary();
    sheetHeader(host,"¿Compra hecha?","Semana "+s.week);
    const left = !s.left.length ? "No queda nada sin marcar."
               : s.left.length<=6 ? "Quedan sin marcar: "+s.left.join(", ")+"."
               : "Quedan "+s.left.length+" productos sin marcar.";
    host.append(block("Estado",
      el("div",{style:{fontFamily:"var(--serif)",fontSize:"30px",fontWeight:"700",lineHeight:"1"}},
        String(s.done), el("span",{text:" de "+s.total,style:{fontSize:"16px",color:"var(--ink-faint)",fontWeight:"500"}})),
      hintLine(left)));
    host.append(el("p",{style:{fontSize:"13.5px",color:"var(--ink-soft)",lineHeight:"1.5",margin:"0 0 12px"},
      text:"Al cerrar se desmarca toda la lista y la semana queda lista para la próxima vez. Tus cantidades y los productos que añadiste se mantienen."}));
    host.append(el("div",{className:"sheet-actions"},
      el("button",{className:"btn full",text:"Cerrar la compra",onClick:()=>{
        const undo=vm.closeShopping();
        closeSheet();
        showUndo("Compra de la semana "+s.week+" cerrada",undo);
      }}),
      el("button",{className:"btn ghost full",text:"Seguir comprando",onClick:closeSheet})));
  });
}

/* --- compartir la lista --- */
export function openShareSheet(vm){
  openSheet(host=>{
    let onlyLeft=true;
    sheetHeader(host,"Compartir la lista","Semana "+(vm.week+1));
    const ta=el("textarea",{className:"field",readOnly:true,style:{minHeight:"180px"}});
    const paint=()=>{ ta.value=vm.shareText(onlyLeft); wa.href="https://wa.me/?text="+encodeURIComponent(ta.value); };
    const sw=switchBtn("Sólo lo que queda por comprar",true,()=>{
      onlyLeft=!onlyLeft; sw.setAttribute("aria-checked",onlyLeft?"true":"false"); paint();
    });
    const copy=el("button",{className:"btn full",text:"Copiar texto",onClick:()=>{
      copy.textContent = copyText(ta,ta.value) ? "Copiado" : "Selecciona y copia";
      setTimeout(()=>{ copy.textContent="Copiar texto"; },2000);
    }});
    const wa=el("a",{className:"btn ghost full",text:"Enviar por WhatsApp",rel:"noopener",target:"_blank",
      style:{display:"block",textAlign:"center",textDecoration:"none"}});
    host.append(ta,
      el("div",{className:"switchrow"},el("span",{text:"Sólo lo que queda por comprar"}),sw),
      el("div",{className:"sheet-actions",style:{marginTop:"12px"}},copy,wa));
    paint();
  });
}
