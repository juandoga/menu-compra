/* VIEWMODEL · El «cocinero» de Menuse.
   - Guarda el estado de la pantalla: qué semana miras, qué pestaña está abierta, qué día es hoy…
   - Prepara los datos ya listos para pintar (la View sólo tiene que ponerlos en pantalla).
   - Recibe las órdenes de los botones («marca las cebollas», «cambia el martes por el jueves»),
     las aplica en el Model y avisa a quien esté escuchando para que se repinte.
   No toca el HTML: no sabe nada de botones, colores ni etiquetas. */

import * as repo from "../model/repository.js";
import * as rules from "../model/rules.js";
import { DAYS } from "../model/defaultMenu.js";
import { sectionFor, sectionLabel } from "../model/sections.js";
import { cap, clone, fmt, norm, parseItem, qtyText, itemKey } from "../model/text.js";
import { cycleWeekOn, isoDate, startFor, weekdayIndex, SEASONS, seasonOf, seasonLabel } from "../model/calendar.js";

const DAY_MS=864e5;
const MONTHS=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const MONTHS_SHORT=["ene","feb","mar","abr","may","jun","jul","ago","sept","oct","nov","dic"];
const mealKind=rules.mealKind; /* comida, cena, desayuno o libre */

/* now: de dónde sale la hora. Se puede cambiar en las pruebas para simular otro día. */
export function createAppViewModel(now=()=>new Date()){

  /* ---------- estado de la pantalla ---------- */
  const st={
    todayKey:isoDate(now()),
    todayIdx:weekdayIndex(now()),
    curWeek:cycleWeekOn(now(),repo.cycleStart()), /* la semana que toca de verdad (o null) */
    week:0,                                       /* la semana que estás mirando */
    view:"hoy",
    shopAutoWeek:false,  /* la compra saltó sola a la semana siguiente (fin de semana) */
    shopDeclined:null,   /* día en que dijiste «ver la de esta» */
    openDays:new Set(),
    aisle:"all",         /* filtro de pasillo en la lista de la compra */
    includePast:false,   /* incluir en la compra los días de esta semana que ya han pasado */
    seasonView:null      /* estación cuyo menú estás mirando para editarlo (null = la que toca) */
  };
  st.week = st.curWeek==null ? 0 : st.curWeek;
  st.openDays.add(st.todayIdx);

  /* ---------- avisar de cambios ---------- */
  const listeners=new Set();
  function subscribe(fn){ listeners.add(fn); return ()=>listeners.delete(fn); }
  function notify(){ sync(); listeners.forEach(fn=>fn()); }

  /* ---------- estaciones: qué menú se usa ---------- */
  /* la estación que toca: la de la fecha, o la que hayas fijado en Ajustes */
  function seasonNow(){ const s=repo.seasonSetting(); return s==="auto" ? seasonOf(now()) : s; }
  /* el menú de la estación que toca, o el general si esa estación no tiene menú propio */
  function liveMenuId(){ const s=seasonNow(); return repo.hasSeasonMenu(s) ? s : "base"; }
  /* el menú que se está mirando (puede ser otra estación, para editarla) */
  function viewMenuId(){ const s=st.seasonView||seasonNow(); return repo.hasSeasonMenu(s) ? s : "base"; }
  function sync(){ repo.useMenu(viewMenuId()); }
  sync();

  /* ---------- atajos internos ---------- */
  const menu=()=>repo.getMenu();
  /* los cambios de día sólo valen para el menú que toca de verdad, no al mirar otra estación */
  const swapsFor=w=>{
    if(viewMenuId()!==liveMenuId()) return [];
    const s=repo.loadSwaps(now()); return (s && s.week===w) ? s.list : [];
  };
  const vweek=w=>rules.viewWeek(menu(),w,swapsFor(w));
  const people=()=>rules.peopleCount(repo.peopleSetting());
  const basicOv=()=>repo.basicsOverrides();
  const isBasic=name=>rules.isBasic(menu(),basicOv(),name);
  /* desde qué día se compra: en la semana en curso, desde hoy (lo de días pasados ya no hace falta) */
  const fromDay=w=>(!st.includePast && st.curWeek!=null && w===st.curWeek && !st.shopAutoWeek) ? st.todayIdx : 0;
  const items=w=>rules.shopItems(menu(),w,repo.weekState(w),people(),swapsFor(w),
    {fromDay:fromDay(w), staples:repo.staples()});
  const isStaple=key=>String(key).indexOf("fijo::")===0;
  const dayName=d=>DAYS[d].full;
  const dishAt=ref=>menu()[st.week][ref.d].meals[ref.mi].dishes[ref.si];
  /* cambia la semana de lo marcado en la lista y lo guarda */
  function editWeekState(w,fn){ const s=repo.weekState(w); fn(s); repo.saveWeekState(w,s); }
  /* el lunes de la semana real en curso */
  function mondayDate(){ const t=now(); const m=new Date(t.getFullYear(),t.getMonth(),t.getDate()); m.setDate(m.getDate()-st.todayIdx); return m; }
  function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }

  /* ---------- copia de seguridad: ¿toca recordarla? ---------- */
  function backupDue(){
    if(!repo.hasOwnData()) return false;
    const t=now().getTime();
    const seen=repo.firstSeen(t);
    const snooze=repo.snoozeUntil();
    if(snooze && t<snooze) return false;
    return t-(repo.lastBackup() || seen) > 30*DAY_MS;
  }

  /* comida lista para pintar: nombre, si viene cambiada de otro día y sus platos */
  function mealVM(ref,shownDay){
    return {
      name:ref.meal.name,
      kind:mealKind(ref.meal),
      swappedFrom: ref.d!==shownDay ? dayName(ref.d).toLowerCase() : null,
      ref:{d:ref.d, mi:ref.mi},
      dishes:ref.meal.dishes.map((dish,si)=>dishVM(dish,{d:ref.d,mi:ref.mi,si},shownDay))
    };
  }
  function dishVM(dish,ref,shownDay){
    return {
      name:dish.name,
      ref:{...ref, shownDay},
      prep: dish.prep && String(dish.prep).trim() ? dish.prep : null,
      ingredients:dish.ingredients.map(i=>{
        const p=parseItem(i.item);
        return {qty:qtyText(i.qty,i.unit), name:cap(p.short), hint:p.hint, optional:p.optional, basic:isBasic(p.short)};
      })
    };
  }

  return {
    subscribe,

    /* ================= DATOS PARA LA PANTALLA ================= */

    get view(){ return st.view; },
    get week(){ return st.week; },
    get curWeek(){ return st.curWeek; },
    get todayIdx(){ return st.todayIdx; },
    days:DAYS,

    /* los botones 1-2-3-4 de arriba */
    weekButtons(){
      return [0,1,2,3].map(w=>({n:w+1, w, selected:w===st.week, now:w===st.curWeek}));
    },
    tagline(){
      if(st.view==="hoy") return dayName(st.todayIdx)+" · Semana "+(st.week+1);
      if(st.view==="semana") return "Semana "+(st.week+1)+" · 7 días";
      return "Lista de la compra · semana "+(st.week+1);
    },
    backupReminder(){
      if(!backupDue()) return null;
      return {neverSaved: !repo.lastBackup()};
    },

    /* pestaña Hoy */
    hoy(){
      const vw=vweek(st.week);
      const tomorrow = st.todayIdx===6 ? vweek((st.week+1)%4)[0] : vw[st.todayIdx+1]; /* el domingo, mañana es otra semana */
      const warnings=[];
      tomorrow.forEach(r=>r.meal.dishes.forEach(d=>{
        if(d.prep && String(d.prep).trim() && d.prepWarn!==false) warnings.push({prep:d.prep, dish:d.name});
      }));
      return {
        askWeek: st.curWeek==null,
        browsingOther: st.curWeek!=null && st.week!==st.curWeek ? {week:st.week+1, current:st.curWeek+1} : null,
        weekend: st.todayIdx>=5,
        warnings,
        meals: vw[st.todayIdx].map(r=>mealVM(r,st.todayIdx)),
        canChangeWeek: st.curWeek!=null,
        dayName: dayName(st.todayIdx),
        menuName: viewMenuId()==="base" ? null : seasonLabel(viewMenuId()).toLowerCase(),
        dateLabel: now().getDate()+" de "+MONTHS[now().getMonth()],
        /* tira con los 7 días de esta semana: los pasados apagados, hoy destacado */
        strip: DAYS.map((d,i)=>({idx:i, ini:d.ini, name:d.full, date:addDays(mondayDate(),i).getDate(),
          isToday:i===st.todayIdx, past:i<st.todayIdx, weekend:i>=5}))
      };
    },

    /* pestaña Semana */
    semana(){
      const isCurrent = st.curWeek!=null && st.week===st.curWeek;
      return vweek(st.week).map((refs,d)=>({
        idx:d, name:dayName(d), ini:DAYS[d].ini,
        date: isCurrent ? addDays(mondayDate(),d).getDate() : null,
        isToday:d===st.todayIdx && (isCurrent || st.curWeek==null), past:isCurrent && d<st.todayIdx,
        weekend:d>=5, open:st.openDays.has(d),
        summary:refs.filter(r=>mealKind(r.meal)!=="desayuno").map(r=>({meal:r.meal.name, kind:mealKind(r.meal), text:r.meal.dishes.length ? r.meal.dishes.map(x=>x.name).join(" · ") : "—"})),
        meals:refs.map(r=>mealVM(r,d)),
        hasPrep:refs.some(r=>r.meal.dishes.some(x=>x.prep && String(x.prep).trim()))
      }));
    },
    /* «28 sept – 4 oct» si miras la semana en curso */
    weekRange(){
      if(st.curWeek==null || st.week!==st.curWeek) return null;
      const a=mondayDate(), b=addDays(a,6);
      return a.getDate()+" "+MONTHS_SHORT[a.getMonth()]+" – "+b.getDate()+" "+MONTHS_SHORT[b.getMonth()];
    },

    /* pestaña Compra */
    compra(){
      const s=repo.weekState(st.week);
      const all=items(st.week);
      const hide=repo.hideBasics();
      const breakfast=all.filter(i=>i.breakfast); /* recordatorios: aparte y fuera del total */
      const rest=all.filter(i=>!i.breakfast);
      const shown=hide ? rest.filter(i=>!isBasic(i.item)) : rest;
      const main=shown.filter(i=>!i.allOptional);
      const opt=shown.filter(i=>i.allOptional);
      const done=main.filter(i=>s.checked[i.key]).length;
      const hideDone=repo.hideDone();
      const row=i=>({
        key:i.key, name:cap(i.item), hint:i.hint, qty:rules.itemQtyText(i), checked:!!s.checked[i.key],
        tag: i.breakfast ? null : i.staple ? "siempre" : i.custom ? "tuyo" : i.allOptional ? "opcional" : isBasic(i.item) ? "básico" : null
      });
      const visible=rows=>hideDone ? rows.filter(r=>!r.checked) : rows;
      const fd=fromDay(st.week);
      const canTrimPast = st.curWeek!=null && st.week===st.curWeek && !st.shopAutoWeek && st.todayIdx>0;
      const sections=repo.aisleOrder().map(id=>{
        const its=main.filter(i=>sectionFor(i.item)===id);
        return {id, label:sectionLabel(id), done:its.filter(i=>s.checked[i.key]).length, rows:its.map(row)};
      }).filter(x=>x.rows.length);
      const aisle = sections.some(x=>x.id===st.aisle) ? st.aisle : "all";
      return {
        filters:[{id:"all", label:"Todo", count:main.length, selected:aisle==="all"}]
          .concat(sections.map(x=>({id:x.id, label:x.label, count:x.done+"/"+x.rows.length, selected:aisle===x.id}))),
        visibleSections: (aisle==="all" ? sections : sections.filter(x=>x.id===aisle))
          .map(x=>({...x, rows:visible(x.rows)})).filter(x=>x.rows.length),
        showOptionals: aisle==="all",
        hideDone, hiddenDone: hideDone ? done+opt.concat(breakfast).filter(i=>s.checked[i.key]).length : 0,
        /* días ya pasados que no se cuentan (o que sí, si lo has pedido) */
        pastDays: canTrimPast ? {names:DAYS.slice(0,st.todayIdx).map(d=>d.full.toLowerCase()), excluded:fd>0} : null,
        autoWeek: st.shopAutoWeek ? st.week+1 : null,
        done, total:main.length, pct: main.length ? Math.round(done/main.length*100) : 0,
        hideBasics:hide,
        people:people(), basePeople:rules.BASE_PEOPLE,
        sections, optionals:visible(opt.map(row)),
        breakfast:visible(breakfast.map(row)), breakfastCount:breakfast.length,
        empty: (shown.length || breakfast.length) ? null : (hide ? "Todo lo de esta semana son básicos que ya tienes." : "No hay nada en la lista de esta semana.")
      };
    },

    /* ficha de un producto de la lista */
    shopItem(key){
      const i=items(st.week).find(x=>x.key===key);
      if(!i) return null;
      let note=null;
      if(!i.custom){
        note="Suma de todas las comidas de la semana. Puedes ajustarla.";
        if(i.extra && i.extra.length) note+=" Viene en unidades distintas ("+rules.itemQtyText(i)+"): si la cambias, se queda sólo la tuya.";
        if(!i.overridden && people()!==rules.BASE_PEOPLE) note+=" Ya está calculada para "+people()+" personas.";
      }
      if(i.staple) note = i.breakfast ? "Recordatorio para el desayuno: no cuenta en el total. Márcalo sólo si te hace falta."
                                     : "Sale en la lista todas las semanas. Si esta semana no lo necesitas, quítalo sólo de esta semana.";
      return {
        key:i.key, custom:i.custom, staple:!!i.staple, breakfast:!!i.breakfast, title:cap(i.item),
        subtitle:sectionLabel(sectionFor(i.item))+" · Semana "+(st.week+1),
        hint:i.hint, qty: i.qty!=null ? fmt(i.qty) : "", unit:i.unit||"", note,
        basic:!i.custom && isBasic(i.item),
        origins:i.origins.map(o=>({day:dayName(o.day), meal:o.meal, dish:o.dish, qty:qtyText(o.qty,o.unit)||"—"}))
      };
    },

    /* ventana «¿Compra hecha?» */
    closingSummary(){
      const c=this.compra();
      const left=[];
      c.sections.forEach(sc=>sc.rows.forEach(r=>{ if(!r.checked) left.push(r.name.toLowerCase()); }));
      return {week:st.week+1, done:c.done, total:c.total, left};
    },

    /* texto para compartir la lista */
    shareText(onlyLeft){
      const s=repo.weekState(st.week);
      const hide=repo.hideBasics();
      let its=items(st.week);
      if(hide) its=its.filter(i=>!isBasic(i.item));
      if(onlyLeft) its=its.filter(i=>!s.checked[i.key]);
      const lines=[];
      const line=i=>{ const q=rules.itemQtyText(i); lines.push("- "+cap(i.item)+(q?" — "+q:"")); };
      repo.aisleOrder().forEach(id=>{
        const part=its.filter(i=>!i.allOptional && !i.breakfast && sectionFor(i.item)===id);
        if(!part.length) return;
        lines.push(sectionLabel(id).toUpperCase()); part.forEach(line); lines.push("");
      });
      const opt=its.filter(i=>i.allOptional);
      if(opt.length){ lines.push("OPCIONALES"); opt.forEach(line); lines.push(""); }
      const bf=its.filter(i=>i.breakfast);
      if(bf.length){ lines.push("PARA EL DESAYUNO (si falta)"); bf.forEach(line); lines.push(""); }
      const fd=fromDay(st.week);
      return ("Compra · semana "+(st.week+1)+(fd>0 ? " (desde el "+dayName(fd).toLowerCase()+")" : "")+"\n\n"+lines.join("\n")).trim();
    },

    /* editor de un plato: devuelve el plato (se edita a través de los comandos de abajo) */
    dish(ref){
      const meal=menu()[st.week][ref.d].meals[ref.mi];
      const dish=meal && meal.dishes[ref.si];
      if(!dish) return null;
      const sd = ref.shownDay==null ? ref.d : ref.shownDay;
      return {
        subtitle:dayName(sd)+" · "+meal.name+" · Semana "+(st.week+1),
        kind:mealKind(meal),
        name:dish.name,
        ingredients:dish.ingredients.map(i=>({item:i.item, qty:i.qty!=null?i.qty:"", unit:i.unit||""})),
        prep:dish.prep||"", prepWarn:dish.prepWarn!==false
      };
    },

    /* buscador */
    search(q){
      const hits=rules.searchDishes(menu(),q);
      if(hits==null) return null;
      return hits.map(h=>({
        where:"Semana "+(h.ctx.wi+1)+" · "+dayName(h.ctx.di)+" · "+h.ctx.meal.name,
        name:h.dish.name,
        why: h.why ? "lleva "+h.why.toLowerCase() : null,
        ctx:{wi:h.ctx.wi, d:h.ctx.di, mi:h.ctx.mi, si:h.ctx.si}
      }));
    },

    aisles(){ return repo.aisleOrder().map(id=>({id, label:sectionLabel(id)})); },

    /* ventana «Cambiar con otro día» */
    swapInfo(dayIdx,what){
      const vw=vweek(st.week);
      const names=vw[dayIdx].map(r=>r.meal.name);
      const targets=[];
      for(let d=0;d<7;d++){
        if(d===dayIdx) continue;
        const refs = what==null ? vw[d] : vw[d].filter(r=>r.meal.name===what);
        if(!refs.length) continue;
        targets.push({d, name:dayName(d), isToday:d===st.todayIdx,
          lines:refs.map(r=>(what==null ? r.meal.name+": " : "")+(r.meal.dishes.map(x=>x.name).join(", ")||"—"))});
      }
      return {title:"Cambiar el "+dayName(dayIdx).toLowerCase(), week:st.week+1,
        choices: names.length>1 ? names : [], targets, hasSwaps: swapsFor(st.week).length>0};
    },

    backupJSON(){ return JSON.stringify(repo.exportData(),null,2); },

    /* panel de ajustes: estaciones */
    seasonInfo(){
      const setting=repo.seasonSetting(), cur=seasonNow(), live=liveMenuId();
      return {
        setting, auto:seasonOf(now()), autoLabel:seasonLabel(seasonOf(now())),
        nowLabel:seasonLabel(cur), usingBase: live==="base",
        seasons:SEASONS.map(s=>({...s, hasMenu:repo.hasSeasonMenu(s.id), isNow:s.id===cur, inUse:s.id===live}))
      };
    },
    /* aviso «estás viendo el menú de verano» */
    seasonBanner(){
      if(!st.seasonView || st.seasonView===seasonNow()) return null;
      return {label:seasonLabel(st.seasonView)};
    },
    theme(){ return repo.theme(); },

    /* ================= ÓRDENES (COMANDOS) =================
       Las que se pueden deshacer devuelven una función que lo deshace. */

    selectWeek(w){ st.week=w; st.shopAutoWeek=false; notify(); },

    /* --- estaciones --- */
    setSeasonSetting(v){ repo.setSeasonSetting(v); st.seasonView=null; notify(); },
    createSeasonMenu(s,mode){
      repo.createSeasonMenu(s,mode); notify();
      return ()=>{ repo.deleteSeasonMenu(s); if(st.seasonView===s) st.seasonView=null; notify(); };
    },
    deleteSeasonMenu(s){
      const raw=repo.deleteSeasonMenu(s);
      if(st.seasonView===s) st.seasonView=null;
      notify();
      return ()=>{ repo.restoreSeasonMenu(s,raw); notify(); };
    },
    /* abrir el menú de otra estación para verlo o editarlo */
    viewSeason(s){
      st.seasonView = s===seasonNow() ? null : s;
      st.shopAutoWeek=false; st.week = st.curWeek==null ? 0 : st.curWeek;
      this.setView("semana");
    },
    stopViewingSeason(){ st.seasonView=null; st.week = st.curWeek==null ? 0 : st.curWeek; notify(); },

    setView(v){
      st.view=v;
      /* sábado y domingo: la compra enseña ya la semana que viene */
      if(v==="shop"){
        if(!st.shopAutoWeek && st.curWeek!=null && st.week===st.curWeek && st.todayIdx>=5 && st.shopDeclined!==st.todayKey){
          st.week=(st.curWeek+1)%4; st.shopAutoWeek=true;
        }
      }else if(st.shopAutoWeek){
        st.week=st.curWeek; st.shopAutoWeek=false;
      }
      notify();
    },
    declineAutoWeek(){ st.shopAutoWeek=false; st.shopDeclined=st.todayKey; st.week=st.curWeek; notify(); },
    backToCurrentWeek(){ st.week=st.curWeek; st.shopAutoWeek=false; notify(); },

    toggleDay(d){ if(st.openDays.has(d)) st.openDays.delete(d); else st.openDays.add(d); }, /* sin repintar: la View anima */
    openDay(d){ st.openDays.add(d); },
    /* desde la tira de días de Hoy: ir a ese día en Semana */
    goToDay(d){ st.openDays.add(d); if(st.curWeek!=null) st.week=st.curWeek; this.setView("semana"); },

    /* «esta semana toca la w» */
    setCurrentWeek(w){
      const before=repo.cycleStart();
      repo.setCycleStart(startFor(now(),w));
      st.curWeek=w; st.week=w; st.shopAutoWeek=false;
      notify();
      return ()=>{
        if(before) repo.setCycleStart(before);
        st.curWeek=cycleWeekOn(now(),repo.cycleStart()); st.week=st.curWeek==null?0:st.curWeek;
        notify();
      };
    },

    /* Si la app se queda abierta y cambia el día, ponerse al día */
    checkDate(){
      const k=isoDate(now());
      if(k===st.todayKey) return false;
      st.todayKey=k;
      st.todayIdx=weekdayIndex(now());
      st.curWeek=cycleWeekOn(now(),repo.cycleStart());
      if(st.curWeek!=null) st.week=st.curWeek;
      st.shopAutoWeek=false; st.includePast=false;
      st.openDays.clear(); st.openDays.add(st.todayIdx);
      this.setView(st.view);
      return true;
    },

    openSearchResult(ctx){
      st.week=ctx.wi; st.shopAutoWeek=false; st.openDays.add(ctx.d);
      this.setView("semana");
    },

    /* --- lista de la compra --- */
    toggleChecked(key){ editWeekState(st.week,s=>{ s.checked[key]=!s.checked[key]; }); notify(); },
    setAisle(id){ st.aisle=id; notify(); },
    toggleHideDone(){ repo.setHideDone(!repo.hideDone()); notify(); },
    setIncludePast(on){ st.includePast=!!on; notify(); },

    /* --- productos fijos --- */
    /* algo que añadiste esta semana pasa a salir todas las semanas */
    makeStaple(key,group){
      const w=st.week, beforeWeek=clone(repo.weekState(w)), beforeStaples=repo.staples();
      const c=(beforeWeek.custom||[]).find(x=>x.key===key);
      if(!c) return null;
      const nk="fijo::"+Date.now()+"::"+norm(c.item);
      repo.saveStaples(beforeStaples.concat([{key:nk, item:c.item, qty:c.qty, unit:c.unit, group:group||"fijo"}]));
      editWeekState(w,s=>{
        s.custom=(s.custom||[]).filter(x=>x.key!==key);
        if(s.checked[key]){ s.checked[nk]=true; delete s.checked[key]; }
      });
      notify();
      return ()=>{ repo.saveStaples(beforeStaples); repo.saveWeekState(w,beforeWeek); notify(); };
    },
    /* deja de salir todas las semanas */
    unStaple(key){
      const beforeStaples=repo.staples();
      repo.saveStaples(beforeStaples.filter(x=>x.key!==key));
      editWeekState(st.week,s=>{ delete s.checked[key]; });
      notify();
      return ()=>{ repo.saveStaples(beforeStaples); notify(); };
    },
    staplesList(){ return repo.staples().map(x=>({key:x.key, name:cap(x.item)})); },
    /* recordatorios de desayuno */
    breakfastList(){ return repo.staples().filter(x=>x.group==="desayuno").map(x=>({key:x.key, name:cap(x.item)})); },
    addBreakfast(name){
      const n=String(name||"").trim(); if(!n) return null;
      const before=repo.staples();
      repo.saveStaples(before.concat([{key:"fijo::"+Date.now()+"::"+norm(n), item:n, qty:null, unit:null, group:"desayuno"}]));
      notify();
      return ()=>{ repo.saveStaples(before); notify(); };
    },
    toggleHideBasics(){ repo.setHideBasics(!repo.hideBasics()); notify(); },
    changePeople(delta){
      const n=Math.min(12,Math.max(1,people()+delta));
      repo.setPeople(n); notify();
    },
    addCustom(name,qty,unit){
      const w=st.week;
      editWeekState(w,s=>{
        s.custom=s.custom||[];
        s.custom.push({key:"custom::"+Date.now()+"::"+norm(name), item:name,
          qty: qty!=null && !isNaN(qty) ? qty : null, unit:unit||null});
      });
      notify();
      return ()=>{ editWeekState(w,s=>{ s.custom=(s.custom||[]).slice(0,-1); }); notify(); };
    },
    setItemQty(key,qty,unit){
      const v = qty==null || isNaN(qty) ? null : qty;
      if(isStaple(key)){
        repo.saveStaples(repo.staples().map(x=>x.key===key ? {...x, qty:v, unit:unit||null} : x));
        notify(); return;
      }
      editWeekState(st.week,s=>{
        const c=(s.custom||[]).find(x=>x.key===key);
        if(c){ c.qty=v; c.unit=unit||null; }
        else s.overrides[key]=v;
      });
      notify();
    },
    toggleBasic(key){
      const i=items(st.week).find(x=>x.key===key);
      if(!i) return;
      const ov=basicOv();
      ov[itemKey(i.item)]=!isBasic(i.item);
      repo.saveBasicsOverrides(ov);
      notify();
    },
    removeItem(key){
      const w=st.week;
      const before=clone(repo.weekState(w));
      editWeekState(w,s=>{
        if(key.indexOf("custom::")===0) s.custom=(s.custom||[]).filter(x=>x.key!==key);
        else if(!s.removed.includes(key)) s.removed.push(key);
        delete s.checked[key];
      });
      notify();
      return ()=>{ repo.saveWeekState(w,before); notify(); };
    },
    closeShopping(){
      const w=st.week;
      let before;
      let beforeRemoved;
      editWeekState(w,s=>{
        before=clone(s.checked); beforeRemoved=clone(s.removed||[]);
        s.checked={};
        s.removed=(s.removed||[]).filter(k=>!isStaple(k)); /* los fijos vuelven la próxima vez */
      });
      notify();
      return ()=>{ editWeekState(w,s=>{ s.checked=before; s.removed=beforeRemoved; }); notify(); };
    },

    /* --- editar platos --- */
    renameDish(ref,name){ const d=dishAt(ref); d.name=name.trim()||"Plato sin nombre"; repo.saveMenu(); notify(); },
    setIngredient(ref,idx,field,value){
      const row=dishAt(ref).ingredients[idx];
      if(field==="item") row.item=value;
      else if(field==="qty") row.qty = String(value).trim()==="" ? null : parseFloat(value);
      else if(field==="unit") row.unit=String(value).trim()||null;
      repo.saveMenu(); notify();
    },
    addIngredient(ref){ dishAt(ref).ingredients.push({qty:null,unit:null,item:""}); repo.saveMenu(); notify(); },
    removeIngredient(ref,idx){
      const list=dishAt(ref).ingredients;
      const removed=clone(list[idx]);
      list.splice(idx,1); repo.saveMenu(); notify();
      return ()=>{ list.splice(idx,0,removed); repo.saveMenu(); notify(); };
    },
    setPrep(ref,text){
      const d=dishAt(ref); d.prep=text;
      if(d.prepWarn===undefined) d.prepWarn=true;
      repo.saveMenu(); notify();
    },
    togglePrepWarn(ref){ const d=dishAt(ref); d.prepWarn=(d.prepWarn===false); repo.saveMenu(); notify(); },
    /* añade un plato vacío y devuelve dónde ha quedado, para abrir el editor */
    addDish(ref,shownDay){
      const meal=menu()[st.week][ref.d].meals[ref.mi];
      meal.dishes.push({name:"Nuevo plato",ingredients:[]});
      repo.saveMenu(); st.openDays.add(shownDay); notify();
      return {d:ref.d, mi:ref.mi, si:meal.dishes.length-1, shownDay};
    },
    deleteDish(ref){
      const meal=menu()[st.week][ref.d].meals[ref.mi];
      const removed=clone(meal.dishes[ref.si]);
      meal.dishes.splice(ref.si,1); repo.saveMenu(); notify();
      return {name:removed.name, undo:()=>{ meal.dishes.splice(ref.si,0,removed); repo.saveMenu(); notify(); }};
    },

    /* --- pasillos --- */
    moveAisle(idx,dir){
      const ids=repo.aisleOrder(), j=idx+dir;
      if(j<0 || j>=ids.length) return;
      const t=ids[j]; ids[j]=ids[idx]; ids[idx]=t;
      repo.saveAisles(ids); notify();
    },
    resetAisles(){ repo.saveAisles(repo.defaultAisles()); notify(); },

    /* --- cambiar días (sólo esta semana) --- */
    swapDays(a,b,meal){
      const w=st.week, before=swapsFor(w).slice();
      repo.saveSwaps(now(),w,before.concat([{a,b,meal}]));
      notify();
      return ()=>{ repo.saveSwaps(now(),w,before); notify(); };
    },
    clearSwaps(){
      const w=st.week, before=swapsFor(w).slice();
      repo.saveSwaps(now(),w,[]); notify();
      return ()=>{ repo.saveSwaps(now(),w,before); notify(); };
    },

    /* --- copia de seguridad --- */
    markBackup(){ repo.markBackup(now().getTime()); notify(); },
    snoozeBackup(){ repo.setSnooze(now().getTime()+7*DAY_MS); notify(); },
    importBackup(text){ return repo.importData(text); }, /* null si fue bien; si no, el motivo */
    resetMenu(){
      const before=repo.menuSnapshot();
      repo.resetMenu(); notify();
      return ()=>{ repo.restoreMenuSnapshot(before); notify(); };
    },

    setTheme(t){ repo.setTheme(t); }
  };
}
