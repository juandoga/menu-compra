/* VIEW · Copia de seguridad: guardar, restaurar y el recordatorio mensual. */

import { el, openSheet, closeSheet, sheetHeader, block, hintLine, linkBtn, note, showUndo, copyText } from "../dom.js";

/* recordatorio discreto en «Hoy» (o nada si no toca) */
export function backupNote(vm){
  const r=vm.backupReminder();
  if(!r) return null;
  return note(
    r.neverSaved ? "Aún no has guardado ninguna copia de tu menú." : "Hace más de un mes que no guardas una copia de tu menú.",
    linkBtn("Guardar",()=>openDataSheet(vm)),
    linkBtn("Luego",()=>vm.snoozeBackup()));
}

export function openDataSheet(vm){
  openSheet(host=>{
    sheetHeader(host,"Copia de seguridad","Tus datos viven sólo en este navegador");
    const json=vm.backupJSON();

    const ta=el("textarea",{className:"field",readOnly:true,value:json});
    const copyBtn=el("button",{className:"btn ghost",text:"Copiar",style:{flex:"1"},onClick:()=>{
      const ok=copyText(ta,json);
      if(ok) vm.markBackup();
      copyBtn.textContent = ok ? "Copiado" : "Selecciona y copia";
      setTimeout(()=>{ copyBtn.textContent="Copiar"; },2000);
    }});
    const dlBtn=el("button",{className:"btn",text:"Descargar",style:{flex:"1"},onClick:()=>{
      try{
        const url=URL.createObjectURL(new Blob([json],{type:"application/json"}));
        const a=el("a",{href:url,download:"menuse-"+new Date().toISOString().slice(0,10)+".json"});
        document.body.append(a); a.click();
        vm.markBackup();
        setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); },500);
      }catch(e){
        dlBtn.textContent="Usa Copiar";
        setTimeout(()=>{ dlBtn.textContent="Descargar"; },2500);
      }
    }});
    host.append(block("Guardar una copia",ta,el("div",{className:"addrow"},copyBtn,dlBtn),
      hintLine("Guarda el archivo en Drive o mándatelo por correo. Si borras los datos de Chrome o cambias de móvil, es lo único que recupera tu menú.")));

    const file=el("input",{className:"field",type:"file",accept:"application/json,.json"});
    const ta2=el("textarea",{className:"field",placeholder:"…o pega aquí el contenido del archivo",style:{marginTop:"8px"}});
    const msg=hintLine("");
    const apply=text=>{
      const error=vm.importBackup(text);
      if(error){ msg.textContent=error; msg.style.color="var(--danger)"; return; }
      msg.style.color="var(--ink-faint)";
      msg.textContent="Restaurado. Recargando…";
      setTimeout(()=>location.reload(),700);
    };
    file.addEventListener("change",()=>{
      const f=file.files && file.files[0];
      if(!f) return;
      const r=new FileReader();
      r.onload=()=>apply(String(r.result||""));
      r.readAsText(f);
    });
    const imp=el("button",{className:"btn full",text:"Restaurar",style:{marginTop:"8px"},onClick:()=>{
      const t=ta2.value.trim();
      if(!t){ msg.textContent="Elige un archivo o pega el contenido."; msg.style.color="var(--danger)"; return; }
      apply(t);
    }});
    host.append(block("Restaurar una copia",file,ta2,imp,msg));

    host.append(el("div",{className:"sheet-actions"},
      el("button",{className:"textdanger",text:"Volver al menú original",onClick:()=>{
        const undo=vm.resetMenu();
        closeSheet();
        showUndo("Menú original restablecido",undo);
      }})));
  });
}
