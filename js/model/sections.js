/* MODEL · Secciones del supermercado y reglas para saber en cuál va cada producto. */
import { norm } from "./text.js";

export const SECTIONS=[
  {id:"verdura",  label:"Frutería y verdura"},
  {id:"carne",    label:"Carnicería"},
  {id:"pescado",  label:"Pescadería"},
  {id:"lacteos",  label:"Huevos y lácteos"},
  {id:"panaderia",label:"Panadería"},
  {id:"despensa", label:"Despensa"},
  {id:"hogar",    label:"Casa y limpieza"},
  {id:"otros",    label:"Otros"}
];
const RULES=[
  /* va primero: «pasta de dientes» o «papel de cocina» no son comida */
  [/(bolsa|basura|lavavajilla|detergente|suavizante|lejia|friegasuelo|limpia|jabon|gel\b|champu|papel|servilleta|estropajo|bayeta|fregona|panal|toallita|pasta de dientes|dentifrico|desodorante|cepillo|film|aluminio|insecticida|ambientador|pilas?\b|velas?\b)/,"hogar"],
  [/(caldo|tomate frito|salsa|aceite|vinagre|mayonesa|alioli|ketchup|mostaza|harina|pan rallado|pimenton|\bsal\b|pimienta|nuez moscada|vino|soja|patatas fritas|nachos|guacamole|jalapeno|pepinillo|guindilla|aceituna|croqueta|empanadilla|gnocchi)/,"despensa"],
  [/(obleas|masa de pizza|brioche|pan de molde|\bpan\b|panes)/,"panaderia"],
  [/(huevo|nata|leche|queso|mozzarella|parmesano|cheddar|mantequilla)/,"lacteos"],
  [/(pescad|merluza|rape|dorada|boquer|sardina|almeja|gula|palometa|lubina|bacalao|calamar|gallo|atun|marisco)/,"pescado"],
  [/(pollo|pavo|ternera|cerdo|jamon|bacon|panceta|morcilla|lomo|carne|alita|secreto|salchicha|chorizo|costilla|chuleta|pechuga|nugget|hamburguesa|york|raxo)/,"carne"],
  [/(verdura|patata|zanahoria|puerro|calabac|\bajo\b|cebolla|tomate|lechuga|seta|calabaza|limon|pimiento|maiz|espinaca|brocoli|berenjena|guisante|jengibre|perejil|romero|shiitake)/,"verdura"],
  [/(arroz|pasta|quinoa|fideo|noodle|lenteja|garbanzo|legumbre)/,"despensa"]
];

/* En qué sección del súper va un producto (por su nombre) */
export function sectionFor(item){
  const s=norm(item);
  for(const [re,id] of RULES){ if(re.test(s)) return id; }
  return "otros";
}
export function sectionLabel(id){
  const s=SECTIONS.find(x=>x.id===id);
  return s ? s.label : "Otros";
}
