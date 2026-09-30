/* MODEL · Dónde se guarda todo: el almacenamiento del navegador (localStorage).
   Nadie más en la app habla con localStorage: si algún día se guarda en otro sitio,
   sólo cambia este archivo. */

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
  hideDone:"menuCompraApp_hideChecked_v1" /* ocultar lo ya comprado en la lista */
};

/* Lo que entra en la copia de seguridad */
export const BACKUP_KEYS = [KEYS.menu,KEYS.basics,KEYS.hide,KEYS.theme,KEYS.aisles,KEYS.start,KEYS.people,KEYS.staples,KEYS.hideDone,
  KEYS.week+"0",KEYS.week+"1",KEYS.week+"2",KEYS.week+"3"];

/* Si el navegador no deja guardar (modo privado…), la app sigue funcionando sin romperse */
export function get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
export function set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
export function remove(k){ try{ localStorage.removeItem(k); }catch(e){} }
export function getJSON(k,fallback){
  try{ const r=get(k); return r==null ? fallback : JSON.parse(r); }catch(e){ return fallback; }
}
export function setJSON(k,v){ set(k,JSON.stringify(v)); }
