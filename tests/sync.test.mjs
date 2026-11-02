/* Pruebas de la casa compartida, sin internet: un servidor de mentira y dos «móviles».
   Cada móvil es un almacenamiento distinto; se cambia de uno a otro con usar(). */

import { test } from "node:test";
import assert from "node:assert/strict";

function almacen(){
  const m=new Map();
  return {
    getItem:k=>m.has(k)?m.get(k):null, setItem:(k,v)=>m.set(k,String(v)), removeItem:k=>m.delete(k),
    key:i=>[...m.keys()][i] ?? null, get length(){ return m.size; }, clear:()=>m.clear()
  };
}
const movilJuan=almacen(), movilAna=almacen(), movilOtraCasa=almacen();
const usar=a=>{ globalThis.localStorage=a; };
usar(movilJuan);

/* servidor de mentira: hace lo mismo que las funciones menuse_* de Supabase */
const casas=new Map(); let reloj=Date.parse("2026-11-02T10:00:00Z"); let sinRed=false;
async function fakeFetch(url,opts){
  if(sinRed) throw new TypeError("Failed to fetch");
  const name=url.split("/rpc/")[1], b=JSON.parse(opts.body);
  const res=(status,data)=>({ok:status<300,status,text:async()=>JSON.stringify(data)});
  const casa=casas.get(b.p_codigo);
  if(name==="menuse_crear_casa"){ const c="ABCD-"+(1000+casas.size); casas.set(c,new Map()); return res(200,c); }
  if(name==="menuse_existe_casa") return res(200,!!casa);
  if(!casa) return res(400,{message:"casa_no_existe"});
  if(name==="menuse_guardar"){
    b.p_cambios.forEach(c=>casa.set(c.k,{valor:c.v,actualizado:new Date(reloj+=1000).toISOString()}));
    return res(200,new Date(reloj).toISOString());
  }
  if(name==="menuse_leer"){
    const desde=b.p_desde ? Date.parse(b.p_desde) : -Infinity;
    return res(200,[...casa].filter(([,v])=>Date.parse(v.actualizado)>desde)
      .map(([k,v])=>({clave:k,valor:v.valor,actualizado:v.actualizado})));
  }
}

const store=await import("../js/model/storage.js");
const sync=await import("../js/model/sync.js");
sync._setFetch(fakeFetch);
const { KEYS }=store;

test("el código se escribe como sea: «k7pm 3qxd» → K7PM-3QXD", ()=>{
  assert.equal(sync.normalizeCode("k7pm 3qxd"),"K7PM-3QXD");
  assert.equal(sync.normalizeCode("K7PM-3QXD"),"K7PM-3QXD");
  assert.equal(sync.normalizeCode("K7PM"),null);
});

test("sin casa, los cambios no se apuntan para enviar", ()=>{
  usar(movilJuan);
  store.set(KEYS.people,"2");
  assert.deepEqual(store.pendingKeys(),[]);
});

test("lo de cada móvil (tema, avisos…) no se comparte; el menú y la lista sí", ()=>{
  assert.equal(store.isShared(KEYS.theme),false);
  assert.equal(store.isShared(KEYS.notify),false);
  assert.equal(store.isShared(KEYS.house),false);
  assert.equal(store.isShared(KEYS.menu),true);
  assert.equal(store.isShared(KEYS.week+"2"),true);
  assert.equal(store.isShared(KEYS.seasonMenu+"verano"),true);
});

let codigo;
test("Juan crea la casa: se sube lo que tenía", async ()=>{
  usar(movilJuan);
  store.set(KEYS.menu,'["menú de Juan"]');
  store.set(KEYS.theme,"dark");
  codigo=await sync.createHouse("  Casa   García ");
  assert.equal(sync.houseName(),"Casa García");
  assert.equal(sync.houseCode(),codigo);
  const enServidor=casas.get(codigo);
  assert.equal(enServidor.get(KEYS.menu).valor,'["menú de Juan"]');
  assert.equal(enServidor.get(KEYS.people).valor,"2");
  assert.equal(enServidor.has(KEYS.theme),false,"el tema es de cada móvil");
  assert.deepEqual(store.pendingKeys(),[]);
});

test("Ana se une: lo suyo se sustituye por lo de la casa, pero su tema se queda", async ()=>{
  usar(movilAna);
  assert.deepEqual(await sync.peekHouse(codigo),{code:codigo,name:"Casa García"});
  store.set(KEYS.menu,'["menú viejo de Ana"]');
  store.set(KEYS.spend,"[1,2]");
  store.set(KEYS.theme,"light");
  assert.equal(await sync.joinHouse(codigo.toLowerCase()),null);
  assert.equal(store.get(KEYS.menu),'["menú de Juan"]');
  assert.equal(store.get(KEYS.spend),null,"lo que la casa no tiene, se quita");
  assert.equal(store.get(KEYS.theme),"light");
});

