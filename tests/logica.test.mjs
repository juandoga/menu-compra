/* Pruebas de la lógica de Menuse, sin pantalla ni navegador.
   Cómo lanzarlas (en la carpeta del proyecto):   node --test tests/
   Si todo va bien, al final pone «pass» con el número de pruebas y «fail 0». */

import { test } from "node:test";
import assert from "node:assert/strict";

/* un almacenamiento de mentira que vive en memoria, en lugar del del navegador */
const mem=new Map();
globalThis.localStorage={
  getItem:k=>mem.has(k)?mem.get(k):null,
  setItem:(k,v)=>mem.set(k,String(v)),
  removeItem:k=>mem.delete(k),
  clear:()=>mem.clear()
};

const { buildList, shopItems, scaleQty, itemQtyText, viewWeek, searchDishes } = await import("../js/model/rules.js");
const { cycleWeekOn, startFor } = await import("../js/model/calendar.js");
const { createAppViewModel } = await import("../js/viewmodel/appViewModel.js");

const vacio={checked:{},overrides:{},removed:[],custom:[]};
/* menú mínimo: semana 0 con dos platos que llevan cebolla en unidades distintas */
function menuPrueba(){
  const dia=platos=>({meals:[{id:"comida",name:"Comida",dishes:platos},{id:"cena",name:"Cena",dishes:[]}]});
  const semana=()=>Array.from({length:7},()=>dia([]));
  const m=[semana(),semana(),semana(),semana()];
  m[0][0]=dia([{name:"A",ingredients:[{qty:2,unit:"ud",item:"cebollas"}]}]);
  m[0][1]=dia([{name:"B",ingredients:[{qty:150,unit:"g",item:"cebollas"},{qty:null,unit:null,item:"queso (opcional)"}]}]);
  return m;
}

test("la lista junta unidades distintas sin perder ninguna", ()=>{
  const l=buildList(menuPrueba(),0,[]);
  const ceb=l.find(i=>i.key==="cebollas");
  assert.equal(itemQtyText(ceb),"2 ud + 150 g");
  assert.equal(l.find(i=>i.key==="queso").allOptional,true);
});

test("para 3 personas se escala; las unidades redondean hacia arriba", ()=>{
  const l=shopItems(menuPrueba(),0,vacio,3,[]);
  assert.equal(itemQtyText(l.find(i=>i.key==="cebollas")),"3 ud + 225 g");
  assert.equal(scaleQty(1,"lata",1.5),2);
  assert.equal(scaleQty(300,"g",1.5),450);
});

test("una cantidad puesta a mano manda sobre la calculada", ()=>{
  const l=shopItems(menuPrueba(),0,{...vacio,overrides:{cebollas:5}},4,[]);
  assert.equal(itemQtyText(l.find(i=>i.key==="cebollas")),"5 ud");
});

test("cambiar lunes y martes mueve los platos pero no cambia la lista", ()=>{
  const m=menuPrueba();
  const v=viewWeek(m,0,[{a:0,b:1,meal:null}]);
  assert.equal(v[0][0].meal.dishes[0].name,"B");
  assert.equal(v[0][0].d,1); /* recuerda que viene del martes */
  const antes=itemQtyText(buildList(m,0,[]).find(i=>i.key==="cebollas"));
  const despues=itemQtyText(buildList(m,0,[{a:0,b:1,meal:null}]).find(i=>i.key==="cebollas"));
  assert.equal(antes,despues);
});

test("el ciclo de 4 semanas avanza cada lunes y vuelve a empezar", ()=>{
  const inicio=startFor(new Date(2026,8,29),1); /* martes 29/9 en la semana 2 */
  assert.equal(inicio,"2026-09-21");
  assert.equal(cycleWeekOn(new Date(2026,8,27),inicio),0);  /* domingo anterior: semana 1 */
  assert.equal(cycleWeekOn(new Date(2026,9,5),inicio),2);   /* lunes siguiente: semana 3 */
  assert.equal(cycleWeekOn(new Date(2026,9,19),inicio),0);  /* 4 semanas después: vuelve a la 1 */
  assert.equal(cycleWeekOn(new Date(2026,8,20),inicio),3);  /* antes del inicio también funciona */
});

test("el buscador encuentra por nombre y por ingrediente", ()=>{
  assert.equal(searchDishes(menuPrueba(),"c"),null); /* una sola letra: no busca */
  const hits=searchDishes(menuPrueba(),"ceboll");
  assert.equal(hits.length,2);
});

test("ViewModel: el fin de semana la compra salta a la semana siguiente", ()=>{
  localStorage.clear();
  let hoy=new Date(2026,9,3,10); /* sábado 3/10 */
  const vm=createAppViewModel(()=>hoy);
  vm.setCurrentWeek(1);
  let avisos=0; vm.subscribe(()=>avisos++);
  vm.setView("shop");
  assert.equal(vm.week,2);
  assert.equal(vm.compra().autoWeek,3);
  assert.ok(avisos>0, "avisa a la pantalla para que se repinte");
  vm.setView("hoy");
  assert.equal(vm.week,1);
});

test("ViewModel: al cambiar de día se pone al día solo", ()=>{
  localStorage.clear();
  let hoy=new Date(2026,8,29,23,59); /* martes */
  const vm=createAppViewModel(()=>hoy);
  vm.setCurrentWeek(3);
  hoy=new Date(2026,9,5,8,0); /* lunes siguiente */
  assert.equal(vm.checkDate(),true);
  assert.equal(vm.todayIdx,0);
  assert.equal(vm.week,0); /* después de la 4 vuelve a la 1 */
});

test("ViewModel: marcar, cerrar la compra y deshacer", ()=>{
  localStorage.clear();
  const vm=createAppViewModel(()=>new Date(2026,8,29,12));
  const primera=vm.compra().sections[0].rows[0];
  vm.toggleChecked(primera.key);
  assert.equal(vm.compra().done,1);
  const deshacer=vm.closeShopping();
  assert.equal(vm.compra().done,0);
  deshacer();
  assert.equal(vm.compra().done,1);
});
