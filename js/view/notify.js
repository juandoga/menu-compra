/* VIEW · Avisos del congelador en el móvil.
   Una app web no puede programar una notificación a una hora exacta. Lo que sí puede, instalada,
   es pedir a Android que la despierte de vez en cuando («periodic background sync»): entonces el
   service worker (sw.js) mira el plan que dejamos guardado aquí y, si hoy toca sacar algo,
   muestra la notificación. Android decide cuándo la despierta (suele ser 1–2 veces al día). */

const PLAN_CACHE="menuse-avisos";   /* el sw.js no borra esta caja al actualizarse */
const PLAN_URL="./__avisos.json";

export function notifySupported(){
  return "Notification" in window && "serviceWorker" in navigator;
}
export function permission(){ return notifySupported() ? Notification.permission : "denied"; }

/* Pide permiso y registra la revisión periódica. Devuelve true si quedan activados. */
export async function enableNotifications(vm){
  if(!notifySupported()) return false;
  let p=Notification.permission;
  if(p==="default") p=await Notification.requestPermission();
  if(p!=="granted") return false;
  await registerSync();
  await publishPlan(vm,true);
  return true;
}

async function registerSync(){
  try{
    const reg=await navigator.serviceWorker.ready;
    if("periodicSync" in reg){
      await reg.periodicSync.register("congelador",{minInterval:6*60*60*1000}); /* cada 6 h como mínimo */
      return true;
    }
  }catch(e){}
  return false;
}

/* ¿Android dejará despertar la app? (sólo con la app instalada y Chrome) */
export async function backgroundSupported(){
  try{
    const reg=await navigator.serviceWorker.ready;
    if(!("periodicSync" in reg)) return false;
    const st=await navigator.permissions.query({name:"periodic-background-sync"});
    return st.state==="granted";
  }catch(e){ return false; }
}

/* Deja guardado el plan de los próximos días para que el service worker lo lea */
export async function publishPlan(vm,force){
  if(!("caches" in window)) return;
  try{
    const on=force || vm.notifyOn();
    const body=JSON.stringify({on, plan: on ? vm.thawPlan() : [], updated:Date.now()});
    const c=await caches.open(PLAN_CACHE);
    await c.put(PLAN_URL,new Response(body,{headers:{"Content-Type":"application/json"}}));
  }catch(e){}
}

/* Notificación de prueba al activarlos, para que veas cómo llegan */
export async function testNotification(){
  try{
    const reg=await navigator.serviceWorker.ready;
    await reg.showNotification("Menuse · avisos activados",{
      body:"Así te avisaré la víspera de lo que tengas que sacar del congelador.",
      icon:"icon-192.png", badge:"icon-192.png", tag:"menuse-prueba"});
  }catch(e){}
}
