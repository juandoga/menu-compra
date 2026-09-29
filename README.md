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
  sheets/               las ventanas que suben desde abajo
tests/logica.test.mjs   pruebas de la lógica, sin pantalla
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
