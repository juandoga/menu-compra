# Menuse

App web para saber qué comer cada día (menú de 4 semanas) y hacer la compra una vez por semana.
Publicada en GitHub Pages: https://juandoga.github.io/menu-compra/

## Cómo está organizado el código (MVVM)

El código está separado en tres partes, como en una cocina:

| Parte | Carpeta | Qué hace |
|---|---|---|
| **Model** (la despensa) | `js/model/` | Los datos y las reglas: el menú, dónde se guarda todo, cómo se suma la lista de la compra, qué semana toca. No sabe nada de la pantalla. |
| **ViewModel** (el cocinero) | `js/viewmodel/` | El estado de la pantalla (qué semana miras, qué pestaña está abierta) y las órdenes de los botones. Prepara los datos listos para pintar. |
| **View** (el camarero) | `js/view/` | Pinta la pantalla con lo que le da el ViewModel y le pasa los toques de los botones. No hace cálculos. |

El camino de un toque: tocas un botón (View) → la View llama a una orden del ViewModel →
el ViewModel cambia el Model y avisa → la View se vuelve a pintar.

### Archivos

```
index.html              la estructura de la página (cabecera, pestañas)
css/styles.css          los estilos
js/app.js               el punto de arranque: conecta las tres partes
js/model/
  defaultMenu.js        el menú original de 4 semanas
  storage.js            lo único que habla con el almacenamiento del navegador
  sync.js               casa compartida: envía y recibe los cambios del servidor
  repository.js         leer y guardar cada tipo de dato
  rules.js              las reglas: lista de la compra, personas, cambios de día, buscador
  calendar.js           fechas y el ciclo de 4 semanas
  sections.js           secciones del súper
  text.js               ayudas para textos y cantidades
js/viewmodel/
  appViewModel.js       estado de la pantalla + órdenes
js/view/
  dom.js                piezas comunes (iconos, avisos, ventanas)
  hoyView.js            pestaña Hoy
  semanaView.js         pestaña Semana
  compraView.js         pestaña Compra
  dishBlock.js          cómo se pinta un plato
  sheets/               las ventanas que suben desde abajo (houseSheet.js: casa compartida)
tests/logica.test.mjs   pruebas de la lógica, sin pantalla
tests/sync.test.mjs     pruebas de la casa compartida, con un servidor de mentira
sw.js                   modo sin conexión y aviso de versión nueva
```

## Probarla en el ordenador

Al estar repartida en varios archivos, **no se puede abrir con doble clic** en `index.html`:
el navegador no carga los archivos de `js/` así, por seguridad.
Hay que abrirla con un pequeño servidor. Lo más fácil en VS Code:

1. Instala la extensión **Live Server** (de Ritwick Dey).
2. Clic derecho en `index.html` → **Open with Live Server**.

## Pruebas de la lógica

Con Node.js instalado, en la carpeta del proyecto:

```
node --test
```

Al final debe poner `fail 0`.

## Al publicar una versión nueva

Si cambias `sw.js`, sube el número de `CACHE` (`menuse-v3` → `menuse-v4`).
Si creas un archivo nuevo en `js/` o `css/`, añádelo a la lista `ASSETS` de `sw.js`.

## Lista de la compra: lo añadido a mano

Lo que escribes abajo en la lista va en apartados propios, separado de lo que pide el menú:
- **Sólo esta compra** (chincheta gris): se borra al pulsar «Compra hecha».
- **Todas las semanas** (chincheta roja): sale siempre; si una semana no hace falta, se tacha.

## Casa compartida (varios móviles con el mismo menú)

En Ajustes → Casa compartida se crea una «casa» con un nombre (por ejemplo «Casa García») y se
recibe un código (por ejemplo `K7PM-3QXD`). El nombre sale bajo el logo en todos los móviles de
la casa; si no estás en ninguna, no sale nada y Ajustes lo dice.
Los móviles que se unen con ese código comparten el menú, las listas, los fijos, los pasillos,
las personas y el gasto. Cada casa es independiente de las demás.

- Cada móvil sigue guardando todo en su navegador: sin conexión funciona igual y, al volver,
  envía lo que cambió.
- Los cambios de los demás se recogen al abrir la app, al volver a ella y cada 20 segundos
  (no mientras hay una ventana abierta, para no pisar lo que estás editando).
- Si dos personas cambian lo mismo a la vez, se queda el último cambio.
- Son de cada móvil: el tema, los avisos del congelador y cómo se ve la lista.

**Servidor:** Supabase, dentro del proyecto *el-contraste* (el plan gratis sólo permite dos
proyectos). Todo lo de Menuse está aparte, en el esquema `menuse` (tablas `casas` y `datos`),
y desde fuera sólo se puede usar con cuatro funciones: `menuse_crear_casa`, `menuse_existe_casa`,
`menuse_leer` y `menuse_guardar`. La dirección y la clave pública están al principio de `js/model/sync.js`.

## Pendiente

- **Importar un menú desde Excel.** Viable sin servidor (librería que lee .xlsx en el navegador).
  Idea: la app da una plantilla (*Semana · Día · Comida/Cena · Plato · Ingredientes*, ingredientes
  separados por comas: «300 g pescado blanco, 2 ud patatas»), se rellena en Excel y se sube desde
  Ajustes para el menú general o una estación. Antes de sustituir nada, mostrar un resumen
  («28 días leídos, 3 filas con dudas»).
- **Casa compartida con cuentas:** pasar del código a inicio de sesión (cada persona con su cuenta
  y grupos familiares).
- **Sacar Menuse de el-contraste:** ahora comparte proyecto de Supabase con Vista Plena;
  buscar una solución mejor que mezclar proyectos.
