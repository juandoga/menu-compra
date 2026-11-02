/* MODEL · Casa compartida: el mismo menú y la misma lista en varios móviles.
   Cómo funciona, en sencillo:
   - Cada casa tiene un código (por ejemplo K7PM-3QXD). Todos los móviles con ese código comparten datos.
   - Cada móvil sigue guardando todo en su navegador, así funciona igual sin conexión.
   - Cuando cambias algo, storage.js lo apunta como «pendiente» y aquí se envía al servidor (Supabase).
   - Cada poco rato (y al volver a la app) se piden al servidor los cambios de los demás.
   - Si dos personas cambian lo mismo a la vez, se queda el último cambio que llegue.
   No sabe nada de la pantalla: quien lo usa (el ViewModel) decide cuándo repintar. */

import * as store from "./storage.js";
import { KEYS } from "./storage.js";

/* Servidor: proyecto de Supabase. La clave es «publicable»: puede ir en la web sin peligro,
   porque sólo deja usar las cuatro funciones menuse_* (las tablas no se ven desde fuera). */
const API="https://yzreenyaerjitbfxsiah.supabase.co/rest/v1/rpc/";
const API_KEY="sb_publishable_1As_Elit5MJVUOZFOLeDjA_YMVv6jjF";
const OVERLAP_MS=5000; /* al pedir cambios se repiten los últimos 5 s, por si alguno llegó tarde */

/* se puede cambiar en las pruebas para no llamar a internet de verdad */
let fetchFn=(...a)=>fetch(...a);
export function _setFetch(fn){ fetchFn=fn; }

/* ---------- estado (para enseñarlo en Ajustes) ---------- */
let status={state:"idle", at:null}; /* idle · ok · offline · error · gone */
const listeners=new Set();
export function onStatus(fn){ listeners.add(fn); return ()=>listeners.delete(fn); }
function setStatus(state){ status={state, at:Date.now()}; listeners.forEach(fn=>fn(status)); }
export function syncStatus(){ return status; }

export function houseCode(){ return store.get(KEYS.house); }
export function houseName(){ return houseCode() ? (store.get(KEYS.houseName) || "Casa sin nombre") : null; }
const cleanName=n=>String(n||"").trim().replace(/\s+/g," ").slice(0,40);
/* cambiar el nombre: se envía como cualquier otro cambio, y les llega a todos */
export function setHouseName(n){ const c=cleanName(n); if(c) store.set(KEYS.houseName,c); }
const online=()=>typeof navigator==="undefined" || navigator.onLine!==false;

/* «k7pm 3qxd» → «K7PM-3QXD»; si no tiene 8 letras/números, null */
export function normalizeCode(text){
  const c=String(text||"").toUpperCase().replace(/[^A-Z0-9]/g,"");
  return c.length===8 ? c.slice(0,4)+"-"+c.slice(4) : null;
}

/* ---------- hablar con el servidor ---------- */
async function rpc(name,body){
  const res=await fetchFn(API+name,{
    method:"POST",
    headers:{"apikey":API_KEY,"Content-Type":"application/json"},
    body:JSON.stringify(body||{})
  });
  const text=await res.text();
  let data=null; try{ data=text ? JSON.parse(text) : null; }catch(e){}
  if(!res.ok){
    const err=new Error((data && data.message) || ("error "+res.status));
    err.gone = !!(data && data.message==="casa_no_existe");
    throw err;
  }
  return data;
}

/* ---------- enviar lo pendiente ---------- */
let pushing=null, pushTimer=null;
function schedulePush(){
  clearTimeout(pushTimer);
  pushTimer=setTimeout(()=>{ push().catch(()=>{}); },1200);
}
/* cada cambio en algo de la casa → enviar en un momento (se juntan los cambios seguidos) */
store.onSharedChange(()=>schedulePush());

export async function push(){
  if(pushing) return pushing;
  pushing=(async()=>{
    const code=houseCode();
    const keys=store.pendingKeys();
    if(!code || !keys.length) return true;
    if(!online()){ setStatus("offline"); return false; }
    try{
      for(let i=0;i<keys.length;i+=50){
        const part=keys.slice(i,i+50);
        const sent=part.map(k=>({k, v:store.get(k)}));
        await rpc("menuse_guardar",{p_codigo:code, p_cambios:sent});
        /* sólo se quita de pendientes si no ha vuelto a cambiar mientras se enviaba */
        const left=store.pendingKeys().filter(k=>{ const s=sent.find(x=>x.k===k); return !s || store.get(k)!==s.v; });
        store.setPendingKeys(left);
      }
      setStatus("ok");
      return true;
    }catch(e){
      setStatus(e.gone ? "gone" : (online() ? "error" : "offline"));
      return false;
    }
  })();
  try{ return await pushing; } finally{ pushing=null; }
}

