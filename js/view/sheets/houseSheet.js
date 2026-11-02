/* VIEW · Casa compartida: crear una casa (con nombre), unirse con un código, ver el estado,
   cambiar el nombre y salir. Se abre desde Ajustes y desde el nombre de la casa en la cabecera. */

import { el, openSheet, sheetHeader, block, hintLine, linkBtn } from "../dom.js";

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
    let step=null;     /* null · "join-confirm" · "leave-confirm" · "rename" */
    let typed="";      /* lo escrito en el código */
    let newName="";    /* nombre para la casa nueva */
    let peek=null;     /* la casa a la que te vas a unir: {code, name} */
    let busy=false;
    let msg="", msgBad=false;

    const field=(value,placeholder,onInput,extra)=>{
      const i=el("input",Object.assign({className:"field",value,placeholder,autocomplete:"off"},extra||{}));
      i.addEventListener("input",()=>onInput(i.value));
      return i;
    };

    function draw(){
      if(!host.isConnected) return;
      host.textContent="";
      const info=vm.houseInfo();
      sheetHeader(host,"Casa compartida","El mismo menú y la misma lista en varios móviles");
      const msgLine=msg ? el("p",{className:"hintline",text:msg,style:{color:msgBad?"var(--danger)":"var(--ink-faint)"}}) : null;

      if(info.code){
        /* --- ya estás en una casa --- */
        const copyBtn=el("button",{className:"btn ghost",style:{flex:"1"},text:"Copiar código",onClick:()=>{
          const done=()=>{ copyBtn.textContent="Copiado"; setTimeout(()=>{ copyBtn.textContent="Copiar código"; },2000); };
          if(navigator.clipboard) navigator.clipboard.writeText(info.code).then(done,()=>{ copyBtn.textContent="Selecciona y copia"; });
        }});
        const shareBtn = navigator.share
          ? el("button",{className:"btn",style:{flex:"1"},text:"Compartir",onClick:()=>{
              navigator.share({title:"Menuse",
                text:"Únete a «"+info.name+"» en Menuse: Ajustes → Casa compartida → Unirme, con el código "+info.code,
                url:location.href.split("#")[0]}).catch(()=>{});
            }})
          : null;

        let nameBlock;
        if(step==="rename"){
          const input=field(newName,"Nombre de la casa",v=>{ newName=v; },{maxLength:40});
          nameBlock=block("Nombre de la casa", input,
            el("div",{className:"addrow"},
              el("button",{className:"btn ghost",style:{flex:"1"},text:"Cancelar",onClick:()=>{ step=null; draw(); }}),
              el("button",{className:"btn",style:{flex:"1"},text:"Guardar",onClick:()=>{
                if(newName.trim()) vm.renameHouse(newName);
                step=null; draw();
              }})),
            hintLine("El nombre lo verán todos los móviles de la casa."));
          setTimeout(()=>input.focus(),50);
        }else{
          nameBlock=block("Estás en",
            el("p",{className:"housename",text:info.name}),
            el("p",{className:"hintline",text:houseStatusText(info),style:{marginTop:"0"}}),
            linkBtn("Cambiar el nombre",()=>{ newName=info.name; step="rename"; draw(); }));
        }
        host.append(nameBlock);

        host.append(block("Código para unirse",
          el("p",{className:"housecode",text:info.code}),
          el("div",{className:"addrow"},copyBtn,shareBtn),
          hintLine("En el otro móvil: Ajustes → Casa compartida → «Unirme a una casa», y escribe este código."),
          hintLine("Quien tenga el código puede ver y cambiar vuestro menú y vuestra lista: pásalo sólo a tu familia.")));
        host.append(block("Qué se comparte",
          hintLine("Los menús, las listas de la compra, los productos fijos, el orden de los pasillos, las personas y el gasto.",{marginTop:"0"}),
          hintLine("Son de cada móvil: el tema claro u oscuro, los avisos del congelador y cómo ves la lista (ocultar lo comprado o los básicos).")));

        if(step==="leave-confirm"){
          host.append(block("Salir de «"+info.name+"»",
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
      host.append(block("Ahora",
        el("p",{className:"housename none",text:"En ninguna casa"}),
        hintLine("Tu menú y tu lista sólo están en este móvil.",{marginTop:"0"})));

      if(step==="join-confirm" && peek){
        host.append(block("Unirme a una casa",
          el("p",{className:"housename",text:peek.name}),
          el("p",{className:"hintline",text:"Código "+peek.code,style:{marginTop:"0"}}),
          hintLine("Lo que hay ahora en este móvil se sustituirá por el menú y la lista de «"+peek.name+"». Si quieres conservarlo, guarda antes una copia de seguridad."),
          el("div",{className:"addrow"},
            el("button",{className:"btn ghost",style:{flex:"1"},text:"Cancelar",disabled:!!busy,onClick:()=>{ step=null; peek=null; msg=""; draw(); }}),
            el("button",{className:"btn",style:{flex:"1"},text:busy==="join"?"Uniendo…":"Sí, unirme",disabled:!!busy,onClick:async()=>{
              busy="join"; msg=""; draw();
              const error=await vm.joinHouse(peek.code);
              busy=false;
              if(error){ msg=error; msgBad=true; step=null; peek=null; draw(); return; }
              msg="Listo. Recargando…"; msgBad=false; draw();
              setTimeout(()=>location.reload(),700);
            }})),
          msgLine));
        return;
      }

      host.append(block("Crear una casa",
        field(newName,"Nombre, por ejemplo Casa García",v=>{ newName=v; },{maxLength:40}),
        el("button",{className:"btn full",style:{marginTop:"8px"},text:busy==="create"?"Creando…":"Crear la casa",disabled:!!busy,onClick:async()=>{
          busy="create"; msg=""; draw();
          try{ await vm.createHouse(newName); msg=""; }
          catch(e){ msg=e.message || "No se pudo crear la casa. Prueba otra vez con conexión."; msgBad=true; }
          busy=false; draw();
        }}),
        hintLine("Sube tu menú, tus listas y tus fijos y te da un código para pasárselo a tu familia. Todos verán este nombre.")));

      host.append(block("Unirme a una casa",
        field(typed,"Código, por ejemplo K7PM-3QXD",v=>{ typed=v; },
          {autocapitalize:"characters",spellcheck:false,style:{letterSpacing:"1px"}}),
        el("button",{className:"btn ghost full",style:{marginTop:"8px"},text:busy==="peek"?"Buscando…":"Unirme",disabled:!!busy,onClick:async()=>{
          busy="peek"; msg=""; draw();
          const r=await vm.peekHouse(typed);
          busy=false;
          if(r.error){ msg=r.error; msgBad=true; draw(); return; }
          peek=r; step="join-confirm"; draw();
        }}),
        hintLine("Pide el código a quien creó la casa."),
        msgLine));
    }

    draw();
    /* el estado de la conexión se va actualizando mientras la ventana está abierta */
    const off=vm.onSyncStatus(()=>{ if(host.isConnected && step!=="rename") draw(); else if(!host.isConnected) off(); });
    if(vm.houseInfo().code) vm.syncNow().catch(()=>{});
  });
}
