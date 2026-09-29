/* VIEW · Ventanas de la semana: «Semana en curso» y «Cambiar con otro día». */

import { el, svg, ICON, openSheet, closeSheet, sheetHeader, block, hintLine, pick4, showUndo } from "../dom.js";

/* --- qué semana toca --- */
export function openWeekSheet(vm){
  openSheet(host=>{
    sheetHeader(host,"Semana en curso","Qué semana del menú toca esta semana");
    host.append(block("Esta semana toca la",
      pick4(vm.curWeek,w=>{
        const undo=vm.setCurrentWeek(w);
        closeSheet();
        showUndo("Ahora toca la semana "+(w+1),undo);
      }),
      hintLine("Cada lunes pasa sola a la siguiente, y después de la 4 vuelve a la 1. Los números de arriba siguen sirviendo para mirar otras semanas.")));
  });
}

/* --- cambiar con otro día (sólo esta semana) --- */
export function openSwapSheet(vm,dayIdx){
  openSheet(host=>{
    let what=null; /* null = todo el día; si no, el nombre de la comida */
    const first=vm.swapInfo(dayIdx,null);
    sheetHeader(host,first.title,"Semana "+first.week+" · sólo para esta semana");

    const chips=el("div",{className:"chips"});
    const list=el("div",{className:"rows"});
    host.append(block("Qué quieres cambiar",chips));
    host.append(block("Con qué día",list,
      hintLine("El lunes que viene el menú vuelve a estar como siempre. La lista de la compra no cambia, porque los platos siguen siendo de la misma semana. Para cambiarlo para siempre, edita los platos.")));

    function draw(){
      const info=vm.swapInfo(dayIdx,what);
      chips.textContent="";
      [null].concat(info.choices).forEach(n=>chips.append(el("button",{
        text: n==null ? "Todo el día" : "Sólo "+n.toLowerCase(),
        "aria-pressed": n===what ? "true" : "false",
        onClick:()=>{ what=n; draw(); }})));
      list.textContent="";
      info.targets.forEach(t=>list.append(el("button",{className:"hit",onClick:()=>{
          const undo=vm.swapDays(dayIdx,t.d,what);
          closeSheet();
          showUndo((what==null?"Días":what)+" cambiados: "+vm.days[dayIdx].full.toLowerCase()+" ↔ "+t.name.toLowerCase(),undo);
        }},
        el("span",{style:{flex:"1",minWidth:"0"}},
          el("span",{className:"hit-meta",text:t.name+(t.isToday?" · hoy":"")}),
          t.lines.map(l=>el("span",{className:"hit-name",text:l,style:{fontWeight:"500",fontSize:"13.5px"}}))),
        svg(ICON.right,"2.2"))));
      if(!info.targets.length) list.append(hintLine("Ningún otro día tiene "+String(what).toLowerCase()+".",{margin:"10px 12px"}));
    }
    draw();

    if(first.hasSwaps){
      host.append(el("div",{className:"sheet-actions"},
        el("button",{className:"textdanger",text:"Dejar la semana como estaba",onClick:()=>{
          const undo=vm.clearSwaps();
          closeSheet();
          showUndo("Semana como estaba",undo);
        }})));
    }
  });
}

/* --- elegir qué semana mirar (desde la pastilla de la cabecera) --- */
export function openWeekPicker(vm){
  openSheet(host=>{
    sheetHeader(host,"¿Qué semana quieres ver?", vm.curWeek!=null ? "Esta semana toca la "+(vm.curWeek+1) : "Aún no me has dicho qué semana toca");
    host.append(block("Ver la semana",
      pick4(vm.week,w=>{ vm.selectWeek(w); closeSheet(); })));
    host.append(el("div",{className:"sheet-actions"},
      el("button",{className:"btn ghost full",text: vm.curWeek!=null ? "Cambiar la semana en curso" : "Decir qué semana toca",
        onClick:()=>openWeekSheet(vm)})));
  });
}
