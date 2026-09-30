/* MODEL · Datos de partida: los días y el menú original de 4 semanas.
   Si «Volver al menú original», se usa esto. */

export const DAYS=[
  {full:"Lunes",ini:"L"},{full:"Martes",ini:"M"},{full:"Miércoles",ini:"X"},
  {full:"Jueves",ini:"J"},{full:"Viernes",ini:"V"},{full:"Sábado",ini:"S"},{full:"Domingo",ini:"D"}
];
export function ing(qty,unit,item){return {qty,unit,item};}

export const DEFAULT_MENU=[
[
  {dishes:[
    {name:"Puré de verdura", ingredients:[ing(300,"g","verduras variadas (patata, zanahoria, puerro, calabacín)"),ing(1,"diente","ajo"),ing(null,null,"aceite de oliva"),ing(null,null,"sal")]},
    {name:"Filetes de pavo/pollo", ingredients:[ing(2,"ud","filetes de pavo o pollo (150 g c/u)"),ing(null,null,"sal"),ing(null,null,"pimienta"),ing(null,null,"aceite de oliva")]},
    {name:"Revuelto de huevo con morcilla", ingredients:[ing(4,"ud","huevos"),ing(100,"g","morcilla"),ing(null,null,"aceite de oliva"),ing(null,null,"sal")]}
  ]},
  {dishes:[
    {name:"Pescado con patata cocida", ingredients:[ing(300,"g","pescado blanco (merluza o rape)"),ing(2,"ud","patatas"),ing(null,null,"aceite de oliva"),ing(null,null,"sal"),ing(null,null,"perejil")]},
    {name:"Hamburguesas de ternera/pollo", ingredients:[ing(2,"ud","hamburguesas de ternera o pollo (125 g c/u)"),ing(2,"ud","panes de hamburguesa"),ing(null,null,"lechuga"),ing(null,null,"tomate"),ing(null,null,"queso (opcional)")]}
  ]},
  {dishes:[
    {name:"Arroz con jamón y setas", ingredients:[ing(150,"g","arroz"),ing(80,"g","jamón en tacos"),ing(150,"g","setas"),ing(1,"diente","ajo"),ing(400,"ml","caldo de pollo"),ing(null,null,"aceite de oliva")]},
    {name:"Sopa y tortilla", ingredients:[ing(500,"ml","caldo de pollo o verduras"),ing(50,"g","fideos finos"),ing(4,"ud","huevos"),ing(2,"ud","patatas"),ing(null,null,"aceite de oliva"),ing(null,null,"sal")]}
  ]},
  {dishes:[
    {name:"Filetes empanados con quinoa de verduras", ingredients:[ing(2,"ud","filetes de pollo o ternera"),ing(1,"ud","huevos"),ing(null,null,"pan rallado"),ing(100,"g","quinoa"),ing(null,null,"verduras variadas (pimiento, calabacín, zanahoria)")]},
    {name:"Croquetas", ingredients:[ing(12,"ud","croquetas (o bechamel + jamón/pollo desmenuzado)"),ing(1,"ud","huevos"),ing(null,null,"pan rallado")]}
  ]},
  {dishes:[
    {name:"Pasta con calabaza y bacon", ingredients:[ing(200,"g","pasta"),ing(200,"g","calabaza"),ing(80,"g","bacon en tacos"),ing(1,"diente","ajo"),ing(100,"ml","nata o leche"),ing(null,null,"queso parmesano")]},
    {name:"Merluza rebozada con patatas", ingredients:[ing(2,"ud","filetes de merluza"),ing(null,null,"harina"),ing(1,"ud","huevos"),ing(2,"ud","patatas"),ing(null,null,"aceite de oliva")]}
  ]},
  {dishes:[
    {name:"Raxo con patatas", ingredients:[ing(300,"g","lomo de cerdo en tacos"),ing(2,"ud","patatas"),ing(2,"diente","ajo"),ing(null,null,"pimentón"),ing(null,null,"vino blanco")]},
    {name:"Ensalada de patata", ingredients:[ing(2,"ud","patatas"),ing(1,"ud","huevo cocido"),ing(null,null,"mayonesa"),ing(null,null,"aceitunas"),ing(null,null,"atún (opcional)")]}
  ]},
  {dishes:[
    {name:"Pescado al horno", ingredients:[ing(2,"ud","filetes de pescado blanco"),ing(1,"ud","limón"),ing(null,null,"patatas"),ing(null,null,"cebolla"),ing(null,null,"aceite de oliva")]},
    {name:"Nachos", ingredients:[ing(150,"g","nachos de maíz"),ing(100,"g","queso rallado"),ing(null,null,"tomate"),ing(null,null,"guacamole (opcional)"),ing(null,null,"jalapeños")]}
  ]}
],
[
  {dishes:[
    {name:"Cuartos de pollo al horno", ingredients:[ing(2,"ud","cuartos de pollo"),ing(2,"ud","patatas"),ing(null,null,"ajo"),ing(null,null,"romero"),ing(null,null,"aceite de oliva"),ing(null,null,"sal")]},
    {name:"Revuelto de gulas", ingredients:[ing(4,"ud","huevos"),ing(150,"g","gulas"),ing(null,null,"ajo"),ing(null,null,"guindilla (opcional)"),ing(null,null,"aceite de oliva")]}
  ]},
  {dishes:[
    {name:"Dorada con verduras a la plancha", ingredients:[ing(2,"ud","doradas"),ing(null,null,"calabacín"),ing(null,null,"pimiento"),ing(null,null,"cebolla"),ing(null,null,"aceite de oliva"),ing(null,null,"sal")]},
    {name:"Empanadillas", ingredients:[ing(10,"ud","obleas de empanadilla"),ing(null,null,"relleno de atún o carne"),ing(null,null,"tomate frito"),ing(1,"ud","huevo cocido (si es de atún)")]}
  ]},
  {dishes:[
    {name:"Ensalada de pasta con pollo", ingredients:[ing(200,"g","pasta"),ing(1,"ud","pechuga de pollo"),ing(null,null,"tomate cherry"),ing(null,null,"maíz"),ing(null,null,"aceitunas"),ing(null,null,"aceite de oliva")]},
    {name:"Boquerones/sardinas", ingredients:[ing(300,"g","boquerones o sardinas"),ing(null,null,"harina"),ing(null,null,"aceite de oliva"),ing(null,null,"limón"),ing(null,null,"sal")]}
  ]},
  {dishes:[
    {name:"Puré de lentejas/garbanzos + filetes de ternera", ingredients:[ing(200,"g","lentejas o garbanzos"),ing(null,null,"zanahoria"),ing(null,null,"cebolla"),ing(null,null,"ajo"),ing(2,"ud","filetes de ternera")]},
    {name:"Noodles", ingredients:[ing(200,"g","noodles"),ing(null,null,"verduras variadas (zanahoria, pimiento, brócoli)"),ing(null,null,"salsa de soja"),ing(null,null,"ajo"),ing(null,null,"jengibre")]}
  ]},
  {dishes:[
    {name:"Fideos con almejas", ingredients:[ing(200,"g","fideos"),ing(300,"g","almejas"),ing(null,null,"ajo"),ing(null,null,"perejil"),ing(null,null,"caldo de pescado"),ing(null,null,"vino blanco")]},
    {name:"Alitas de pollo", ingredients:[ing(8,"ud","alitas de pollo"),ing(null,null,"ajo"),ing(null,null,"pimentón"),ing(null,null,"aceite de oliva"),ing(null,null,"sal")]}
  ]},
  {dishes:[
    {name:"Albóndigas de ternera", ingredients:[ing(300,"g","carne picada de ternera"),ing(1,"ud","huevos"),ing(null,null,"pan rallado"),ing(null,null,"ajo"),ing(null,null,"perejil"),ing(null,null,"tomate frito")]},
    {name:"Pizza", ingredients:[ing(1,"ud","base de masa de pizza"),ing(null,null,"tomate frito"),ing(null,null,"mozzarella"),ing(null,null,"ingredientes al gusto")]}
  ]},
  {dishes:[
    {name:"Carbonara", ingredients:[ing(200,"g","pasta"),ing(100,"g","bacon o panceta"),ing(2,"ud","huevos"),ing(null,null,"queso parmesano"),ing(null,null,"pimienta")]},
    {name:"Piqui piqui", ingredients:[ing(300,"g","carne de cerdo o pollo en tacos"),ing(null,null,"patatas fritas"),ing(null,null,"ajo"),ing(null,null,"pimentón"),ing(null,null,"mayonesa o alioli")]}
  ]}
],
[
  {dishes:[
    {name:"Ensalada de arroz con pescado", ingredients:[ing(150,"g","arroz"),ing(200,"g","pescado (atún o similar)"),ing(null,null,"maíz"),ing(null,null,"pimiento"),ing(null,null,"aceitunas"),ing(null,null,"aceite de oliva")]},
    {name:"Revuelto de setas shiitake", ingredients:[ing(4,"ud","huevos"),ing(150,"g","setas shiitake"),ing(null,null,"ajo"),ing(null,null,"aceite de oliva"),ing(null,null,"perejil")]}
  ]},
  {dishes:[
    {name:"Gnocchi con calabaza", ingredients:[ing(300,"g","gnocchi"),ing(200,"g","calabaza"),ing(100,"ml","nata"),ing(null,null,"queso parmesano"),ing(null,null,"nuez moscada")]},
    {name:"Salpicón de palometa", ingredients:[ing(300,"g","palometa cocida"),ing(null,null,"pimiento"),ing(null,null,"cebolla"),ing(null,null,"aceitunas"),ing(null,null,"vinagre"),ing(null,null,"aceite de oliva")]}
  ]},
  {dishes:[
    {name:"Filetes de ternera con verdura rebozada", ingredients:[ing(2,"ud","filetes de ternera"),ing(null,null,"verduras variadas (calabacín, berenjena)"),ing(null,null,"harina"),ing(null,null,"huevo"),ing(null,null,"aceite de oliva")]},
    {name:"Fingers de merluza/calamares a la romana", ingredients:[ing(200,"g","merluza en tiras o calamares"),ing(null,null,"harina"),ing(null,null,"huevo"),ing(null,null,"pan rallado"),ing(null,null,"aceite de oliva")]}
  ]},
  {dishes:[
    {name:"Lubina con quinoa", ingredients:[ing(2,"ud","lubinas"),ing(100,"g","quinoa"),ing(null,null,"verduras al gusto"),ing(null,null,"limón"),ing(null,null,"aceite de oliva")]},
    {name:"Cinta de lomo con puré de patata", ingredients:[ing(2,"ud","cintas de lomo de cerdo"),ing(2,"ud","patatas"),ing(null,null,"leche o mantequilla (para el puré)")]}
  ]},
  {dishes:[
    {name:"Pasta con carne picada", ingredients:[ing(200,"g","pasta"),ing(200,"g","carne picada"),ing(null,null,"tomate frito"),ing(null,null,"cebolla"),ing(null,null,"ajo")]},
    {name:"Tortilla de patata", ingredients:[ing(4,"ud","huevos"),ing(2,"ud","patatas"),ing(1,"ud","cebolla (opcional)"),ing(null,null,"aceite de oliva")]}
  ]},
  {dishes:[
    {name:"Guiso de carne", ingredients:[ing(300,"g","carne de ternera o cerdo"),ing(null,null,"patatas"),ing(null,null,"zanahoria"),ing(null,null,"cebolla"),ing(null,null,"vino tinto o caldo")]},
    {name:"Sandwich sorpresa", ingredients:[ing(null,null,"pan de molde"),ing(null,null,"jamón york"),ing(null,null,"queso"),ing(null,null,"mayonesa"),ing(null,null,"huevo (si se reboza y fríe)")]}
  ]},
  {dishes:[
    {name:"Barbacoa", ingredients:[ing(350,"g","carne variada (costillas, chuletas, chorizo)"),ing(null,null,"pan"),ing(null,null,"salsas al gusto")]},
    {name:"Fritura de pescado", ingredients:[ing(300,"g","pescaditos variados (boquerones, calamares)"),ing(null,null,"harina"),ing(null,null,"aceite de oliva")]}
  ]}
],
[
  {dishes:[
    {name:"Crema de zanahoria", ingredients:[ing(400,"g","zanahoria"),ing(1,"ud","patata"),ing(null,null,"cebolla"),ing(null,null,"caldo de verduras"),ing(null,null,"nata (opcional)")]},
    {name:"Secreto a la plancha", ingredients:[ing(300,"g","secreto ibérico"),ing(null,null,"sal"),ing(null,null,"aceite de oliva")]},
    {name:"Calamar a la plancha", ingredients:[ing(300,"g","calamar"),ing(null,null,"ajo"),ing(null,null,"perejil"),ing(null,null,"aceite de oliva"),ing(null,null,"limón")]}
  ]},
  {dishes:[
    {name:"Merluza en salsa verde", ingredients:[ing(2,"ud","filetes de merluza"),ing(null,null,"ajo"),ing(null,null,"perejil"),ing(null,null,"harina"),ing(null,null,"caldo de pescado"),ing(null,null,"vino blanco"),ing(null,null,"guisantes (opcional)")]},
    {name:"Croquetas", ingredients:[ing(12,"ud","croquetas (o bechamel + jamón/pollo desmenuzado)"),ing(1,"ud","huevos"),ing(null,null,"pan rallado")]}
  ]},
  {dishes:[
    {name:"Puré de legumbres + filete de ternera", ingredients:[ing(200,"g","legumbres (lentejas o garbanzos)"),ing(null,null,"verduras variadas"),ing(2,"ud","filetes de ternera")]},
    {name:"Arroz con salchichas y huevo", ingredients:[ing(150,"g","arroz"),ing(4,"ud","salchichas"),ing(2,"ud","huevos"),ing(null,null,"tomate frito (opcional)")]}
  ]},
  {dishes:[
    {name:"Risotto de espinacas y brócoli", ingredients:[ing(200,"g","arroz arborio"),ing(150,"g","espinacas"),ing(100,"g","brócoli"),ing(null,null,"caldo de verduras"),ing(null,null,"cebolla"),ing(null,null,"queso parmesano")]},
    {name:"Gallos cocidos con patata y ajada", ingredients:[ing(2,"ud","gallos (pescado)"),ing(2,"ud","patatas"),ing(null,null,"ajo"),ing(null,null,"pimentón"),ing(null,null,"aceite de oliva")]}
  ]},
  {dishes:[
    {name:"Calabacines rellenos de bacalao", ingredients:[ing(2,"ud","calabacines"),ing(200,"g","bacalao desmigado"),ing(null,null,"cebolla"),ing(null,null,"tomate"),ing(null,null,"queso rallado")]},
    {name:"Nuggets de pollo y aritos de cebolla", ingredients:[ing(10,"ud","nuggets de pollo"),ing(1,"ud","cebolla grande"),ing(null,null,"harina"),ing(null,null,"huevo"),ing(null,null,"pan rallado")]}
  ]},
  {dishes:[
    {name:"Japonés / Chino", ingredients:[ing(null,null,"plato variable — añade aquí tus propios ingredientes")]}
  ]},
  {dishes:[
    {name:"Super hamburguesa (smash)", ingredients:[ing(300,"g","carne picada de ternera (2 hamburguesas smash)"),ing(2,"ud","panes de brioche"),ing(null,null,"queso cheddar"),ing(null,null,"cebolla"),ing(null,null,"salsa especial (mayonesa + ketchup + mostaza)"),ing(null,null,"pepinillos")]}
  ]}
]
];

/* Recordatorios de desayuno de partida (salen al final de la lista de la compra) */
export const DEFAULT_BREAKFAST=["pan para tostar","tomate"];
