/* VIEW · Casa compartida: crear una casa, unirse con un código, ver el estado y salir.
   Se abre desde Ajustes. */

import { el, openSheet, closeSheet, sheetHeader, block, hintLine } from "../dom.js";

/* «Sincronizado hace 2 min», «Sin conexión…»: el estado en palabras */
export function houseStatusText(info){
  switch(info.state){
    case "ok": {
      const min=Math.floor((Date.now()-(info.at||Date.now()))/60000);
      return "Sincronizado " + (min<1 ? "ahora mismo" : min===1 ? "hace 1 min" : min<60 ? "hace "+min+" min" : "hace más de una hora") + ".";
    }
    case "offline": return "Sin conexión. Tus cambios se enviarán solos al volver.";
    case "error":   return "No se ha podido sincronizar. Se volverá a intentar solo.";
    case "gone":    return "Esta casa ya no existe en el servidor. Sal de ella y crea otra.";
    default:        return "Conectando…";
  }
}

export function openHouseSheet(vm){
  openSheet(host=>{
    let step=null;   /* null · "join-confirm" · "leave-confirm" */
    let typed="";    /* lo escrito en el código */
    let busy=false;
    let msg="", msgBad=false;

    function draw(){
      if(!host.isConnected) return;
      host.textContent="";
      const info=vm.houseInfo();
      sheetHeader(host,"Casa compartida","El mismo menú y la misma lista en varios móviles");
      const msgLine=msg ? el("p",{className:"hintline",text:msg,style:{color:msgBad?"var(--danger)":"var(--ink-faint)"}}) : null;

      if(info.code){
        /* --- ya estás en una casa --- */
        const copyBtn=el("button",{className:"btn ghost",style:{flex:"1"},text:"Copiar",onClick:()=>{
          const done=()=>{ copyBtn.textContent="Copiado"; setTimeout(()=>{ copyBtn.textContent="Copiar"; },2000); };
          if(navigator.clipboard) navigator.clipboard.writeText(info.code).then(done,()=>{ copyBtn.textContent="Selecciona y copia"; });
        }});
        const shareBtn = navigator.share
          ? el("button",{className:"btn",style:{flex:"1"},text:"Compartir",onClick:()=>{
              navigator.share({title:"Menuse",
                text:"Únete a nuestra casa en Menuse: Ajustes → Casa compartida → Unirme, con el código "+info.code,
                url:location.href.split("#")[0]}).catch(()=>{});
            }})
          : null;
        host.append(block("Código de tu casa",
          el("p",{className:"housecode",text:info.code}),
          el("div",{className:"addrow"},copyBtn,shareBtn),
          el("p",{className:"hintline",text:houseStatusText(info)}),
          hintLine("En el otro móvil: Ajustes → Casa compartida → «Unirme a una casa», y escribe este código."),
          hintLine("Quien tenga el código puede ver y cambiar vuestro menú y vuestra lista: pásalo sólo a tu familia.")));
        host.append(block("Qué se comparte",
          hintLine("Los menús, las listas de la compra, los productos fijos, el orden de los pasillos, las personas y el gasto.",{marginTop:"0"}),
          hintLine("Son de cada móvil: el tema claro u oscuro, los avisos del congelador y cómo ves la lista (ocultar lo comprado o los básicos).")));

        if(step==="leave-confirm"){
          host.append(block("Salir de la casa",
            hintLine("Este móvil se queda con una copia de lo que hay ahora, pero dejará de recibir y enviar cambios.",{marginTop:"0"}),
            el("div",{className:"addrow"},
              el("button",{className:"btn ghost",style:{flex:"1"},text:"Cancelar",onClick:()=>{ step=null; draw(); }}),
              el("button",{className:"btn",style:{flex:"1"},text:"Salir",onClick:()=>{ vm.leaveHouse(); step=null; msg=""; draw(); }}))));
        }else{
          host.append(el("div",{className:"sheet-actions"},
            el("button",{className:"textdanger",text:"Salir de la casa",onClick:()=>{ step="leave-confirm"; draw(); }})));
        }
        return;
      }

      /* --- aún no estás en ninguna casa --- */
      host.append(block("Crear una casa",
        el("button",{className:"btn full",text:busy==="create"?"Creando…":"Crear una casa",disabled:!!busy,onClick:async()=>{
          busy="create"; msg=""; draw();
          try{ await vm.createHouse(); msg=""; }
          catch(e){ msg=e.message || "No se pudo crear la casa. Prueba otra vez con conexión."; msgBad=true; }
          busy=false; draw();
        }}),
        hintLine("Sube tu menú, tus listas y tus fijos y te da un código para pasárselo a tu familia.")));

      const input=el("input",{className:"field",value:typed,placeholder:"Código, por ejemplo K7PM-3QXD",
        autocapitalize:"characters",autocomplete:"off",spellcheck:false,
        style:{textTransform:"uppercase",letterSpacing:"1px"}});
      input.addEventListener("input",()=>{ typed=input.value; });
      if(step==="join-confirm"){
        host.append(block("Unirme a una casa",
          el("p",{className:"housecode",text:vm.normalizeHouseCode(typed)}),
          hintLine("Lo que hay ahora en este móvil se sustituirá por el menú y la lista de esa casa. Si quieres conservarlo, guarda antes una copia de seguridad.",{marginTop:"0"}),
          el("div",{className:"addrow"},
            el("button",{className:"btn ghost",style:{flex:"1"},text:"Cancelar",disabled:!!busy,onClick:()=>{ step=null; msg=""; draw(); }}),
            el("button",{className:"btn",style:{flex:"1"},text:busy==="join"?"Uniendo…":"Sí, unirme",disabled:!!busy,onClick:async()=>{
              busy="join"; msg=""; draw();
              const error=await vm.joinHouse(typed);
              busy=false;
              if(error){ msg=error; msgBad=true; step=null; draw(); return; }
              msg="Listo. Recargando…"; msgBad=false; draw();
              setTimeout(()=>location.reload(),700);
            }})),
          msgLine));
      }else{
        host.append(block("Unirme a una casa",
          input,
          el("button",{className:"btn ghost full",style:{marginTop:"8px"},text:"Unirme",disabled:!!busy,onClick:()=>{
            typed=input.value;
            if(!vm.normalizeHouseCode(typed)){ msg="El código tiene 8 letras y números, como K7PM-3QXD."; msgBad=true; draw(); return; }
            msg=""; step="join-confirm"; draw();
          }}),
          hintLine("Pide el código a quien creó la casa."),
          msgLine));
      }
    }

    draw();
    /* el estado de la conexión se va actualizando mientras la ventana está abierta */
    const off=vm.onSyncStatus(()=>{ if(host.isConnected) draw(); else off(); });
    if(vm.houseInfo().code) vm.syncNow().catch(()=>{});
  });
}
