/* MODEL · Dónde se guarda todo: el almacenamiento del navegador (localStorage).
   Nadie más en la app habla con localStorage.
   Si el móvil está en una «casa compartida», cada cambio en algo de la casa se apunta
   como «pendiente de enviar»: sync.js lo manda al servidor en cuanto puede. */

export const KEYS = {
  menu:    "menuCompraApp_menuData_v1",
  basics:  "menuCompraApp_basics_v2",
  hide:    "menuCompraApp_hideBasics_v1",
  week:    "menuCompraApp_w2_",           /* + número de semana (0 a 3) */
  theme:   "menuCompraApp_theme_v1",
  aisles:  "menuCompraApp_aisles_v1",
  start:   "menuCompraApp_cycleStart_v1", /* lunes en que empezó una Semana 1 */
  people:  "menuCompraApp_people_v1",     /* para cuántas personas se compra */
  swaps:   "menuCompraApp_swaps_v1",      /* cambios de día de la semana en curso */
  backup:  "menuCompraApp_lastBackup_v1", /* última copia de seguridad */
  seen:    "menuCompraApp_firstSeen_v1",  /* desde cuándo se usa esta versión */
  snooze:  "menuCompraApp_backupSnooze_v1",/* «recuérdamelo luego» */
  staples: "menuCompraApp_staples_v1",    /* productos fijos: salen todas las semanas */
  hideDone:"menuCompraApp_hideChecked_v1",/* ocultar lo ya comprado en la lista */
  bfSeeded:"menuCompraApp_breakfastSeeded_v1", /* ya se crearon los recordatorios de desayuno */
  season:  "menuCompraApp_season_v1",
  spend:   "menuCompraApp_spending_v1",   /* lo que costó cada compra */
  notify:  "menuCompraApp_notify_v1",     /* avisos del congelador en el móvil: "1" activados */
  seasonMenu:"menuCompraApp_menu_",       /* + estación: el menú propio de esa estación */
  house:   "menuCompraApp_house_v1",      /* código de la casa compartida (si estás en una) */
  pending: "menuCompraApp_syncPending_v1",/* lo cambiado que aún no ha llegado al servidor */
  lastPull:"menuCompraApp_syncLast_v1"    /* hasta cuándo se han recibido los cambios de la casa */
};

/* Lo que es de cada móvil y NO se comparte con la casa: el aspecto, los avisos, los recordatorios
   de copia y cómo prefiere ver la lista cada uno. Todo lo demás (menús, listas, fijos, pasillos,
   personas, gasto…) es de la casa. */
const PERSONAL=[KEYS.theme,KEYS.backup,KEYS.seen,KEYS.snooze,KEYS.hideDone,KEYS.hide,KEYS.notify,
  KEYS.house,KEYS.pending,KEYS.lastPull];
export function isShared(k){ return typeof k==="string" && k.indexOf("menuCompraApp_")===0 && PERSONAL.indexOf(k)<0; }
const SEASON_IDS=["primavera","verano","otono","invierno"];

/* Lo que entra en la copia de seguridad */
export const BACKUP_KEYS = [KEYS.menu,KEYS.basics,KEYS.hide,KEYS.theme,KEYS.aisles,KEYS.start,KEYS.people,KEYS.staples,KEYS.hideDone,
  KEYS.week+"0",KEYS.week+"1",KEYS.week+"2",KEYS.week+"3",KEYS.season,KEYS.spend,KEYS.notify]
  /* menús por estación y lo marcado en cada una de sus semanas */
  .concat(...SEASON_IDS.map(s=>[KEYS.seasonMenu+s].concat([0,1,2,3].map(w=>KEYS.week+s+"_"+w))));

/* Si el navegador no deja guardar (modo privado…), la app sigue funcionando sin romperse */
export function get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
export function set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} changed(k); }
export function remove(k){ try{ localStorage.removeItem(k); }catch(e){} changed(k); }

/* ---------- casa compartida ---------- */
/* Guardar sin apuntarlo como pendiente: lo usa sync.js al escribir lo que llega de la casa */
export function setQuiet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
export function removeQuiet(k){ try{ localStorage.removeItem(k); }catch(e){} }
/* todas las claves de la casa que hay guardadas en este móvil */
export function sharedKeys(){
  const out=[];
  try{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(isShared(k)) out.push(k); } }catch(e){}
  return out;
}
export function pendingKeys(){ return getJSON(KEYS.pending,[]) || []; }
export function setPendingKeys(list){ list.length ? setQuiet(KEYS.pending,JSON.stringify(list)) : removeQuiet(KEYS.pending); }
let onChange=null;
/* sync.js se apunta aquí para enterarse de cada cambio y enviarlo */
export function onSharedChange(fn){ onChange=fn; }
function changed(k){
  if(!isShared(k) || get(KEYS.house)==null) return;
  const p=pendingKeys();
  if(p.indexOf(k)<0){ p.push(k); setPendingKeys(p); }
  if(onChange) onChange(k);
}
export function getJSON(k,fallback){
  try{ const r=get(k); return r==null ? fallback : JSON.parse(r); }catch(e){ return fallback; }
}
export function setJSON(k,v){ set(k,JSON.stringify(v)); }
