# Revisión: ítem y elemento

Brief para otro agente. El modelo ya está en backend y frontend. Hay que revisar si la pantalla dice la verdad del modelo y si falta algún vínculo entre ítem y elemento. No revertir el ítem a número de serie.

## Modelo que debe quedar

Categoría → subcategoría → **ítem** → **elemento**.

El **ítem** es la ficha del producto. Solo lleva:

- nombre (ejemplo: `pintura para techos vinilo color rojo`)
- subcategoría (y por ella, la categoría)
- descripción
- estado

El **elemento** es el stock de ese ítem. Lleva cantidad, gramaje, marca, color, código, unidad, bodega/stand, descripción técnica y foto. Al crear o editar un elemento la cantidad mínima es **10**. El nombre y la subcategoría del elemento se copian del ítem en el backend; el formulario del elemento no los pide.

Un ítem puede tener varios elementos (mismo producto, distinto código, marca, ubicación o cantidad). Un elemento pertenece a un ítem.

## Qué tiene que verse

1. Tabla de **Elementos**: cada fila muestra el elemento y, al lado, de qué ítem es. Ejemplo: elemento `VIN-TECHO-ROJO` y columna `Ítem 6 · pintura para techos vinilo color rojo`. Si el elemento viejo no tiene ítem, dice `Sin ítem`.
2. Ojito del elemento (`/inventario/elementos/:id`): un bloque dice `Ítem N · nombre` y un botón **Ver ítem**.
3. **Ver ítem** abre `/inventario/items/:id`. Ahí está la ficha (nombre, descripción, categoría, subcategoría, estado) y la lista de elementos de ese ítem, con enlace **Ver elemento** de vuelta al stock.
4. La tabla de **Ítems** también tiene ojito hacia esa misma ficha. **Editar ítem** vuelve al listado con `?editar=<id>` y abre el modal.

## Dónde está

Frontend, repo `Plataforma_Frontend-S`:

- `src/modules/inventario/pages/ElementosPage.tsx` — columna Ítem en la tabla. El alta pide ítem, cantidad mínima 10 y gramaje opcional.
- `src/modules/inventario/pages/ViewElementoPage.tsx` — bloque del ítem y botón Ver ítem.
- `src/modules/inventario/pages/ViewItemPage.tsx` — ficha y stock del ítem.
- `src/modules/inventario/pages/ItemsPage.tsx` — listado, modal y ojito.
- `src/modules/inventario/navigation.ts` — `/inventario/items/:id` cuenta como ver ítem. Si el perfil ve elementos y no tiene un permiso propio de ítems, la pantalla Ítems se muestra igual y las acciones caen en las de elementos.
- `src/app/App.tsx` — rutas `/inventario/items` y `/inventario/items/:id`.

Backend, repo `Plataforma_Backend-S` (no reabrir el modelo salvo que la API no entregue el ítem anidado):

- `POST /api/v1/inventario/items` crea la ficha.
- `POST /api/v1/inventario/elementos` exige `idItem` y `cantidad` >= 10. Copia `nombre` e `idSubcategoria` desde el ítem.
- El listado y el detalle de elementos incluyen `item: { id, nombre, descripcion, idSubcategoria }` o `null`.
- `DELETE /api/v1/inventario/items/:id` deja el ítem inactivo. Responde 409 si todavía tiene elementos activos.
- Cambiar el nombre o la subcategoría del ítem actualiza esos dos campos en sus elementos.

## Cómo probar

Con el front en `http://localhost:5173` y el API en `http://localhost:3333`, sesión de admin.

1. Inventario → Elementos. La fila del código `VIN-TECHO-ROJO` debe decir `Ítem 6` y el nombre de la pintura. Extintor y destornillador viejos pueden decir `Sin ítem`: se migraron antes de este modelo y no se reescribieron.
2. Ojito de `VIN-TECHO-ROJO`. Debe decir el ítem 6 y el botón **Ver ítem** abre la ficha.
3. En la ficha: nombre, descripción `Vinilo para techo, acabado mate`, categoría Seguridad, subcategoría Contra incendio, y una fila de stock con cantidad 10, gramaje 1.5 y enlace de vuelta al elemento.
4. Crear un ítem nuevo y después un elemento de ese ítem con cantidad 10. Cantidad 9 no debe guardarse.
5. Buscar en Elementos por el nombre del ítem o por `ítem 6`.

## No cambiar sin preguntar

- No volver a `numero_serial` ni a crear ítems dentro del elemento.
- No subir la cantidad de los elementos viejos (extintor 3, destornillador 8) para cumplir el mínimo de 10. Ese mínimo es del API y del formulario al crear o editar, no un arreglo de filas históricas. La base solo exige `cantidad >= 0`.
- No hay pantalla de “usar” o descontar stock. Si hace falta un consumo de mínimo 10, es otro pedido.
- El menú no usa los códigos `item.ver` / `elemento.ver`. Usa las etiquetas de módulo. Ítems aparece junto a Elementos cuando el usuario puede ver elementos.

## Qué revisar y marcar si falla

- [ ] La tabla de elementos muestra ítem N y el nombre, no solo el nombre copiado del elemento.
- [ ] El detalle del elemento nombra el ítem y **Ver ítem** abre `/inventario/items/:id`.
- [ ] La ficha del ítem muestra descripción, clasificación y los elementos de ese `idItem`.
- [ ] Desde la ficha, **Ver elemento** vuelve al detalle del stock.
- [ ] Un elemento sin `idItem` dice `Sin ítem` y no ofrece Ver ítem.
- [ ] Alta de elemento sin ítem, o con cantidad menor a 10, no se envía.
- [ ] Inhabilitar un ítem con elementos activos muestra el 409 y no lo apaga en silencio.
- [ ] La ruta `/inventario/items/:id` no redirige a inicio por falta de permiso en `locateInventoryPath`.
