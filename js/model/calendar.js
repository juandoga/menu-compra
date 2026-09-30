/* MODEL · Fechas y el ciclo de 4 semanas.
   La idea: se guarda el lunes en que empezó una «Semana 1». Contando lunes desde ahí
   se sabe qué semana toca cualquier día. */

export function dayStart(d){ return new Date(d.getFullYear(),d.getMonth(),d.getDate()); }
export function mondayOf(d){ const x=dayStart(d); x.setDate(x.getDate()-((x.getDay()+6)%7)); return x; }
export function isoDate(d){
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}
export function parseISO(s){
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s||""));
  return m ? new Date(+m[1],+m[2]-1,+m[3]) : null;
}
/* 0 = lunes … 6 = domingo */
export function weekdayIndex(d){ return (d.getDay()+6)%7; }

/* Qué semana del menú (0 a 3) toca en una fecha, sabiendo el lunes de inicio. null si no hay inicio. */
export function cycleWeekOn(date,startISO){
  const start=parseISO(startISO);
  if(!start) return null;
  const weeks=Math.round((mondayOf(date)-start)/(7*864e5)); /* round: por el cambio de hora */
  return ((weeks%4)+4)%4;
}
/* Qué lunes de inicio hay que guardar para que «hoy» caiga en la semana w */
export function startFor(date,w){
  const m=mondayOf(date);
  m.setDate(m.getDate()-7*w);
  return isoDate(m);
}

/* ---------- estaciones ---------- */
/* Fechas de inicio aproximadas (las astronómicas): 21 mar, 21 jun, 23 sep, 21 dic */
export const SEASONS=[
  {id:"primavera", label:"Primavera", range:"21 mar – 20 jun"},
  {id:"verano",    label:"Verano",    range:"21 jun – 22 sep"},
  {id:"otono",     label:"Otoño",     range:"23 sep – 20 dic"},
  {id:"invierno",  label:"Invierno",  range:"21 dic – 20 mar"}
];
export function seasonOf(date){
  const md=(date.getMonth()+1)*100+date.getDate(); /* 30 de septiembre → 930 */
  if(md>=321 && md<621) return "primavera";
  if(md>=621 && md<923) return "verano";
  if(md>=923 && md<1221) return "otono";
  return "invierno";
}
export function seasonLabel(id){ const s=SEASONS.find(x=>x.id===id); return s ? s.label : ""; }
