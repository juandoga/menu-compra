/* MODEL · El «almacén» de la app: lee y guarda cada tipo de dato.
   El ViewModel le pide cosas («dame el menú», «guarda lo marcado de la semana 2»)
   sin saber cómo ni dónde se guardan. */

import * as store from "./storage.js";
import { KEYS, BACKUP_KEYS } from "./storage.js";
import { DEFAULT_MENU } from "./defaultMenu.js";
import { SECTIONS } from "./sections.js";
import { clone } from "./text.js";
import { isoDate, mondayOf } from "./calendar.js";

/* ---------- menú de 4 semanas ---------- */

/* Menús guardados con versiones antiguas de la app: se pasan al formato actual (comida / cena) */
function migrate(menu){
  return menu.map(week=>week.map((day,di)=>{
    if(day && Array.isArray(day.meals)) return day;
    const ds=(day && day.dishes) || [];
    if(di>=5 || ds.length<2) return {meals:[{id:"libre",name:"Libre",dishes:ds}]};
    return {meals:[
      {id:"comida",name:"Comida",dishes:ds.slice(0,-1)},
      {id:"cena",  name:"Cena",  dishes:ds.slice(-1)}
    ]};
  }));
}
function loadMenu(){
  let m;
  try{
    const raw=store.get(KEYS.menu);
    m=migrate(raw ? JSON.parse(raw) : clone(DEFAULT_MENU));
  }catch(e){ m=migrate(clone(DEFAULT_MENU)); }
  if(!Array.isArray(m) || m.length!==4) m=migrate(clone(DEFAULT_MENU));
  return m;
}

let MENU=loadMenu();

/* El menú se devuelve «vivo»: quien lo cambie debe llamar luego a saveMenu() */
export function getMenu(){ return MENU; }
export function saveMenu(){ store.setJSON(KEYS.menu, MENU); }
export function menuSnapshot(){ return store.get(KEYS.menu); }
export function resetMenu(){ MENU=migrate(clone(DEFAULT_MENU)); saveMenu(); }
export function restoreMenuSnapshot(raw){
  if(raw!=null) store.set(KEYS.menu,raw);
  MENU=loadMenu();
}

/* ---------- lo marcado en la lista de cada semana ---------- */
export function weekState(w){
  const s=store.getJSON(KEYS.week+w,null);
  return s || {checked:{},overrides:{},removed:[],custom:[]};
}
export function saveWeekState(w,s){ store.setJSON(KEYS.week+w, s); }

/* ---------- básicos de despensa (lo que casi siempre hay en casa) ---------- */
export function basicsOverrides(){ return store.getJSON(KEYS.basics,{}) || {}; }
export function saveBasicsOverrides(o){ store.setJSON(KEYS.basics,o); }
export function hideBasics(){ return store.get(KEYS.hide)==="1"; }
export function setHideBasics(on){ store.set(KEYS.hide, on?"1":"0"); }

/* ---------- orden de los pasillos ---------- */
export function aisleOrder(){
  let ids=store.getJSON(KEYS.aisles,null);
  const valid=SECTIONS.map(s=>s.id);
  if(!Array.isArray(ids)) ids=[];
  ids=ids.filter(i=>valid.indexOf(i)>=0);
  valid.forEach(i=>{ if(ids.indexOf(i)<0) ids.push(i); });
  return ids;
}
export function saveAisles(ids){ store.setJSON(KEYS.aisles, ids); }
export function defaultAisles(){ return SECTIONS.map(s=>s.id); }

/* ---------- ajustes ---------- */
export function cycleStart(){ return store.get(KEYS.start); }
export function setCycleStart(iso){ if(iso) store.set(KEYS.start,iso); }
export function peopleSetting(){ return store.get(KEYS.people); }
export function setPeople(n){ store.set(KEYS.people,String(n)); }
export function theme(){ return store.get(KEYS.theme); }
export function setTheme(t){ store.set(KEYS.theme,t); }

/* ---------- cambios de día: sólo valen la semana real en que se hicieron ---------- */
export function loadSwaps(today){
  const s=store.getJSON(KEYS.swaps,null);
  if(s && s.monday===isoDate(mondayOf(today)) && Array.isArray(s.list)) return s;
  return null;
}
export function saveSwaps(today,w,list){
  if(!list.length){ store.remove(KEYS.swaps); return; }
  store.setJSON(KEYS.swaps,{monday:isoDate(mondayOf(today)), week:w, list:list});
}

/* ---------- copia de seguridad ---------- */
export function lastBackup(){ return parseInt(store.get(KEYS.backup),10) || null; }
export function markBackup(now){ store.set(KEYS.backup,String(now)); }
export function firstSeen(now){
  let v=parseInt(store.get(KEYS.seen),10);
  if(!v){ v=now; store.set(KEYS.seen,String(now)); }
  return v;
}
export function snoozeUntil(){ return parseInt(store.get(KEYS.snooze),10) || null; }
export function setSnooze(until){ store.set(KEYS.snooze,String(until)); }
/* ¿Hay algo tuyo que merezca copia? (cambios en el menú, la lista, pasillos…) */
export function hasOwnData(){
  return [KEYS.menu,KEYS.basics,KEYS.aisles,KEYS.week+"0",KEYS.week+"1",KEYS.week+"2",KEYS.week+"3"]
    .some(k=>store.get(k)!=null);
}
export function exportData(){
  const out={app:"menuse",version:1,exported:new Date().toISOString(),data:{}};
  BACKUP_KEYS.forEach(k=>{ const v=store.get(k); if(v!=null) out.data[k]=v; });
  if(out.data[KEYS.menu]==null) out.data[KEYS.menu]=JSON.stringify(MENU);
  return out;
}
/* Devuelve null si ha ido bien, o el motivo si no */
export function importData(text){
  let obj;
  try{ obj=JSON.parse(text); }catch(e){ return "Ese texto no es una copia válida de Menuse."; }
  if(!obj || (obj.app!=="menuse" && obj.app!=="vianda") || !obj.data) return "Ese archivo no es una copia de Menuse.";
  Object.keys(obj.data).forEach(k=>{ if(BACKUP_KEYS.indexOf(k)>=0) store.set(k,obj.data[k]); });
  MENU=loadMenu();
  return null;
}
