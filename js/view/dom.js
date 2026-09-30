/* VIEW · Piezas comunes para pintar: iconos, botones, el aviso de abajo (snack)
   y la ventana que sube desde abajo (sheet). */

/* crea un elemento: el("div", {className:"x", text:"hola"}, hijo1, hijo2…) */
export function el(tag,props,...children){
  const e=document.createElement(tag);
  if(props){
    for(const k in props){
      const v=props[k];
      if(v==null || v===false) continue;
      if(k==="text") e.textContent=v;
      else if(k==="onClick") e.addEventListener("click",v);
      else if(k==="style") Object.assign(e.style,v);
      else if(k==="className" || k==="type" || k==="value" || k==="placeholder" || k==="disabled" || k==="readOnly") e[k]=v;
      else e.setAttribute(k,v);
    }
  }
  /* flat(Infinity): acepta listas dentro de listas (p. ej. block("…", filas.map(…))) */
  children.flat(Infinity).forEach(c=>{ if(c!=null && c!==false) e.append(c); });
  return e;
}

export function svg(paths,sw){
  const s=document.createElementNS("http://www.w3.org/2000/svg","svg");
  s.setAttribute("viewBox","0 0 24 24");
  s.setAttribute("fill","none");
  s.setAttribute("stroke","currentColor");
  s.setAttribute("stroke-width",sw||"1.8");
  s.setAttribute("stroke-linecap","round");
  s.setAttribute("stroke-linejoin","round");
  s.setAttribute("aria-hidden","true");
  s.innerHTML=paths;
  return s;
}
export const ICON={
  bell:'<path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6"/><path d="M10.5 20a2 2 0 0 0 3 0"/>',
  search:'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  right:'<path d="m9 6 6 6-6 6"/>',
  chev:'<path d="m6 9 6 6 6-6"/>',
  close:'<path d="M18 6 6 18M6 6l12 12"/>',
  check:'<path d="m5 12 5 5L20 7"/>',
  pencil:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  up:'<path d="m6 15 6-6 6 6"/>',
  down:'<path d="m6 9 6 6 6-6"/>',
  share:'<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M12 15V3"/><path d="m8 7 4-4 4 4"/>',
  sort:'<path d="M7 4v16M7 4 4 7M7 4l3 3"/><path d="M17 20V4M17 20l-3-3M17 20l3-3"/>',
  off:'<path d="M3 3l18 18"/><path d="M8.5 15.5a5 5 0 0 1 7 0"/><path d="M5 12a10 10 0 0 1 3-2"/><path d="M19 12a10 10 0 0 0-6-2.8"/><path d="M12 19h.01"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon:'<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/>',
  star:'<path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z"/>',
  swap:'<path d="M7 4 3 8l4 4"/><path d="M3 8h13a4 4 0 0 1 4 4"/><path d="m17 20 4-4-4-4"/><path d="M21 16H8a4 4 0 0 1-4-4"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  cup:'<path d="M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 2.5v2.5M12 2.5v2.5"/>',
  eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff:'<path d="M3 3l18 18"/><path d="M10.6 5.1A9.9 9.9 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.3 4.2M6.6 6.6C3.9 8.3 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  pin:'<path d="M12 17v5"/><path d="M9 3h6l-1 6 3 3v2H7v-2l3-3z"/>'
};

export function linkBtn(text,fn){ return el("button",{className:"linkbtn",text,onClick:fn}); }

/* interruptor sí/no */
export function switchBtn(label,on,fn){
  const b=el("button",{className:"switch",role:"switch","aria-label":label,"aria-checked":on?"true":"false",onClick:fn});
  b.innerHTML="<i></i>";
  return b;
}

/* botones 1-2-3-4 para elegir semana */
export function pick4(current,onPick){
  return el("div",{className:"pick4"},[0,1,2,3].map(w=>el("button",{
    text:String(w+1),"aria-label":"Semana "+(w+1),"aria-pressed":w===current?"true":"false",
    onClick:()=>onPick(w)
  })));
}

/* aviso suave con un texto y botones a la derecha */
export function note(content,...buttons){
  const span=el("span",null,content);
  const n=el("div",{className:"note"},span);
  if(buttons.length===1) n.append(buttons[0]);
  else if(buttons.length>1) n.append(el("span",{style:{flex:"0 0 auto",display:"flex",gap:"10px"}},buttons));
  return n;
}

/* copia un texto al portapapeles; devuelve si ha ido bien */
export function copyText(textarea,text){
  textarea.readOnly=false; textarea.focus(); textarea.select();
  let ok=false;
  try{ ok=document.execCommand("copy"); }catch(e){}
  textarea.readOnly=true;
  if(!ok && navigator.clipboard){ navigator.clipboard.writeText(text).catch(()=>{}); ok=true; }
  return ok;
}

/* ---------- aviso de abajo («Deshacer», «Recargar») ---------- */
const snack=document.getElementById("snack");
const snackMsg=document.getElementById("snackMsg");
const snackBtn=document.getElementById("snackUndo");
let snackFn=null, snackTimer=null, hideTimer=null;
/* ms=0 lo deja fijo hasta que se toque */
export function showSnack(msg,label,fn,ms){
  clearTimeout(snackTimer); clearTimeout(hideTimer);
  snackFn=fn; snackMsg.textContent=msg; snackBtn.textContent=label;
  snack.hidden=false;
  requestAnimationFrame(()=>snack.classList.add("on"));
  if(ms) snackTimer=setTimeout(hideSnack,ms);
}
/* para las órdenes que devuelven cómo deshacerlas */
export function showUndo(msg,undo){ if(undo) showSnack(msg,"Deshacer",undo,6000); }
function hideSnack(){
  clearTimeout(snackTimer);
  snack.classList.remove("on");
  hideTimer=setTimeout(()=>{ snack.hidden=true; snackFn=null; },220);
}
snackBtn.addEventListener("click",()=>{
  if(snackFn){ const f=snackFn; snackFn=null; f(); }
  hideSnack();
});

/* ---------- ventana que sube desde abajo ---------- */
const scrim=document.getElementById("scrim");
const sheet=document.getElementById("sheet");
const sheetIn=document.getElementById("sheetIn");
let lastFocus=null;
export function openSheet(build){
  lastFocus=document.activeElement;
  sheetIn.textContent="";
  build(sheetIn);
  scrim.hidden=false; sheet.hidden=false;
  requestAnimationFrame(()=>{ scrim.classList.add("on"); sheet.classList.add("on"); });
  sheet.focus();
}
export function closeSheet(){
  scrim.classList.remove("on"); sheet.classList.remove("on");
  setTimeout(()=>{ scrim.hidden=true; sheet.hidden=true; sheetIn.textContent=""; },260);
  if(lastFocus && lastFocus.focus) lastFocus.focus();
}
scrim.addEventListener("click",closeSheet);
document.addEventListener("keydown",e=>{ if(e.key==="Escape" && !sheet.hidden) closeSheet(); });

export function sheetHeader(host,title,sub){
  const close=el("button",{className:"close","aria-label":"Cerrar",onClick:closeSheet},svg(ICON.close,"2.2"));
  host.append(el("div",{className:"sheet-head"},
    el("div",{style:{flex:"1",minWidth:"0"}},
      el("h2",{className:"sheet-title",text:title}),
      sub ? el("p",{className:"sheet-sub",text:sub}) : null),
    close));
}
export function block(label,...children){
  return el("div",{className:"block"},el("p",{className:"block-label",text:label}),children);
}
export function hintLine(text,style){ return el("p",{className:"hintline",text,style}); }
