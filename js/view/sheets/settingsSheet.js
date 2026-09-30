/* VIEW · Panel de ajustes: estación, menús por estación, tema y copia de seguridad.
   Está detrás del botón de la cabecera; son cosas que se tocan poco. */

import { el, svg, ICON, openSheet, closeSheet, sheetHeader, block, hintLine, showUndo, applyTheme } from "../dom.js";
import { openDataSheet } from "./dataSheet.js";
import { isInstalled, canInstall, promptInstall, onInstallChange } from "../install.js";

export function openSettingsSheet(vm){
  openSheet(host=>{
    let creating=null; /* estación cuyo «Crear» está abierto */

    function draw(){
      host.textContent="";
      const info=vm.seasonInfo();
      sheetHeader(host,"Ajustes");

      /* --- instalar como app --- */
      if(!isInstalled()){
        host.append(block("App",
          canInstall()
            ? el("button",{className:"btn full",text:"Instalar Menuse como app",onClick:async()=>{
                if(await promptInstall()) draw();
              }})
            : hintLine("Para instalarla como app: menú ⋮ de Chrome → «Instalar aplicación». Si sólo aparece «Añadir a pantalla de inicio», elige «Instalar», no «Crear acceso directo».",{marginTop:"0"}),
          hintLine("Instalada sale en el cajón de aplicaciones, se abre a pantalla completa y conserva tu menú y tu lista.")));
      }

      /* --- estación --- */
      const choices=[{id:"auto",label:"Automática"}].concat(info.seasons.map(s=>({id:s.id,label:s.label})));
      host.append(block("Estación",
        el("p",{className:"set-now"},"Ahora: ",el("b",{text:info.nowLabel}),
          info.setting==="auto" ? " (según la fecha)" : " (fijada a mano)"),
        el("div",{className:"chips"},choices.map(c=>el("button",{
          text:c.label,"aria-pressed":info.setting===c.id?"true":"false",
          onClick:()=>{ vm.setSeasonSetting(c.id); draw(); }}))),
        hintLine("En automática cambia sola: primavera el 21 de marzo, verano el 21 de junio, otoño el 23 de septiembre e invierno el 21 de diciembre.")));

      /* --- menús por estación --- */
      const rows=info.seasons.map(s=>{
        const status = s.hasMenu ? "Menú propio" : "Usa el menú general";
        const row=el("div",{className:"srow"},
          el("div",{className:"srow-text"},
            el("span",{className:"srow-name"},s.label, s.isNow ? el("span",{className:"tag mine",text:"ahora"}) : null),
            el("span",{className:"srow-sub",text:s.range+" · "+status})),
          s.hasMenu
            ? el("div",{className:"srow-btns"},
                el("button",{className:"btn ghost sm",text:"Editar",onClick:()=>{ closeSheet(); vm.viewSeason(s.id); }}),
                el("button",{className:"abtn","aria-label":"Borrar el menú de "+s.label.toLowerCase(),onClick:()=>{
                  const undo=vm.deleteSeasonMenu(s.id); draw();
                  showUndo("Menú de "+s.label.toLowerCase()+" borrado",()=>{ undo(); if(host.isConnected) draw(); });
                }},svg(ICON.close,"2.2")))
            : el("button",{className:"btn ghost sm",text:"Crear","aria-expanded":creating===s.id?"true":"false",
                onClick:()=>{ creating = creating===s.id ? null : s.id; draw(); }}));
        const wrap=el("div",null,row);
        if(creating===s.id && !s.hasMenu){
          const make=mode=>{ vm.createSeasonMenu(s.id,mode); creating=null; draw(); };
          wrap.append(el("div",{className:"srow-create"},
            el("p",{className:"hintline",style:{margin:"0 0 8px"},text:"¿Cómo quieres empezar el menú de "+s.label.toLowerCase()+"?"}),
            el("div",{className:"addrow",style:{marginTop:"0"}},
              el("button",{className:"btn ghost",style:{flex:"1"},text:"Copiar el general",onClick:()=>make("copy")}),
              el("button",{className:"btn ghost",style:{flex:"1"},text:"Empezar vacío",onClick:()=>make("empty")}))));
        }
        return wrap;
      });
      host.append(block("Menús por estación",
        rows,
        hintLine("El menú general es el de siempre: lo usan las estaciones sin menú propio. Con «Editar» abres el menú de esa estación en Semana y lo cambias con el editor de platos de siempre.")));

      /* --- apariencia --- */
      const cur=vm.theme();
      const th=cur==="dark"||cur==="light" ? cur : "auto";
      host.append(block("Apariencia",
        el("div",{className:"chips"},[{id:"auto",label:"Automática"},{id:"light",label:"Clara"},{id:"dark",label:"Oscura"}].map(t=>
          el("button",{text:t.label,"aria-pressed":th===t.id?"true":"false",
            onClick:()=>{ vm.setTheme(t.id); applyTheme(t.id); draw(); }})))));

      /* --- copia de seguridad --- */
      host.append(block("Copia de seguridad",
        vm.backupReminder() ? hintLine("Hace tiempo que no guardas una copia de tu menú.",{marginTop:"0",marginBottom:"8px"}) : null,
        el("button",{className:"btn ghost full",text:"Guardar o restaurar una copia",onClick:()=>openDataSheet(vm)})));

      host.append(el("div",{className:"sheet-actions"},
        el("button",{className:"btn full",text:"Listo",onClick:closeSheet})));
    }
    draw();
    /* si Chrome avisa de que ya se puede instalar mientras el panel está abierto */
    const off=onInstallChange(()=>{ if(host.isConnected) draw(); else off(); });
  });
}
