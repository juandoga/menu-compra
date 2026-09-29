/* MODEL · Las reglas de Menuse. Todo aquí son funciones «puras»: reciben datos y
   devuelven datos, sin mirar la pantalla ni el almacenamiento. Por eso se pueden
   probar solas (ver tests/logica.test.mjs). */

import { norm, parseItem, qtyText } from "./text.js";

/* ---------- la semana tal y como se ve, con los cambios de día aplicados ---------- */
/* Devuelve 7 días; cada día es una lista de comidas. Cada comida recuerda de qué
   día del menú viene (d) y qué posición tiene allí (mi), para poder editarla. */
export function viewWeek(menu,w,swaps){
  const v=menu[w].map((day,d)=>day.meals.map((meal,mi)=>({meal,d,mi})));
  (swaps||[]).forEach(s=>{
    if(s.meal==null){ const t=v[s.a]; v[s.a]=v[s.b]; v[s.b]=t; return; }
    const ia=v[s.a].findIndex(r=>r.meal.name===s.meal);
    const ib=v[s.b].findIndex(r=>r.meal.name===s.meal);
    if(ia<0 || ib<0) return;
    const t=v[s.a][ia]; v[s.a][ia]=v[s.b][ib]; v[s.b][ib]=t;
  });
  return v;
}

/* recorre todos los platos de las 4 semanas */
export function eachDish(menu,fn){
  menu.forEach((wk,wi)=>wk.forEach((day,di)=>day.meals.forEach((meal,mi)=>
    meal.dishes.forEach((dish,si)=>fn(dish,{wi,di,mi,si,meal})))));
}

/* ---------- básicos de despensa ---------- */
/* Un producto es «básico» si aparece en 3 o más semanas, salvo que lo hayas cambiado a mano */
function weekCountFor(menu,key){
  const seen=new Set();
  eachDish(menu,(dish,ctx)=>{
    dish.ingredients.forEach(i=>{ if(norm(parseItem(i.item).short)===key) seen.add(ctx.wi); });
  });
  return seen.size;
}
export function isBasic(menu,overrides,shortName){
  const k=norm(shortName);
  if(Object.prototype.hasOwnProperty.call(overrides,k)) return !!overrides[k];
  return weekCountFor(menu,k)>=3;
}

/* ---------- lista de la compra ---------- */
/* Junta los ingredientes de toda la semana. Si un mismo producto viene en unidades
   distintas, cada unidad suma por separado: «2 ud + 150 g», nada se pierde. */
export function buildList(menu,w,swaps){
  const map=new Map();
  /* Se suma siempre en el orden del menú original, para que el resultado no cambie al
     intercambiar días; sólo el «qué día» de cada origen sigue los cambios. */
  const shownDay=menu[w].map(day=>day.meals.map(()=>null));
  viewWeek(menu,w,swaps).forEach((refs,d)=>refs.forEach(r=>{ shownDay[r.d][r.mi]=d; }));
  menu[w].forEach((day,d)=>{
    day.meals.forEach((meal,mi)=>{
      const dayIdx = shownDay[d][mi]==null ? d : shownDay[d][mi];
      meal.dishes.forEach(dish=>{
        dish.ingredients.forEach(i=>{
          const p=parseItem(i.item);
          if(!p.short) return;
          const k=norm(p.short);
          let e=map.get(k);
          if(!e){
            e={key:k,item:p.short,hint:p.hint,custom:false,allOptional:true,origins:[],parts:[],firstUnit:null};
            map.set(k,e);
          }
          if(!e.hint && p.hint) e.hint=p.hint;
          if(!p.optional) e.allOptional=false;
          if(e.firstUnit==null && i.unit) e.firstUnit=i.unit;
          if(i.qty!=null){
            const u=i.unit||null;
            const part=e.parts.find(x=>norm(x.unit||"")===norm(u||""));
            if(part) part.qty+=i.qty; else e.parts.push({qty:i.qty,unit:u});
          }
          e.origins.push({day:dayIdx,meal:meal.name,dish:dish.name,qty:i.qty,unit:i.unit});
        });
      });
    });
  });
  return [...map.values()].map(e=>{
    const first=e.parts[0];
    const out={...e, qty:first?first.qty:null, unit:first?first.unit:e.firstUnit, extra:e.parts.slice(1),
      origins:e.origins.slice().sort((x,y)=>x.day-y.day)};
    delete out.parts; delete out.firstUnit;
    return out;
  });
}

/* ---------- personas ---------- */
export const BASE_PEOPLE=2; /* el menú está pensado para 2 */
export function peopleCount(raw){ const n=parseInt(raw,10); return n>=1 && n<=12 ? n : BASE_PEOPLE; }
/* Escala una cantidad: las unidades se redondean hacia arriba (no se compra media lata) */
export function scaleQty(q,u,f){
  if(q==null || f===1) return q;
  const v=q*f;
  const unit=norm(u||"");
  if(!unit || /^(ud|uds|unidad|unidades|diente|dientes|lata|latas|paquete|paquetes|bote|botes|pieza|piezas)$/.test(unit)) return Math.ceil(v-1e-9);
  if(v>=20) return Math.round(v/5)*5;
  return Math.round(v*10)/10;
}

/* La lista final de una semana: lo del menú (menos lo quitado, con tus cantidades
   y ajustado a las personas) + lo que añadiste tú */
export function shopItems(menu,w,state,people,swaps){
  const f=people/BASE_PEOPLE;
  const base=buildList(menu,w,swaps).filter(i=>!state.removed.includes(i.key));
  base.forEach(i=>{
    if(Object.prototype.hasOwnProperty.call(state.overrides,i.key)){
      i.qty=state.overrides[i.key]; i.extra=[]; i.overridden=true; /* la cantidad que pusiste tú manda */
    }else{
      i.qty=scaleQty(i.qty,i.unit,f);
      i.extra=i.extra.map(x=>({qty:scaleQty(x.qty,x.unit,f),unit:x.unit}));
    }
  });
  const custom=(state.custom||[]).map(c=>({...c,custom:true,allOptional:false,hint:null,origins:[],extra:[]}));
  return base.concat(custom);
}

/* texto de la cantidad total de un producto de la lista */
export function itemQtyText(i){
  return [qtyText(i.qty,i.unit)].concat((i.extra||[]).map(x=>qtyText(x.qty,x.unit))).filter(Boolean).join(" + ");
}

/* ---------- buscar platos ---------- */
/* Platos de las 4 semanas cuyo nombre o algún ingrediente contiene el texto */
export function searchDishes(menu,query){
  const q=norm(String(query||"").trim());
  if(q.length<2) return null; /* muy corto: no se busca */
  const hits=[];
  eachDish(menu,(dish,ctx)=>{
    let why=null;
    if(norm(dish.name).indexOf(q)>=0) why="";
    else{
      const m=dish.ingredients.find(i=>norm(parseItem(i.item).short).indexOf(q)>=0);
      if(m) why=parseItem(m.item).short;
    }
    if(why!==null) hits.push({dish,ctx,why});
  });
  return hits;
}
