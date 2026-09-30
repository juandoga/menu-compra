/* VIEW · Instalar Menuse como app (no como acceso directo).
   Chrome avisa con el evento «beforeinstallprompt» cuando se puede instalar; aquí se guarda
   ese aviso para lanzarlo cuando pulses «Instalar» en Ajustes. */

let deferred=null;
const listeners=new Set();
const tell=()=>listeners.forEach(fn=>fn());

window.addEventListener("beforeinstallprompt",e=>{
  e.preventDefault();      /* que no salga el aviso de Chrome por su cuenta */
  deferred=e; tell();
});
window.addEventListener("appinstalled",()=>{ deferred=null; tell(); });

/* ¿Se está usando ya como app instalada? */
export function isInstalled(){
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone===true;
}
/* ¿Chrome deja instalarla ahora mismo? */
export function canInstall(){ return !!deferred; }
/* Lanza el aviso de instalación de Chrome; devuelve si se aceptó */
export async function promptInstall(){
  if(!deferred) return false;
  const e=deferred; deferred=null;
  e.prompt();
  const r=await e.userChoice.catch(()=>null);
  tell();
  return !!(r && r.outcome==="accepted");
}
export function onInstallChange(fn){ listeners.add(fn); return ()=>listeners.delete(fn); }