/* ---------- recibir los cambios de los demás ---------- */
/* Devuelve true si ha cambiado algo en este móvil (y hay que repintar) */
let pulling=null;
export async function pull(){
  if(pulling) return pulling;
  pulling=(async()=>{
    const code=houseCode();
    if(!code) return false;
    if(!online()){ setStatus("offline"); return false; }
    await push();
    try{
      const last=store.get(KEYS.lastPull);
      const since = last ? new Date(Date.parse(last)-OVERLAP_MS).toISOString() : null;
      const rows=await rpc("menuse_leer",{p_codigo:code, p_desde:since}) || [];
      const changed=applyRows(rows,false);
      setStatus("ok");
      return changed;
    }catch(e){
      setStatus(e.gone ? "gone" : (online() ? "error" : "offline"));
      return false;
    }
  })();
  try{ return await pulling; } finally{ pulling=null; }
}

/* escribe en este móvil lo que llega del servidor; lo que tú tienes pendiente de enviar no se pisa */
function applyRows(rows,all){
  const pending=all ? [] : store.pendingKeys();
  let changed=false, newest=store.get(KEYS.lastPull);
  rows.forEach(r=>{
    if(!r || !store.isShared(r.clave)) return;
    if(!newest || Date.parse(r.actualizado)>Date.parse(newest)) newest=r.actualizado;
    if(pending.indexOf(r.clave)>=0) return;
    const cur=store.get(r.clave);
    if(r.valor==null){ if(cur!=null){ store.removeQuiet(r.clave); changed=true; } }
    else if(cur!==r.valor){ store.setQuiet(r.clave,r.valor); changed=true; }
  });
  if(newest) store.setQuiet(KEYS.lastPull,newest);
  return changed;
}

/* ---------- crear, unirse, salir ---------- */
/* Crea una casa nueva con lo que hay en este móvil. Devuelve el código. */
export async function createHouse(name){
  const code=await rpc("menuse_crear_casa",{});
  store.setQuiet(KEYS.house,code);
  store.setQuiet(KEYS.houseName,cleanName(name)||"Mi casa");
  store.removeQuiet(KEYS.lastPull);
  store.setPendingKeys(store.sharedKeys());
  const ok=await push();
  if(!ok){ /* no se pudo subir: mejor no quedarse a medias */
    store.removeQuiet(KEYS.house); store.removeQuiet(KEYS.houseName); store.setPendingKeys([]);
    throw new Error("No se pudo subir tu menú a la casa. Prueba otra vez con conexión.");
  }
  return code;
}

/* Antes de unirse: ¿existe esa casa y cómo se llama? Devuelve {code, name} o {error} */
export async function peekHouse(text){
  const code=normalizeCode(text);
  if(!code) return {error:"El código tiene 8 letras y números, como K7PM-3QXD."};
  if(!online()) return {error:"Hace falta conexión para unirse a una casa."};
  try{
    if(!(await rpc("menuse_existe_casa",{p_codigo:code}))) return {error:"No hay ninguna casa con ese código."};
    const rows=await rpc("menuse_leer",{p_codigo:code, p_desde:null}) || [];
    const r=rows.find(x=>x.clave===KEYS.houseName);
    return {code, name:(r && r.valor) || "Casa sin nombre"};
  }catch(e){ return {error:"No se pudo conectar. Prueba otra vez en un momento."}; }
}

/* Une este móvil a una casa que ya existe: lo de la casa sustituye a lo de este móvil.
   Devuelve null si ha ido bien, o el motivo si no. */
export async function joinHouse(text){
  const code=normalizeCode(text);
  if(!code) return "El código tiene 8 letras y números, como K7PM-3QXD.";
  if(!online()) return "Hace falta conexión para unirse a una casa.";
  let rows;
  try{
    if(!(await rpc("menuse_existe_casa",{p_codigo:code}))) return "No hay ninguna casa con ese código.";
    rows=await rpc("menuse_leer",{p_codigo:code, p_desde:null}) || [];
  }catch(e){ return "No se pudo conectar. Prueba otra vez en un momento."; }
  /* si ya estabas en otra casa, antes de irte se envía lo que tuvieras pendiente */
  if(houseCode() && houseCode()!==code) await push();
  store.sharedKeys().forEach(k=>store.removeQuiet(k));
  store.removeQuiet(KEYS.lastPull);
  store.setPendingKeys([]);
  store.setQuiet(KEYS.house,code);
  applyRows(rows,true);
  setStatus("ok");
  return null;
}

/* Este móvil deja la casa: se queda con una copia de lo que hay ahora, ya sin compartir */
export function leaveHouse(){
  clearTimeout(pushTimer);
  store.removeQuiet(KEYS.house);
  store.removeQuiet(KEYS.houseName);
  store.removeQuiet(KEYS.lastPull);
  store.setPendingKeys([]);
  setStatus("idle");
}
