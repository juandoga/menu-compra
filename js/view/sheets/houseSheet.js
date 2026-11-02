/* VIEW · Casa compartida: crear una casa (con nombre), unirse con un código, ver el estado,
   cambiar el nombre y salir. Se abre desde Ajustes y desde el nombre de la casa en la cabecera. */

import { el, openSheet, sheetHeader, block, hintLine, linkBtn, sheetAlive } from "../dom.js";

/* enlace que abre Menuse con el código ya puesto: …/menu-compra/?casa=K7PM-3QXD */
export function inviteLink(code){ return location.origin+location.pathname+"?casa="+encodeURIComponent(code); }

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

/* opts.join: código de un enlace de invitación (se busca la casa nada más abrir) */
/* saca el código de un texto: «K7PM-3QXD», «k7pm3qxd» o un enlace con ?casa=… */
function codeFrom(text){
  const t=String(text||"");
  const m=t.match(/[?&]casa=([^&#\s]+)/i);
  const raw=m ? decodeURIComponent(m[1]) : t;
  const c=raw.toUpperCase().replace(/[^A-Z0-9]/g,"");
  return c.length===8 ? c.slice(0,4)+"-"+c.slice(4) : null;
}

export function openHouseSheet(vm,opts){
  openSheet(host=>{
    const alive=sheetAlive(host);
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
      if(!alive()) return;
      host.textContent="";
      const info=vm.houseInfo();
      sheetHeader(host,"Casa compartida","El mismo menú y la misma lista en varios móviles");
      const msgLine=msg ? el("p",{className:"hintline",text:msg,style:{color:msgBad?"var(--danger)":"var(--ink-faint)"}}) : null;

      if(info.code && step==="switch-confirm" && peek){
        /* --- te invitan a otra casa estando ya en una --- */
        host.append(block("Te invitan a otra casa",
          el("p",{className:"housename",text:peek.name}),
          el("p",{className:"hintline",text:"Código "+peek.code,style:{marginTop:"0"}}),
          hintLine("Ahora estás en «"+info.name+"». Si cambias, este móvil saldrá de ella y tendrá el menú y la lista de «"+peek.name+"»."),
          el("div",{className:"addrow"},
            el("button",{className:"btn ghost",style:{flex:"1"},text:"Quedarme",disabled:!!busy,onClick:()=>{ step=null; peek=null; draw(); }}),
            el("button",{className:"btn",style:{flex:"1"},text:busy==="join"?"Cambiando…":"Cambiar de casa",disabled:!!busy,onClick:()=>join()})),
          msgLine));
        return;
      }

      if(info.code){
        /* --- ya estás en una casa --- */
        const copyBtn=el("button",{className:"btn ghost",style:{flex:"1"},text:"Copiar enlace",onClick:()=>{
          const done=()=>{ copyBtn.textContent="Copiado"; setTimeout(()=>{ copyBtn.textContent="Copiar enlace"; },2000); };
          if(navigator.clipboard) navigator.clipboard.writeText(inviteLink(info.code)).then(done,()=>{ copyBtn.textContent="No se pudo copiar"; });
        }});
        const shareBtn = navigator.share
          ? el("button",{className:"btn",style:{flex:"1"},text:"Compartir",onClick:()=>{
              navigator.share({title:"Menuse",
                text:"Únete a «"+info.name+"» en Menuse. Abre el enlace y pulsa «Sí, unirme» (o escribe el código "+info.code+" en Ajustes → Casa compartida).",
                url:inviteLink(info.code)}).catch(()=>{});
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
            linkBtn("Cambiar el nombre",()=>{ newName=info.name; step="rename"; draw(); }),
            msgLine);
        }
        host.append(nameBlock);

        host.append(block("Código para unirse",
          el("p",{className:"housecode",text:info.code}),
          el("div",{className:"addrow"},copyBtn,shareBtn),
          hintLine("Lo más fácil: «Compartir» y mándalo por WhatsApp. Al abrir el enlace, Menuse ya trae el código y sólo hay que pulsar «Sí, unirme»."),
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
            el("button",{className:"btn",style:{flex:"1"},text:busy==="join"?"Uniendo…":"Sí, unirme",disabled:!!busy,onClick:()=>join()})),
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

      const codeInput=field(typed,"Código, por ejemplo K7PM-3QXD",v=>{ typed=v; },
        {autocapitalize:"characters",spellcheck:false,inputMode:"text",enterKeyHint:"go",style:{letterSpacing:"1px",flex:"1",minWidth:"0"}});
      codeInput.addEventListener("keydown",e=>{ if(e.key==="Enter") lookUp(typed); });
      /* «Pegar»: el código copiado de WhatsApp (o el enlace entero) sin escribirlo a mano */
      const pasteBtn = navigator.clipboard && navigator.clipboard.readText
        ? el("button",{className:"btn ghost",text:"Pegar",onClick:async()=>{
            try{ const t=await navigator.clipboard.readText(); typed=codeFrom(t)||t.trim(); draw(); }
            catch(e){ msg="El móvil no deja pegar desde aquí: mantén pulsada la caja y elige «Pegar»."; msgBad=true; draw(); }
          }})
        : null;
      host.append(block("Unirme a una casa",
        el("div",{className:"qtyrow"},codeInput,pasteBtn),
        el("button",{className:"btn ghost full",style:{marginTop:"8px"},text:busy==="peek"?"Buscando…":"Unirme",disabled:!!busy,onClick:()=>lookUp(typed)}),
        hintLine("Pide el enlace o el código a quien creó la casa. Si te mandan el enlace, ábrelo y ya está."),
        msgLine));
    }

    /* buscar la casa del código y pasar a «¿unirte?» */
    async function lookUp(text){
      busy="peek"; msg=""; draw();
      const r=await vm.peekHouse(codeFrom(text)||text);
      busy=false;
      if(!alive()) return;
      if(r.error){ msg=r.error; msgBad=true; step=null; draw(); return; }
      const info=vm.houseInfo();
      if(info.code===r.code){ msg="Ya estás en «"+info.name+"»."; msgBad=false; step=null; draw(); return; }
      peek=r; step = info.code ? "switch-confirm" : "join-confirm"; draw();
    }
    async function join(){
      busy="join"; msg=""; draw();
      const error=await vm.joinHouse(peek.code);
      busy=false;
      if(error){ msg=error; msgBad=true; step=null; peek=null; draw(); return; }
      msg="Listo. Recargando…"; msgBad=false; draw();
      setTimeout(()=>{ location.href=location.origin+location.pathname; },700);
    }

    draw();
    /* el estado de la conexión se va actualizando mientras la ventana está abierta,
       pero no mientras escribes (repintar quitaría el teclado) */
    const off=vm.onSyncStatus(()=>{
      if(!alive()){ off(); return; }
      const a=document.activeElement;
      if(step==="rename" || (a && a.tagName==="INPUT" && host.contains(a))) return;
      draw();
    });
    if(opts && opts.join) lookUp(opts.join);
    else if(vm.houseInfo().code) vm.syncNow().catch(()=>{});
  });
}
