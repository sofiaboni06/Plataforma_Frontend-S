# Crear un elemento

El elemento es el stock de un ítem. No se crea suelto: antes tienen que existir el ítem (con su categoría y subcategoría) y el stand (dentro de una sub-bodega, y esa sub-bodega dentro de una bodega).

Pantalla: **Inventario → Elementos → Nuevo elemento**.  
API: `POST /api/v1/inventario/elementos`.

## Cadena que queda guardada

Producto:

`categoría` → `subcategoría` → `ítem` → `elemento`

El formulario pide el ítem. El backend copia al elemento el `nombre` y el `id_subcategoria` de ese ítem. La categoría no se guarda en el elemento: se llega por la subcategoría del ítem.

Ubicación:

`bodega` → `sub-bodega` → `stand` → `elemento`

El formulario pide bodega, sub-bodega y stand, en ese orden. Al guardar solo se envía `idStand`. El stand ya tiene `id_sub_bodega` y la sub-bodega ya tiene `id_bodega`.

## Antes de crear el elemento

1. **Categoría** en Inventario → Categorías.
2. **Subcategoría** de esa categoría (se crea dentro de la categoría).
3. **Ítem** en Inventario → Ítems. El ítem elige categoría y subcategoría. Lo que se guarda en el ítem es `idSubcategoria`, `nombre` y, si se llena, `descripcion`.
4. **Bodega** en Inventario → Bodegas.
5. **Sub-bodega** dentro de esa bodega.
6. **Stand** dentro de esa sub-bodega.
7. Una **unidad de medida** activa del centro de la bodega. Clasificación, código UNSPSC y uso presupuestal salen del mismo centro y son opcionales. Un centro nuevo llega con esos catálogos vacíos.

Si el usuario no es administrador y no tiene bodega asignada, el formulario no deja crear el elemento.

## Columnas que pide el formulario

Obligatorias. Si falta una, no se envía el alta.

| Campo del formulario | Se envía como | Columna en `elemento` | Regla |
| --- | --- | --- | --- |
| Ítem | `idItem` | `id_item` | Ítem activo. De él salen nombre, subcategoría y categoría. |
| Bodega | no se envía | — | Solo filtra las sub-bodegas. |
| Sub-bodega | no se envía | — | Solo filtra los stands de esa sub-bodega. |
| Stand | `idStand` | `id_stand` | Stand activo de la sub-bodega elegida. |
| Unidad de medida | `idUnidadMedida` | `id_unidad_medida` | Id de `GET /unidades-medida?idCformacion=` de la bodega. |
| Código | `codigo` | `codigo` | Código interno del inventario, máximo 50. No es el UNSPSC. |
| Cantidad | `cantidad` | `cantidad` | Número entero. Mínimo 10. |
| Elemento activo | `estado` | `estado` | Casilla. Al crear queda activo. |

Opcionales. Si se dejan vacías, no viajan en el alta.

| Campo del formulario | Se envía como | Columna en `elemento` | Regla |
| --- | --- | --- | --- |
| Clasificación | `idClasificacion` | `id_clasificacion_elemento` | Id de `GET /clasificaciones-elemento?idCformacion=` de la bodega. |
| Código UNSPSC | `idCodigoEstandar` | `id_codigo_estandar` | Id de `GET /codigos-estandar?idCformacion=`. No se envía el código escrito. |
| Uso presupuestal | `idUsoPresupuestal` | `id_uso_presupuestal` | Id de `GET /usos-presupuestales?idCformacion=`. Es la partida, no el UNSPSC. |
| Gramaje | `gramaje` | `gramaje` | Número mayor o igual a 0. |
| Marca | `marca` | `marca` | Texto, máximo 80. |
| Color | `color` | `color` | Texto, máximo 80. |
| Valor unitario promedio | `valorUnitarioPromedio` | `valor_unitario_promedio` | Número mayor o igual a 0. |
| Porcentaje de aumento | `porcentajeAumento` | `porcentaje_aumento` | Número mayor o igual a 0. Escribir `15` es 15 %. |
| Descripción técnica | `descripcion` | `descripcion_tecnica` | Texto, máximo 5000. |

## Columnas que llena el sistema

Estas no se escriben en el formulario.

| Columna en `elemento` | De dónde sale |
| --- | --- |
| `id_elemento` | La base la genera. |
| `nombre` | Se copia del ítem. Si después cambia el nombre del ítem, se actualiza en sus elementos. |
| `id_subcategoria` | Se copia del ítem. La categoría se lee de esa subcategoría (`subcategoria.id_categoria`). |
| `cantidad_minima` | Queda en 10 si el alta no la manda. El formulario no la pide. |
| `valor_con_aumento` | No es columna. El API lo calcula: `cantidad × valor unitario × (1 + porcentaje / 100)`. Solo aparece cuando hay valor unitario y porcentaje. |

## Columnas que el alta no usa

| Columna | Qué pasa |
| --- | --- |
| `url_fotografia` | No se escribe. El formulario pide un archivo del PC. Tras crear el elemento se sube a `POST /api/v1/inventario/elementos/:id/fotografia` (campo `fotografia`, JPG/PNG/WEBP, máximo 8 MB). La tabla y el detalle leen `GET` de esa misma ruta. |

## Ejemplo de lo que sale del formulario

```json
{
  "idItem": 6,
  "idStand": 12,
  "cantidad": 10,
  "estado": true,
  "idUnidadMedida": 1,
  "codigo": "VIN-TECHO-ROJO",
  "gramaje": 1.5,
  "marca": "Pintuco",
  "color": "Rojo"
}
```

`idItem` 6 ya trae su subcategoría y, por ella, la categoría. `idStand` 12 ya está en una sub-bodega y esa sub-bodega en una bodega. Esas dos relaciones no se repiten en el JSON.

## Cómo comprobar que quedó bien

En el listado de elementos, la fila debe mostrar:

- el nombre y el código del elemento
- `Ítem N · nombre del ítem`
- la subcategoría
- la bodega, y debajo `sub-bodega · stand`

En el ojito (`/inventario/elementos/:id`) deben verse categoría, subcategoría, bodega, sub-bodega, stand y el botón **Ver ítem**.

Cantidad menor a 10 no se guarda. Un elemento sin ítem o sin stand tampoco.