test("un código que no existe se avisa y no cambia nada", async ()=>{
  usar(movilOtraCasa);
  store.set(KEYS.menu,'["otra familia"]');
  assert.match(await sync.joinHouse("ZZZZ-9999"),/ninguna casa/);
  assert.equal(store.get(KEYS.menu),'["otra familia"]');
  assert.equal(sync.houseCode(),null);
});

test("Ana cambia la lista → Juan la recibe; la otra familia no", async ()=>{
  usar(movilAna);
  store.set(KEYS.week+"1",'{"checked":{"cebolla":true}}');
  assert.deepEqual(store.pendingKeys(),[KEYS.week+"1"]);
  await sync.push();
  usar(movilJuan);
  assert.equal(await sync.pull(),true);
  assert.equal(store.get(KEYS.week+"1"),'{"checked":{"cebolla":true}}');
  assert.equal(await sync.pull(),false,"si no hay nada nuevo, no se repinta");
  usar(movilOtraCasa);
  assert.equal(store.get(KEYS.week+"1"),null);
});

test("lo que borras también se borra en el otro móvil", async ()=>{
  usar(movilJuan);
  store.remove(KEYS.week+"1");
  await sync.push();
  usar(movilAna);
  await sync.pull();
  assert.equal(store.get(KEYS.week+"1"),null);
});

test("sin conexión: el cambio espera y se envía al volver", async ()=>{
  usar(movilAna);
  sinRed=true;
  store.set(KEYS.people,"4");
  assert.equal(await sync.push(),false);
  assert.deepEqual(store.pendingKeys(),[KEYS.people]);
  sinRed=false;
  await sync.pull();               /* al volver, primero envía lo pendiente */
  assert.deepEqual(store.pendingKeys(),[]);
  usar(movilJuan);
  await sync.pull();
  assert.equal(store.get(KEYS.people),"4");
});

test("lo que aún no has enviado no lo pisa lo que llega de la casa", async ()=>{
  usar(movilJuan);
  store.set(KEYS.people,"3");      /* Juan cambia, aún sin enviar… */
  usar(movilAna);
  store.set(KEYS.people,"5"); await sync.push();
  usar(movilJuan);
  await sync.pull();               /* …envía lo suyo antes de recibir: gana el último */
  assert.equal(store.get(KEYS.people),"3");
  usar(movilAna);
  await sync.pull();
  assert.equal(store.get(KEYS.people),"3");
});

test("salir de la casa: te quedas con una copia y dejas de compartir", async ()=>{
  usar(movilAna);
  sync.leaveHouse();
  assert.equal(sync.houseCode(),null);
  assert.equal(store.get(KEYS.people),"3");
  store.set(KEYS.people,"1");
  assert.deepEqual(store.pendingKeys(),[]);
  usar(movilJuan);
  await sync.pull();
  assert.equal(store.get(KEYS.people),"3");
});

test("la pantalla puede preguntar por la casa (el ViewModel llega a sync.js)", async ()=>{
  usar(movilJuan);
  const { createAppViewModel }=await import("../js/viewmodel/appViewModel.js");
  const vm=createAppViewModel();
  assert.equal(vm.houseInfo().code,codigo);
  assert.equal(vm.normalizeHouseCode("abcd 1000"),"ABCD-1000");
  assert.equal(await vm.syncNow(),false);
});

test("el nombre de la casa: lo cambia uno y lo ven todos; al salir, ya no estás en ninguna", async ()=>{
  usar(movilJuan);
  sync.setHouseName("Los García");
  await sync.push();
  /* Ana salió antes; vuelve a unirse y ve el nombre nuevo */
  usar(movilAna);
  assert.equal(sync.houseName(),null);
  assert.equal((await sync.peekHouse(codigo)).name,"Los García");
  await sync.joinHouse(codigo);
  assert.equal(sync.houseName(),"Los García");
  sync.leaveHouse();
  assert.equal(sync.houseName(),null);
  assert.equal(store.get(KEYS.houseName),null);
});

test("cambiar de casa: lo pendiente se envía a la vieja y luego tienes lo de la nueva", async ()=>{
  usar(movilOtraCasa);
  const otra=await sync.createHouse("Casa Pérez");
  store.set(KEYS.people,"6");          /* pendiente en Casa Pérez */
  usar(movilJuan);
  const antes=store.get(KEYS.people);
  usar(movilOtraCasa);
  assert.equal(await sync.joinHouse(codigo),null);
  assert.equal(sync.houseName(),"Los García");
  assert.equal(store.get(KEYS.people),antes);
  assert.equal(casas.get(otra).get(KEYS.people).valor,"6","lo pendiente llegó a Casa Pérez antes de irse");
});
