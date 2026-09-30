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
  const ceb=l.find(i=>i.key==="cebolla");
  assert.equal(itemQtyText(ceb),"2 ud + 150 g");
  assert.equal(l.find(i=>i.key==="queso").allOptional,true);
});

test("para 3 personas se escala; las unidades redondean hacia arriba", ()=>{
  const l=shopItems(menuPrueba(),0,vacio,3,[]);
  assert.equal(itemQtyText(l.find(i=>i.key==="cebolla")),"3 ud + 225 g");
  assert.equal(scaleQty(1,"lata",1.5),2);
  assert.equal(scaleQty(300,"g",1.5),450);
});

test("una cantidad puesta a mano manda sobre la calculada", ()=>{
  const l=shopItems(menuPrueba(),0,{...vacio,overrides:{cebolla:5}},4,[]);
  assert.equal(itemQtyText(l.find(i=>i.key==="cebolla")),"5 ud");
});

test("cambiar lunes y martes mueve los platos pero no cambia la lista", ()=>{
  const m=menuPrueba();
  const v=viewWeek(m,0,[{a:0,b:1,meal:null}]);
  assert.equal(v[0][0].meal.dishes[0].name,"B");
  assert.equal(v[0][0].d,1); /* recuerda que viene del martes */
  const antes=itemQtyText(buildList(m,0,[]).find(i=>i.key==="cebolla"));
  const despues=itemQtyText(buildList(m,0,[{a:0,b:1,meal:null}]).find(i=>i.key==="cebolla"));
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

/* ---------- cambios de sept. 2026: días pasados, fijos y desayunos ---------- */

test("la compra puede empezar en un día: lo de días pasados no cuenta", ()=>{
  const m=menuPrueba();
  const desdeMartes=buildList(m,0,[],1);
  assert.equal(itemQtyText(desdeMartes.find(i=>i.key==="cebolla")),"150 g"); /* el lunes (2 ud) ya pasó */
  const desdeMiercoles=buildList(m,0,[],2);
  assert.equal(desdeMiercoles.find(i=>i.key==="cebolla"),undefined);
});

test("los productos fijos salen todas las semanas salvo «esta semana no»", async ()=>{
  const { shopItems } = await import("../js/model/rules.js");
  const fijos=[{key:"fijo::1::bolsas de basura",item:"bolsas de basura",qty:null,unit:null}];
  const l=shopItems(menuPrueba(),2,vacio,2,[],{staples:fijos});
  assert.ok(l.find(i=>i.key==="fijo::1::bolsas de basura" && i.staple));
  const sinEsta=shopItems(menuPrueba(),2,{...vacio,removed:["fijo::1::bolsas de basura"]},2,[],{staples:fijos});
  assert.equal(sinEsta.find(i=>i.staple),undefined);
});

test("los desayunos por día se quitan del menú y pasan a recordatorios de la compra", async ()=>{
  localStorage.clear();
  /* un menú guardado con desayunos, como los que hubo el 30/9/2026 */
  const dia={meals:[
    {id:"desayuno",name:"Desayuno",dishes:[{name:"Tostadas",ingredients:[{qty:null,unit:null,item:"pan (para tostar)"},{qty:null,unit:null,item:"aguacate"}]}]},
    {id:"comida",name:"Comida",dishes:[]},{id:"cena",name:"Cena",dishes:[]}]};
  localStorage.setItem("menuCompraApp_menuData_v1",JSON.stringify([0,1,2,3].map(()=>Array.from({length:7},()=>dia))));
  const repo=await import("../js/model/repository.js?desayunos"); /* módulo nuevo: arranca como la app */
  assert.ok(repo.getMenu().every(w=>w.every(d=>!d.meals.some(m=>m.id==="desayuno"))));
  const bf=repo.staples().filter(x=>x.group==="desayuno").map(x=>x.item);
  assert.deepEqual(bf,["pan para tostar","aguacate"]);
});

test("ViewModel: el miércoles la compra de esta semana no suma lunes ni martes", ()=>{
  localStorage.clear();
  const vm=createAppViewModel(()=>new Date(2026,8,30,12)); /* miércoles */
  vm.setCurrentWeek(0);
  const c=vm.compra();
  assert.deepEqual(c.pastDays,{names:["lunes","martes"],excluded:true});
  const sinPasados=c.total;
  vm.setIncludePast(true);
  assert.ok(vm.compra().total>=sinPasados);
  assert.equal(vm.compra().pastDays.excluded,false);
});

test("ViewModel: fijar un producto, cerrar la compra y ocultar lo comprado", ()=>{
  localStorage.clear();
  const vm=createAppViewModel(()=>new Date(2026,8,28,12)); /* lunes */
  vm.setCurrentWeek(0);
  vm.addCustom("lavavajillas",null,"");
  const key=vm.compra().sections.flatMap(s=>s.rows).find(r=>r.name==="Lavavajillas").key;
  vm.makeStaple(key);
  const fijo=vm.compra().sections.find(s=>s.id==="hogar").rows[0];
  assert.equal(fijo.tag,"siempre");
  vm.removeItem(fijo.key); /* «esta semana no» */
  assert.equal(vm.compra().sections.find(s=>s.id==="hogar"),undefined);
  vm.closeShopping(); /* la semana siguiente vuelve */
  assert.ok(vm.compra().sections.find(s=>s.id==="hogar"));
  /* ocultar comprados */
  const r=vm.compra().visibleSections[0].rows[0];
  vm.toggleChecked(r.key);
  vm.toggleHideDone();
  const c=vm.compra();
  assert.equal(c.hiddenDone,1);
  assert.ok(!c.visibleSections.flatMap(s=>s.rows).some(x=>x.key===r.key));
});

test("«patatas» y «patata» son el mismo producto en la lista", ()=>{
  const dia=platos=>({meals:[{id:"comida",name:"Comida",dishes:platos}]});
  const semana=Array.from({length:7},()=>dia([]));
  semana[0]=dia([{name:"A",ingredients:[{qty:2,unit:"ud",item:"patatas"}]}]);
  semana[1]=dia([{name:"B",ingredients:[{qty:1,unit:"ud",item:"patata"}]}]);
  const l=buildList([semana,semana,semana,semana],0,[]);
  const p=l.filter(i=>i.key==="patata");
  assert.equal(p.length,1);
  assert.equal(itemQtyText(p[0]),"3 ud");
});

/* ---------- menús por estación ---------- */
test("la estación sale de la fecha", async ()=>{
  const { seasonOf } = await import("../js/model/calendar.js");
  assert.equal(seasonOf(new Date(2026,8,22)),"verano");   /* 22 sept */
  assert.equal(seasonOf(new Date(2026,8,23)),"otono");    /* 23 sept */
  assert.equal(seasonOf(new Date(2026,11,25)),"invierno");
  assert.equal(seasonOf(new Date(2027,1,10)),"invierno");
  assert.equal(seasonOf(new Date(2027,3,1)),"primavera");
  assert.equal(seasonOf(new Date(2027,6,1)),"verano");
});

test("ViewModel: sin menú propio se usa el general; con menú propio, el de la estación", ()=>{
  localStorage.clear();
  const vm=createAppViewModel(()=>new Date(2026,8,30,12)); /* otoño */
  vm.setCurrentWeek(0);
  const general=vm.hoy().meals[0].dishes.map(d=>d.name);
  assert.ok(general.length>0);
  assert.equal(vm.hoy().menuName,null);
  /* menú de otoño vacío: hoy no hay platos */
  const undo=vm.createSeasonMenu("otono","empty");
  assert.equal(vm.hoy().menuName,"otoño");
  assert.equal(vm.hoy().meals[0].dishes.length,0);
  /* lo que marcas en otoño no toca lo del menú general */
  undo();
  assert.deepEqual(vm.hoy().meals[0].dishes.map(d=>d.name),general);
});

test("ViewModel: editar el menú de verano en otoño no cambia lo de hoy", ()=>{
  localStorage.clear();
  const vm=createAppViewModel(()=>new Date(2026,8,30,12));
  vm.setCurrentWeek(0);
  const antes=vm.hoy().meals[0].dishes[0].name;
  vm.createSeasonMenu("verano","copy");
  vm.viewSeason("verano");
  assert.equal(vm.seasonBanner().label,"Verano");
  const ref=vm.semana()[vm.todayIdx].meals[0].dishes[0].ref;
  vm.renameDish(ref,"Gazpacho");
  vm.stopViewingSeason();
  assert.equal(vm.hoy().meals[0].dishes[0].name,antes);   /* otoño sigue con el general */
  vm.setSeasonSetting("verano");                           /* fijar verano a mano */
  assert.equal(vm.hoy().meals[0].dishes[0].name,"Gazpacho");
  vm.setSeasonSetting("auto");
});
