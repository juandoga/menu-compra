/* MODEL · Pequeñas ayudas para trabajar con textos y cantidades.
   No tocan la pantalla ni el almacenamiento: entra un dato, sale otro. */

/* minúsculas y sin tildes, para comparar «Cebolla» con «cebolla» */
export function norm(s){
  return String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
}

/* «pescado blanco (merluza o rape)» → nombre corto + detalle; «(opcional)» lo marca como opcional */
export function parseItem(raw){
  const txt=String(raw||"").trim();
  const m=txt.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
  if(!m || !m[1]) return {short:txt, hint:null, optional:false};
  const inner=m[2].trim();
  const optional=/^opcional$/i.test(inner) || /^si\b/i.test(inner);
  return {short:m[1].trim(), hint:optional?null:inner, optional:optional};
}

export function fmt(n){ return Math.round(n*100)/100; }
export function cap(s){ s=String(s||""); return s.charAt(0).toUpperCase()+s.slice(1); }
export function unitText(q,u){
  if(!u) return "";
  if(u==="diente" && q!=null && q!==1) return "dientes";
  return u;
}
export function qtyText(q,u){ return q==null ? "" : fmt(q)+(u?" "+unitText(q,u):""); }
export function clone(o){ return JSON.parse(JSON.stringify(o)); }

/* Clave para agrupar productos: minúsculas, sin tildes y en singular palabra a palabra,
   para que «patatas» y «patata» (o «huevos» y «huevo») cuenten como lo mismo.
   Sólo sirve para comparar; el nombre que ves no cambia. */
const KEEP=new Set(["tres","dos","seis","mas","gas","atlas","anis","pais","maiz","arroz","cous"]);
function singular(w){
  if(w.length<=4 || KEEP.has(w)) return w;
  if(/[aeiou][lnrdj]es$/.test(w)) return w.slice(0,-2);      /* limones→limón, calabacines→calabacín, panes→pan */
  if(/ces$/.test(w)) return w.slice(0,-3)+"z";               /* nueces→nuez */
  if(/[^s]s$/.test(w) && !/(us|is)$/.test(w)) return w.slice(0,-1); /* patatas→patata, huevos→huevo */
  return w;
}
export function itemKey(name){
  return norm(name).trim().split(/\s+/).map(singular).join(" ");
}
