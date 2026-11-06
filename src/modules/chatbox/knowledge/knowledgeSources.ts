/**
 * Base de conocimiento del Asistente SIGMA.
 *
 * Arquitectura preparada para RAG (Recuperación Aumentada por Generación):
 *  - Fuentes documentales por área/módulo, con ruta, permisos, versionado y
 *    fecha de actualización.
 *  - Recuperación por similitud léxica (normalizada) con frases clave.
 *  - Referencias devueltas junto a cada respuesta.
 *
 * REGLAS DE CONTENIDO:
 *  - Todo contenido se deriva de la funcionalidad REAL de la plataforma
 *    (rutas de src/app/App.tsx, permisos de los módulos y UI existente).
 *  - Nunca se inventan endpoints, permisos, rutas ni procedimientos.
 *  - Si algo no existe en SIGMA, se declara explícitamente (ver `faq-proyectos`).
 *
 * ACTUALIZACIÓN: para agregar un módulo o cambiar un procedimiento basta con
 * editar este archivo (o, en el futuro, consumir el índice desde el backend);
 * no es necesario tocar la interfaz del ChatBox.
 */

import type { ChatReference, ChatReferenceKind } from '@/modules/chatbox/types/chat.types'

export const KNOWLEDGE_VERSION = '1.0.0'
export const KNOWLEDGE_UPDATED_AT = '2026-11-06'

export type KnowledgeSourceKind = 'modulo' | 'procedimiento' | 'faq'

export type KnowledgeSource = {
  id: string
  /** Título visible en las referencias. */
  title: string
  /** Una de las áreas funcionales de SIGMA (ej. "Inventario"). */
  area: string
  module: string
  kind: KnowledgeSourceKind
  /** Ruta real en la plataforma (solo si existe). */
  route?: string
  summary: string
  /** Procedimiento paso a paso, cuando la UI lo permite. */
  steps?: string[]
  /** Códigos de permisos reales que habilitan la funcionalidad. */
  permissions?: string[]
  /** Roles que suelen usarla (según la lógica de acceso del proyecto). */
  roles?: string[]
  /** Términos de recuperación (incluye frases y variantes verbales). */
  keywords: string[]
  /** Versionado por fuente; si se omite usa KNOWLEDGE_VERSION. */
  version?: string
  /** Última actualización (YYYY-MM-DD); si se omite usa KNOWLEDGE_UPDATED_AT. */
  updatedAt?: string
}

/* Preguntas sugeridas obligatorias: son accesos rápidos, se envían como
 * mensajes reales y se resuelven contra esta base de conocimiento. */
export const SUGGESTED_QUESTIONS: readonly string[] = [
  '¿Cómo funciona SIGMA?',
  '¿Cómo creo un nuevo proyecto?',
  '¿Cómo gestiono los materiales de formación?',
  '¿Cómo solicito un equipo?',
  '¿Cómo consulto el inventario?',
  '¿Cómo apruebo una solicitud?',
] as const

export const KNOWLEDGE_SOURCES: KnowledgeSource[] = [
  /* ============================ 1. PLATAFORMA ============================ */
  {
    id: 'sigma-general',
    title: 'Plataforma SIGMA: navegación y acceso',
    area: 'Plataforma SIGMA y navegación general',
    module: 'General',
    kind: 'modulo',
    route: '/inicio',
    summary:
      'SIGMA es la plataforma de gestión de la Fábrica de Software SENA. Tras iniciar sesión se entra en /inicio, donde aparecen las tarjetas de los módulos asignados a tu perfil. El menú lateral izquierdo (Sidebar) lista los módulos permitidos; el encabezado superior concentra la fecha, las notificaciones y tu cuenta.',
    steps: [
      'Inicia sesión en /login con tu correo o documento y contraseña.',
      'En /inicio verás solo los módulos que tu perfil tiene asignados.',
      'Usa el menú lateral o las tarjetas de /inicio para entrar a cada módulo.',
      'El acceso lo rige la cadena usuario → perfil (id_perfil) → módulos asignados al perfil; el menú llega filtrado desde el servidor.',
      'Si un módulo no aparece, tu perfil no lo tiene asignado: lo gestiona un Administrador en /perfiles.',
    ],
    permissions: ['Módulos del perfil (modulo_perfil)'],
    roles: ['Todos los perfiles autenticados'],
    keywords: [
      'sigma',
      'plataforma',
      'como funciona',
      'funcionamiento',
      'navegacion',
      'menu',
      'inicio de sesion',
      'orientacion',
      'guia general',
      'donde empiezo',
    ],
  },

  {
    id: 'inicio-dashboard',
    title: 'Inicio autenticado y módulos disponibles',
    area: 'Inicio y dashboard',
    module: 'Inicio',
    kind: 'modulo',
    route: '/inicio',
    summary:
      'La vista /inicio muestra el saludo de bienvenida, tus programas asignados (cuando tu perfil los tiene) y la sección "Módulos disponibles": tarjetas dinámicas con un botón "Abrir módulo" hacia cada sección autorizada.',
    steps: [
      'Entra a /inicio desde el menú lateral.',
      'Revisa las tarjetas "Módulos disponibles": cada una refleja los módulos de tu perfil.',
      'Pulsa "Abrir módulo" para entrar a la sección que necesitas.',
    ],
    roles: ['Todos los perfiles autenticados'],
    keywords: [
      'inicio',
      'dashboard',
      'panel',
      'bienvenida',
      'tarjetas',
      'modulos disponibles',
      'home',
    ],
  },

  /* ============================ 2. INVENTARIO ============================ */
  {
    id: 'inventario-general',
    title: 'Inventario: consulta y gestión',
    area: 'Inventario',
    module: 'Inventario',
    kind: 'modulo',
    route: '/inventario',
    summary:
      'El módulo /inventario tiene dos caras según tu permiso: quien solo solicita ve "Elementos disponibles para solicitar" con acceso a solicitudes y alertas; quien gestiona (administrador o admin de bodega) ve el resumen general con KPIs, gráfica por categorías, accesos rápidos, inventario por categorías y últimos movimientos. Los permisos base son elemento.ver, item.ver y alerta.ver.',
    steps: [
      'Abre "Inventario" en el menú lateral (o /inventario).',
      'Si tienes permisos de gestión, usa los accesos rápidos: "Registrar bien", "Consultar inventario" o "Generar reporte".',
      'Si solo tienes permiso de solicitud, revisa "Elementos disponibles para solicitar" y entra a "Ir a solicitudes".',
      'Las alertas de stock se consultan en /inventario/alertas.',
    ],
    permissions: ['elemento.ver', 'item.ver', 'alerta.ver'],
    keywords: [
      'inventario',
      'consultar inventario',
      'ver inventario',
      'gestionar inventario',
      'resumen',
      'kpi',
      'accesos rapidos',
    ],
  },

  {
    id: 'bodegas',
    title: 'Bodegas y subbodegas',
    area: 'Bodegas y subbodegas',
    module: 'Inventario',
    kind: 'procedimiento',
    route: '/inventario/bodegas',
    summary:
      'Las bodegas se gestionan en /inventario/bodegas con buscador y acciones de ver, editar y eliminar (eliminar solo aplica cuando la bodega no tiene subbodegas). Cada bodega se abre en detalle para crear o editar subbodegas. Requiere los permisos bodega.ver, bodega.crear, bodega.editar y bodega.eliminar.',
    steps: [
      'Ve a Inventario → Bodegas (/inventario/bodegas).',
      'Para crear: botón de alta y completa los datos de la bodega.',
      'Para crear una subbodega: abre la bodega (Ver) y usa la acción de subbodega dentro de su detalle.',
      'Para editar o eliminar: usa las acciones de la fila; la eliminación solo está disponible si la bodega no tiene subbodegas.',
    ],
    permissions: ['bodega.ver', 'bodega.crear', 'bodega.editar', 'bodega.eliminar'],
    keywords: [
      'bodega',
      'bodegas',
      'subbodega',
      'subbodegas',
      'crear bodega',
      'gestionar bodega',
      'almacen',
    ],
  },

  {
    id: 'stands',
    title: 'Stands del inventario',
    area: 'Stands',
    module: 'Inventario',
    kind: 'procedimiento',
    route: '/inventario/stands',
    summary:
      'Los stands se crean y gestionan desde /inventario/stands o desde el detalle de una subbodega (Inventario → Bodega → subbodega → stands). Cada stand muestra sus elementos. Se puede ver, editar y eliminar; la eliminación solo procede si el stand no tiene elementos. Permisos: stand.ver, stand.crear, stand.editar, stand.eliminar.',
    steps: [
      'Ve a Inventario → Stands, o abre la bodega y su subbodega y entra a stands.',
      'Crea un stand con el botón de alta (nombre y subbodega correspondiente).',
      'Abre un stand para ver los elementos que contiene.',
      'Edita o elimina desde la fila; si el stand tiene elementos, no se puede eliminar.',
    ],
    permissions: ['stand.ver', 'stand.crear', 'stand.editar', 'stand.eliminar'],
    keywords: ['stand', 'stands', 'crear stand', 'gestionar stand', 'expositor'],
  },

  {
    id: 'items',
    title: 'Ítems del inventario',
    area: 'Ítems y elementos',
    module: 'Inventario',
    kind: 'procedimiento',
    route: '/inventario/items',
    summary:
      'Los ítems son las fichas de producto del catálogo. En /inventario/items puedes buscar por nombre, descripción o categoría, crear un ítem nuevo, ver su detalle, editarlo e inhabilitarlo. Permisos: item.ver, item.crear, item.editar, item.eliminar.',
    steps: [
      'Ve a Inventario → Ítems (/inventario/items).',
      'Crea un ítem con "Nuevo ítem" y completa nombre, categoría y datos del catálogo.',
      'Busca con el buscador por nombre, descripción o categoría.',
      'Desde la fila: Ver ítem, Editar ítem o Inhabilitar ítem.',
    ],
    permissions: ['item.ver', 'item.crear', 'item.editar', 'item.eliminar'],
    keywords: [
      'item',
      'items',
      'items del inventario',
      'crear item',
      'nuevo item',
      'catalogo de producto',
    ],
  },

  {
    id: 'elementos',
    title: 'Elementos: stock, plantillas e importación',
    area: 'Ítems y elementos',
    module: 'Inventario',
    kind: 'procedimiento',
    route: '/inventario/elementos',
    summary:
      'Los elementos representan el stock físico (con código, ubicación y cantidad). En /inventario/elementos puedes crear elementos, editarlos, inhabilitarlos, descargar la plantilla de Excel, subir un archivo .xlsx/.xls con importación masiva y exportar el listado (Excel o PDF) eligiendo campos. Permisos: elemento.ver, elemento.crear, elemento.editar.',
    steps: [
      'Ve a Inventario → Elementos (/inventario/elementos).',
      'Para carga masiva: "Descargar plantilla", diligencia el Excel y usa "Subir Excel" (el sistema reporta errores fila por fila).',
      'Para alta individual: "Nuevo elemento" y completa código, cantidad y ubicación (bodega/subbodega/stand).',
      'Para exportar: usa el selector de campos con las opciones Excel o PDF.',
      'Para cambios: acciones Ver, Editar o Inhabilitar en cada fila.',
    ],
    permissions: ['elemento.ver', 'elemento.crear', 'elemento.editar'],
    keywords: [
      'elemento',
      'elementos',
      'stock',
      'crear elemento',
      'importar excel',
      'subir excel',
      'plantilla',
      'carga masiva',
      'exportar elementos',
    ],
  },

  {
    id: 'categorias',
    title: 'Categorías y subcategorías',
    area: 'Inventario',
    module: 'Inventario',
    kind: 'procedimiento',
    route: '/inventario/categorias',
    summary:
      'En /inventario/categorias se administran las categorías del catálogo y sus subcategorías: crear categoría, ver detalle, editar (incluye crear y editar subcategorías) e inhabilitar. Permisos: categoria.ver/crear/editar/eliminar y subcategoria.ver/crear/editar.',
    steps: [
      'Ve a Inventario → Categorías.',
      'Crea una categoría con el botón de alta y agrega sus subcategorías.',
      'Abre la categoría para ver el detalle o editarla (incluye subcategorías).',
      'Inhabilita o edita desde la fila cuando sea necesario.',
    ],
    permissions: [
      'categoria.ver',
      'categoria.crear',
      'categoria.editar',
      'categoria.eliminar',
      'subcategoria.crear',
      'subcategoria.editar',
    ],
    keywords: ['categoria', 'categorias', 'subcategoria', 'subcategorias', 'clasificar'],
  },

  {
    id: 'catalogo-centro',
    title: 'Catálogo del centro: clasificaciones, unidades, usos y códigos',
    area: 'Inventario',
    module: 'Inventario',
    kind: 'modulo',
    route: '/inventario/clasificaciones',
    summary:
      'El catálogo del centro reúne cuatro tablas maestras: clasificaciones de elemento (/inventario/clasificaciones), unidades de medida (/inventario/unidades), usos presupuestales (/inventario/usos-presupuestales) y códigos estándar UNSPSC (/inventario/codigos-estandar). Cada tabla permite crear con el botón +, buscar y editar por fila.',
    permissions: [
      'clasificacion_elemento.ver',
      'unidad_medida.ver',
      'uso_presupuestal.ver',
      'codigo_estandar.crear',
    ],
    keywords: [
      'clasificacion',
      'unidades de medida',
      'uso presupuestal',
      'codigo estandar',
      'unspsc',
      'catalogo del centro',
      'tablas maestras',
    ],
  },

  {
    id: 'obras',
    title: 'Obras y ubicaciones',
    area: 'Inventario',
    module: 'Inventario',
    kind: 'procedimiento',
    route: '/inventario/obras',
    summary:
      'Las obras registran espacios o ubicaciones del centro (por ejemplo "Ambiente 204, sede norte"). En /inventario/obras puedes buscar por obra o lugar, crear con modal, editar e inhabilitar. Permisos: obra.ver, obra.crear, obra.editar, obra.eliminar.',
    steps: [
      'Ve a Inventario → Obras (/inventario/obras).',
      'Crea con el botón de alta y describe el espacio o lugar.',
      'Edita o inhabilita desde las acciones de la fila.',
    ],
    permissions: ['obra.ver', 'obra.crear', 'obra.editar', 'obra.eliminar'],
    keywords: ['obra', 'obras', 'crear obra', 'lugar', 'ubicacion', 'ambiente', 'sede'],
  },

  {
    id: 'tablero-bodega',
    title: 'Tablero de bodega (indicadores)',
    area: 'Inventario',
    module: 'Inventario',
    kind: 'modulo',
    route: '/inventario/tablero',
    summary:
      'El tablero /inventario/tablero está dirigido al administrador de bodega: KPIs y gráficas expandibles de devoluciones, préstamos y solicitudes; pedidos y rotación (elementos más pedidos, rotación, entregas por mes, solicitudes vs entregas); e inventario (consumo vs devolutivo y stock bajo). Es la vista por defecto para el rol de administrador de bodega.',
    permissions: ['bodega.editar', 'solicitud_equipo.devolver'],
    roles: ['Administrador de bodega'],
    keywords: [
      'tablero',
      'tablero de bodega',
      'indicadores',
      'graficas',
      'dashboard bodega',
      'rotacion',
      'prestamos vencidos',
    ],
  },

  {
    id: 'alertas-inventario',
    title: 'Alertas de inventario',
    area: 'Inventario',
    module: 'Inventario',
    kind: 'modulo',
    route: '/inventario/alertas',
    summary:
      'En /inventario/alertas (también enlace desde /alertas) ves el resumen de alertas: agotados, críticos, bajos, activas y cerradas, con filtros por nombre o código, tipo, estado y rango de fechas. Cada fila permite "Ver elemento". Las alertas se cierran automáticamente cuando se repone el stock; no existe cierre manual. Requiere alerta.ver (y elemento.ver para abrir el elemento).',
    permissions: ['alerta.ver', 'elemento.ver'],
    keywords: [
      'alerta',
      'alertas',
      'stock bajo',
      'agotado',
      'critico',
      'reponer',
      'notificaciones de inventario',
    ],
  },

  /* ===================== 3. SOLICITUDES Y PRÉSTAMOS ===================== */
  {
    id: 'solicitudes-equipo',
    title: 'Solicitudes de equipo devolutivo: crear y entregar',
    area: 'Solicitudes y préstamos',
    module: 'Inventario',
    kind: 'procedimiento',
    route: '/inventario/solicitudes/equipo',
    summary:
      'Las solicitudes de equipo se gestionan en Inventario → Solicitudes → Equipo devolutivo. El flujo real es: crear la solicitud (queda en estado "pendiente" y NO descuenta stock), entregarla desde la pestaña "Entregar" (el backend descuenta stock y registra la fecha límite de devolución) y finalmente recibirla de vuelta. Estados de la solicitud: pendiente → parcial → entregado → cerrado.',
    steps: [
      'Entra a Inventario → Solicitudes (/inventario/solicitudes) y elige "Equipo devolutivo".',
      'En la pestaña "Solicitar" pulsa "Nueva solicitud" y agrega los elementos con obra y cantidad.',
      'Al guardar, la solicitud queda "Pendiente" (no descuenta stock hasta la entrega).',
      'Quien entrega usa la pestaña "Entregar": "Entregar" por línea o "Entregar todo lo disponible"; ahí se define la fecha límite de devolución.',
      'Si el permiso lo tiene, también se registra la devolución desde la pestaña "Devolver".',
    ],
    permissions: ['solicitud_equipo.ver', 'solicitud_equipo.crear', 'solicitud_equipo.entregar'],
    roles: ['Solicitante', 'Administrador de bodega'],
    keywords: [
      'solicitar equipo',
      'solicitud de equipo',
      'solicito equipo',
      'nueva solicitud',
      'prestamo de equipo',
      'prestar equipo',
      'equipo devolutivo',
      'pedir equipo',
      'apruebo solicitud equipo',
      'entregar solicitud',
    ],
  },

  {
    id: 'solicitudes-material',
    title: 'Solicitudes de material de consumo',
    area: 'Solicitudes y préstamos',
    module: 'Inventario',
    kind: 'procedimiento',
    route: '/inventario/solicitudes/material',
    summary:
      'Las solicitudes de material de consumo se crean en Inventario → Solicitudes → Material de consumo, con el mismo patrón que el equipo: se crean, quedan pendientes y se entregan desde la pestaña "Entregar". Permisos: solicitud_material.ver, solicitud_material.crear, solicitud_material.entregar.',
    steps: [
      'Entra a Inventario → Solicitudes y elige "Material de consumo".',
      'Crea la solicitud con "Nueva solicitud" y agrega los materiales.',
      'La entrega se registra en la pestaña "Entregar" por línea o de una vez.',
    ],
    permissions: ['solicitud_material.ver', 'solicitud_material.crear', 'solicitud_material.entregar'],
    keywords: [
      'material de consumo',
      'solicitud de material',
      'solicitar material inventario',
      'consumibles',
    ],
  },

  {
    id: 'prestamos-devoluciones',
    title: 'Entregas, préstamos y devoluciones de equipos',
    area: 'Devoluciones de equipos',
    module: 'Inventario',
    kind: 'procedimiento',
    route: '/inventario/solicitudes/prestamos',
    summary:
      'La vista "Entregas y devoluciones" (/inventario/solicitudes/prestamos) agrupa por persona: muestra quién tiene equipo afuera, unidades afuera y pedidos vencidos. Permite "Ver solicitud", "Cambiar la fecha límite" de un pedido y "Recibir devolución". Al registrar la devolución se indica el estado de cada unidad (bueno, dañado, perdido, en reparación) y, si vuelven en buen estado, el stock vuelve a sumarse automáticamente.',
    steps: [
      'Entra a Inventario → Solicitudes → "Entregas y devoluciones".',
      'Busca por persona, código, obra o elemento.',
      'Si hace falta, usa "Cambiar la fecha límite" para ampliar el plazo.',
      'Pulsa "Recibir devolución" y marca el estado de cada unidad (bueno, dañado, perdido, en reparación) con su observación.',
      'Las unidades en buen estado regresan al stock automáticamente.',
    ],
    permissions: ['solicitud_equipo.devolver', 'solicitud_equipo.ver'],
    roles: ['Administrador de bodega'],
    keywords: [
      'devolver equipo',
      'devolucion',
      'devoluciones',
      'recibir devolucion',
      'prestamo',
      'prestamos',
      'equipo por devolver',
      'fecha limite',
      'unidades afuera',
      'vencidos',
    ],
  },

  {
    id: 'solicitudes-home',
    title: 'Centro de solicitudes',
    area: 'Solicitudes y préstamos',
    module: 'Inventario',
    kind: 'modulo',
    route: '/inventario/solicitudes',
    summary:
      'El centro de solicitudes (/inventario/solicitudes) agrupa las tarjetas "Equipo devolutivo" y "Material de consumo" (visibles según permiso), la tarjeta "Entregas y devoluciones", la tabla "Todas las solicitudes" con buscador y filtro de estado (Todas, Pendiente, Entrega parcial, Entregado, Cerrado) y botones de cabecera "Registrar en mostrador" y "Nueva solicitud".',
    permissions: ['solicitud_equipo.ver', 'solicitud_material.ver'],
    keywords: [
      'centro de solicitudes',
      'todas las solicitudes',
      'registrar en mostrador',
      'facturas',
      'estados de solicitud',
    ],
  },

  /* ===================== 4. MATERIALES DE FORMACIÓN ===================== */
  {
    id: 'materiales-formacion-general',
    title: 'Materiales de formación: "Mis programas"',
    area: 'Materiales de formación',
    module: 'Materiales de formación',
    kind: 'modulo',
    route: '/materiales-formacion',
    summary:
      'En /materiales-formacion cada instructor o coordinador ve "Mis programas" con buscador y, por cada programa, la acción "Lista de materiales" (si tiene el permiso). Desde ahí se entra al detalle de los materiales de ese programa. La sección solo aparece en el menú para perfiles con permisos de materiales o para roles instructor/coordinador.',
    permissions: [
      'lista_maestra.ver',
      'solicitud_programa.ver',
      'programa_formacion.ver',
      'material_formacion.ver',
    ],
    roles: ['Instructor', 'Coordinador', 'Perfil con materiales asignados'],
    keywords: [
      'materiales de formacion',
      'gestionar materiales',
      'materiales',
      'mis programas',
      'lista de materiales',
      'material de formacion',
    ],
  },

  {
    id: 'programas-formacion',
    title: 'Programas de formación',
    area: 'Programas de formación',
    module: 'Formación',
    kind: 'procedimiento',
    route: '/formacion/programas',
    summary:
      'Los programas se gestionan en /formacion/programas: buscador, ver o gestionar la lista de materiales del programa (acceso a listas maestras), editar programa y desactivar programa. El alta y edición permiten nivel, red de conocimiento, línea temática y duración. Permisos: programa_formacion.ver/crear/editar/eliminar.',
    steps: [
      'Ve a Formación → Programas (/formacion/programas).',
      'Crea o edita un programa indicando nivel, red, línea temática y duración.',
      'Usa la acción de lista de materiales para trabajar su lista maestra.',
      'Desactiva un programa desde la fila cuando corresponda.',
    ],
    permissions: [
      'programa_formacion.ver',
      'programa_formacion.crear',
      'programa_formacion.editar',
      'programa_formacion.eliminar',
    ],
    keywords: [
      'programa',
      'programas',
      'programas de formacion',
      'crear programa',
      'editar programa',
      'gestionar programas',
    ],
  },

  {
    id: 'fichas',
    title: 'Fichas de formación',
    area: 'Fichas',
    module: 'Formación',
    kind: 'procedimiento',
    route: '/formacion/fichas',
    summary:
      'Las fichas se administran en /formacion/fichas: buscador por número de ficha, programa, centro o jornada; acciones Ver ficha, Editar ficha y Deshabilitar ficha. El alta/edición selecciona programa, centro de formación y jornada. Permisos: ficha.ver/crear/editar/eliminar.',
    steps: [
      'Ve a Formación → Fichas (/formacion/fichas).',
      'Crea la ficha con número, programa, centro y jornada.',
      'Abre la ficha para ver su detalle o editarla.',
      'Deshabilita la ficha desde la fila cuando deje de estar activa.',
    ],
    permissions: ['ficha.ver', 'ficha.crear', 'ficha.editar', 'ficha.eliminar'],
    keywords: ['ficha', 'fichas', 'crear ficha', 'numero de ficha', 'jornada', 'centro'],
  },

  {
    id: 'redes-conocimiento',
    title: 'Redes de conocimiento',
    area: 'Redes de conocimiento',
    module: 'Formación',
    kind: 'procedimiento',
    route: '/formacion/redes',
    summary:
      'Las redes de conocimiento se gestionan en /formacion/redes con buscador por nombre, gestor, asesor o línea temática. Permite alta, edición y eliminación de redes, y contiene las pestañas de estructura (redes y líneas temáticas). Permisos: red_conocimiento.ver/crear/editar/eliminar.',
    steps: [
      'Ve a Formación → Redes (/formacion/redes).',
      'Crea la red con nombre, gestor y asesor.',
      'Edita o elimina desde la fila según tu permiso.',
    ],
    permissions: [
      'red_conocimiento.ver',
      'red_conocimiento.crear',
      'red_conocimiento.editar',
      'red_conocimiento.eliminar',
    ],
    keywords: ['red', 'redes', 'red de conocimiento', 'redes de conocimiento', 'gestor', 'asesor'],
  },

  {
    id: 'lineas-tematicas',
    title: 'Líneas temáticas',
    area: 'Líneas temáticas',
    module: 'Formación',
    kind: 'procedimiento',
    route: '/formacion/lineas',
    summary:
      'Las líneas temáticas (/formacion/lineas) agrupan programas dentro de una red de conocimiento: buscador por nombre, descripción o red, con alta, edición y eliminación. Permisos: linea_tematica.ver/crear/editar/eliminar.',
    steps: [
      'Ve a Formación → Líneas temáticas (/formacion/lineas).',
      'Crea la línea asociándola a su red de conocimiento.',
      'Edita o elimina desde la fila.',
    ],
    permissions: [
      'linea_tematica.ver',
      'linea_tematica.crear',
      'linea_tematica.editar',
      'linea_tematica.eliminar',
    ],
    keywords: ['linea', 'lineas', 'linea tematica', 'lineas tematicas', 'agrupar programas'],
  },

  {
    id: 'niveles-programa',
    title: 'Niveles de programa',
    area: 'Niveles de programa',
    module: 'Formación',
    kind: 'procedimiento',
    route: '/formacion/niveles',
    summary:
      'Los niveles de formación (técnico, tecnólogo, especialización, etc.) se administran en /formacion/niveles con buscador, edición y eliminación con confirmación. Permisos: nivel_formacion.ver/crear/editar/eliminar.',
    steps: [
      'Ve a Formación → Niveles (/formacion/niveles).',
      'Crea el nivel si tu perfil lo permite.',
      'Edita o elimina desde la fila (la eliminación pide confirmación).',
    ],
    permissions: [
      'nivel_formacion.ver',
      'nivel_formacion.crear',
      'nivel_formacion.editar',
      'nivel_formacion.eliminar',
    ],
    keywords: ['nivel', 'niveles', 'nivel de programa', 'niveles de formacion', 'titulacion'],
  },

  {
    id: 'instructores',
    title: 'Instructores: asignación de programas',
    area: 'Programas de formación',
    module: 'Formación',
    kind: 'procedimiento',
    route: '/formacion/instructores',
    summary:
      'La vista /formacion/instructores (solo Administrador) permite buscar instructores por nombre, correo o programa y asignarles programas con la acción "Asignar programas", buscando el programa por código o nombre.',
    roles: ['Administrador'],
    steps: [
      'Entra a Formación → Instructores (/formacion/instructores).',
      'Busca al instructor por nombre o correo.',
      'Pulsa "Asignar programas" y busca el programa por código o nombre.',
      'Guarda la asignación.',
    ],
    keywords: ['instructor', 'instructores', 'asignar programas', 'asignacion'],
  },

  {
    id: 'listas-maestras',
    title: 'Listas maestras de materiales',
    area: 'Materiales de formación',
    module: 'Formación',
    kind: 'procedimiento',
    route: '/formacion/listas-maestras-material',
    summary:
      'Las listas maestras (/formacion/listas-maestras-material) concentran los materiales de cada programa: descarga de plantilla Excel, importación con reporte de errores, alta manual de material (UNSPSC, unidad, lote, cantidad) y edición o eliminación por fila. Permisos: lista_maestra.ver/crear/editar/eliminar.',
    steps: [
      'Ve a Formación → Lista de materiales (/formacion/listas-maestras-material).',
      'Para carga masiva: "Descargar plantilla", diligencia el Excel y "Subir Excel".',
      'Para alta manual: "Agregar material" con UNSPSC, unidad, lote y cantidades.',
      'Edita o elimina un material desde la fila.',
    ],
    permissions: [
      'lista_maestra.ver',
      'lista_maestra.crear',
      'lista_maestra.editar',
      'lista_maestra.eliminar',
    ],
    keywords: [
      'lista maestra',
      'listas maestras',
      'agregar material',
      'importar materiales',
      'plantilla materiales',
      'unspsc material',
    ],
  },

  {
    id: 'solicitud-material-formacion',
    title: 'Solicitudes de materiales de formación (instructor)',
    area: 'Solicitudes de materiales de formación',
    module: 'Formación',
    kind: 'procedimiento',
    route: '/formacion/solicitudes',
    summary:
      'El instructor arma su pedido en /formacion/solicitudes con "Nueva solicitud": selecciona material en carrito y confirma con ficha/programa/lote. El pedido queda "enviada" y pasa al coordinador. Estados del pedido: enviada → parcial → anulada; estados por ítem: pendiente → aprobado → rechazado. Permisos: solicitud_programa.ver/crear.',
    roles: ['Instructor'],
    steps: [
      'Entra a Formación → Solicitudes (/formacion/solicitudes).',
      'Pulsa "Nueva solicitud" y agrega los materiales al carrito.',
      'Confirma la solicitud indicando ficha, programa y lote.',
      'El pedido queda "enviada" a la espera de autorización del coordinador.',
    ],
    permissions: ['solicitud_programa.ver', 'solicitud_programa.crear'],
    keywords: [
      'solicitud de materiales',
      'solicitar materiales formacion',
      'pedido de materiales',
      'nueva solicitud formacion',
      'carrito',
    ],
  },

  {
    id: 'aprobaciones-compras',
    title: 'Aprobación de materiales y consolidado de compras',
    area: 'Aprobaciones y compras',
    module: 'Formación',
    kind: 'procedimiento',
    route: '/formacion/compras',
    summary:
      'Aprobación (coordinador): en /formacion/solicitudes usa "Revisar pedido" y el modal "Autorizar materiales", donde cada línea se aprueba ("Autorizar ahora"), se rechaza ("No autorizar") o se deja pendiente; también hay "Autorizar todo lo pendiente" y "Entregar lo pendiente". Compras: en /formacion/compras se elige la vigencia y se descarga el consolidado en Excel o PDF, o se genera el proceso de compra con los ítems aprobados. Permisos: solicitud_programa.editar (autorizar) y proceso_compra.ver (compras).',
    roles: ['Coordinador de formación', 'Perfil con permiso de presupuesto'],
    steps: [
      'Abre Formación → Solicitudes y entra a "Revisar pedido".',
      'Autoriza o rechaza cada línea en "Autorizar materiales" (o usa "Autorizar todo lo pendiente").',
      'Para compras: ve a Formación → Compras (/formacion/compras) y elige la vigencia.',
      'Descarga el consolidado (Excel o PDF) o genera el proceso de compra.',
    ],
    permissions: ['solicitud_programa.editar', 'proceso_compra.ver'],
    keywords: [
      'aprobar solicitud',
      'apruebo solicitud',
      'autorizar materiales',
      'rechazar solicitud',
      'aprobacion',
      'compras',
      'consolidado de compras',
      'proceso de compra',
      'generar compra',
      'descargar compras',
    ],
  },

  {
    id: 'alertas-formacion',
    title: 'Alertas de materiales de formación',
    area: 'Materiales de formación',
    module: 'Formación',
    kind: 'modulo',
    route: '/formacion/alertas',
    summary:
      'Las alertas de formación (/formacion/alertas) muestran por programa los estados "Se pasan", "Cerca del tope" y "En alerta", con buscador por área. Requiere el permiso solicitud_programa.editar. Nota: en la configuración actual de rutas esta vista redirige al inicio de Formación.',
    permissions: ['solicitud_programa.editar'],
    keywords: ['alertas formacion', 'alertas de materiales', 'se pasan', 'tope de materiales'],
  },

  /* ===================== 5. PERFILES, USUARIOS Y AVISOS ===================== */
  {
    id: 'perfiles-roles',
    title: 'Perfiles (roles) y módulos asignados',
    area: 'Perfiles y roles',
    module: 'Administración',
    kind: 'procedimiento',
    route: '/perfiles',
    summary:
      'Los perfiles definen qué módulos y permisos recibe un usuario. En /perfiles (solo Administrador) se crea un perfil con nombre y descripción y se entra a "Asignar módulos": un árbol de módulos con casillas Dentro/Asignado, botones "Nuevo módulo" y "Guardar", y por fila la acción "Permisos" para marcar códigos de permiso (ver, crear, editar, eliminar).',
    roles: ['Administrador'],
    steps: [
      'Entra a Administración → Perfiles (/perfiles).',
      'Crea el perfil con nombre y descripción.',
      'Abre "Asignar módulos" y marca los módulos del árbol (Dentro/Asignado).',
      'Por cada módulo, usa la acción "Permisos" para activar los códigos (ver/crear/editar/eliminar).',
      'Guarda los cambios.',
    ],
    keywords: [
      'perfil',
      'perfiles',
      'rol',
      'roles',
      'crear perfil',
      'asignar modulos',
      'permisos por modulo',
      'funciones',
    ],
  },

  {
    id: 'usuarios',
    title: 'Usuarios: crear y editar cuentas',
    area: 'Usuarios y permisos',
    module: 'Administración',
    kind: 'procedimiento',
    route: '/usuarios',
    summary:
      'La gestión de usuarios (/usuarios) es exclusiva del Administrador: buscador, "Nuevo usuario" (nombres, apellidos, tipo y número de documento, correo, contraseña, perfil y centro de formación; si el perfil es de instructor o coordinador se le asignan programas) y, al terminar, la opción de asignar una bodega. También permite editar la cuenta desde la fila.',
    roles: ['Administrador'],
    steps: [
      'Entra a Administración → Usuarios (/usuarios).',
      'Pulsa "Nuevo usuario" y completa datos, contraseña, perfil y centro.',
      'Si aplica, asigna programas (instructor/coordinador) y una bodega al finalizar.',
      'Edita cualquier cuenta desde la acción de la fila.',
    ],
    keywords: [
      'usuario',
      'usuarios',
      'crear usuario',
      'nuevo usuario',
      'cuenta',
      'registrar usuario',
      'asignar perfil',
      'asignar bodega',
    ],
  },

  {
    id: 'notificaciones',
    title: 'Notificaciones',
    area: 'Notificaciones',
    module: 'Cuenta',
    kind: 'modulo',
    route: '/notificaciones',
    summary:
      'Las notificaciones llegan en tiempo real (la campana del encabezado muestra el contador sin leer). En /notificaciones ves la lista con "Marcar todas como leídas" y "Cargar más", y al abrir una notificación se accede al recurso relacionado. El detalle también está en el panel de tu cuenta y en /perfil.',
    steps: [
      'Pulsa la campana en el encabezado para ver las recientes.',
      'Entra a /notificaciones para ver todas.',
      'Usa "Marcar todas como leídas" o abre una notificación para ir al recurso.',
    ],
    roles: ['Todos los perfiles autenticados'],
    keywords: [
      'notificacion',
      'notificaciones',
      'campana',
      'avisos',
      'sin leer',
      'marcar como leidas',
    ],
  },

  {
    id: 'perfil-cuenta',
    title: 'Mi perfil y contraseña',
    area: 'Usuarios y permisos',
    module: 'Cuenta',
    kind: 'modulo',
    route: '/perfil',
    summary:
      'En /perfil puedes editar tus datos personales (nombres, apellidos, documento y correo), cambiar tu contraseña con la actual y subir o quitar tu foto de perfil. También se encuentra el panel de notificaciones de tu cuenta.',
    roles: ['Todos los perfiles autenticados'],
    keywords: [
      'mi perfil',
      'cambiar contrasena',
      'actualizar datos',
      'foto de perfil',
      'cuenta propia',
      'editar perfil',
    ],
  },

  /* ===================== 6. VIGENCIAS, PRESUPUESTO, REPORTES ===================== */
  {
    id: 'vigencias',
    title: 'Vigencias presupuestales',
    area: 'Vigencias',
    module: 'Gestión',
    kind: 'procedimiento',
    route: '/vigencias',
    summary:
      'Las vigencias (/vigencias) administran los años fiscales con su fecha de apertura y cierre. La lista permite buscar por año, filtrar por estado (Activa/Inactiva), editar y eliminar. Crear una vigencia está reservado al Administrador o al rol subdirector; editar requiere vigencia.editar y consultar requiere vigencia.ver.',
    steps: [
      'Entra a Vigencias (/vigencias).',
      'Consulta o filtra por año y estado.',
      'Para crear: "Nueva vigencia" (solo Administrador o subdirector).',
      'Para modificar: "Editar vigencia" con vigencia.editar; eliminar pide confirmación.',
    ],
    permissions: ['vigencia.ver', 'vigencia.editar'],
    roles: ['Administrador', 'Subdirector', 'Perfil con vigencia.ver'],
    keywords: [
      'vigencia',
      'vigencias',
      'crear vigencia',
      'anio fiscal',
      'apertura y cierre',
      'gestionar vigencias',
    ],
  },

  {
    id: 'presupuesto',
    title: 'Presupuesto de formación',
    area: 'Presupuesto',
    module: 'Gestión',
    kind: 'procedimiento',
    route: '/presupuesto-formacion',
    summary:
      'El presupuesto (/presupuesto-formacion) tiene cuatro vistas: Resumen (accesos), Monto del centro (guardar el monto de la vigencia), Reparto (distribuir entre redes/coordinadores) y Lotes de la vigencia. Permite descargar el consolidado en Excel o PDF. Acceso con el permiso solicitud_programa.editar; el modo administrador exige presupuesto.editar.',
    steps: [
      'Entra a Presupuesto (/presupuesto-formacion).',
      'En "Monto del centro" registra el monto de la vigencia.',
      'En "Reparto" distribuye entre redes o coordinadores.',
      'Revisa los "Lotes de la vigencia" y descarga Excel o PDF cuando necesites el consolidado.',
    ],
    permissions: ['solicitud_programa.editar', 'presupuesto.editar'],
    keywords: [
      'presupuesto',
      'monto del centro',
      'reparto',
      'lotes',
      'distribuir presupuesto',
      'descargar presupuesto',
    ],
  },

  {
    id: 'reportes',
    title: 'Reportes y exportaciones',
    area: 'Reportes',
    module: 'Reportes',
    kind: 'procedimiento',
    route: '/reportes',
    summary:
      'En /reportes hay cuatro reportes: "Materiales de mi bodega" (exporta Excel o PDF eligiendo campos; requiere reporte.generar y bodegas asignadas), "Inventario completo" (enlace a Inventario → Elementos), y "Residuos del mes" y "Actividades en curso", hoy marcados como no disponibles. Además, Inventario → Elementos permite exportar el listado y las compras/presupuesto tienen descargas propias.',
    steps: [
      'Entra a Reportes (/reportes).',
      'Para materiales de tu bodega: abre "Materiales de mi bodega", elige los campos y exporta a Excel o PDF.',
      'Para el inventario completo: usa el enlace a Inventario → Elementos y exporta desde ahí.',
    ],
    permissions: ['reporte.generar'],
    keywords: [
      'reporte',
      'reportes',
      'exportar',
      'excel',
      'pdf',
      'informes',
      'descargar reporte',
      'estadisticas',
    ],
  },

  {
    id: 'actividades',
    title: 'Actividades del centro',
    area: 'Actividades y demás módulos',
    module: 'Actividades',
    kind: 'modulo',
    route: '/actividades',
    summary:
      'La vista /actividades organiza actividades con pestañas "Todos", "En curso" y "Realizados", buscador y alta con "Crear nueva actividad" (título, fecha, responsable y estado). Importante: esta vista funciona hoy con datos de demostración del frontend, no con información del backend.',
    steps: [
      'Entra a Actividades (/actividades).',
      'Filtra por pestaña o busca por título.',
      'Crea actividades con "Crear nueva actividad".',
    ],
    keywords: ['actividad', 'actividades', 'crear actividad', 'en curso', 'realizadas'],
  },

  {
    id: 'ambiental',
    title: 'Gestión ambiental',
    area: 'Actividades y demás módulos',
    module: 'Ambiental',
    kind: 'modulo',
    route: '/ambiental',
    summary:
      'La gestión ambiental (/ambiental) registra residuos y consumos con pestañas "Residuos", "Consumos", "Reportes" y "Configuración", buscador y alta con "Nuevo registro" (fecha, tipo, cantidad y estado). Importante: esta vista funciona hoy con datos de demostración del frontend, no con información del backend.',
    steps: [
      'Entra a Gestión Ambiental (/ambiental).',
      'Registra con "Nuevo registro" indicando fecha, tipo, cantidad y estado.',
      'Consulta por pestañas o con el buscador.',
    ],
    keywords: ['ambiental', 'residuos', 'consumos', 'gestion ambiental', 'huella'],
  },

  {
    id: 'vigencia-pasos-rapidos',
    title: 'Accesos rápidos frecuentes',
    area: 'Plataforma SIGMA y navegación general',
    module: 'General',
    kind: 'faq',
    summary:
      'Rutas directas de uso frecuente: /inicio (panel), /inventario (inventario), /inventario/solicitudes (solicitudes), /inventario/solicitudes/prestamos (entregas y devoluciones), /formacion (formación), /reportes (reportes), /perfil (tu cuenta) y /notificaciones (avisos). Solo verás las rutas de los módulos que tu perfil tenga asignados.',
    keywords: [
      'donde esta',
      'donde encuentro',
      'ruta',
      'acceso rapido',
      'directorio',
      'donde voy',
    ],
  },

  /* ===================== 7. PREGUNTAS FRECUENTES ===================== */
  {
    id: 'faq-proyectos',
    title: '¿Existe la creación de proyectos en SIGMA?',
    area: 'Actividades y demás módulos',
    module: 'General',
    kind: 'faq',
    summary:
      'SIGMA no tiene un módulo de creación de proyectos: no existe una ruta, botón ni permiso de "proyectos" en la plataforma, y no debo inventar un procedimiento que no está documentado. Funciones cercanas que sí existen: "Obras" en /inventario/obras (registra espacios o ubicaciones del centro) y "Actividades" en /actividades (planifica actividades con responsable y fecha). Si te referías a otra cosa, dime el nombre exacto del módulo y lo reviso.',
    keywords: [
      'proyecto',
      'proyectos',
      'crear proyecto',
      'nuevo proyecto',
      'creo un proyecto',
      'plan de proyecto',
      'iniciativa',
    ],
  },

  {
    id: 'faq-asistente',
    title: 'Cómo funciona este asistente',
    area: 'Plataforma SIGMA y navegación general',
    module: 'Asistente',
    kind: 'faq',
    summary:
      'Este asistente consulta primero el servicio del backend. Mientras ese servicio no esté conectado, responde con la base de conocimiento local de SIGMA (documentación de módulos, rutas y permisos, versión y fecha visibles en cada respuesta), siempre indicando su fuente. No inventa funcionalidades: si algo no está documentado, lo dice. Las conversaciones no modifican información de la plataforma.',
    keywords: [
      'asistente',
      'como funcionas',
      'quien eres',
      'chatbot',
      'inteligencia artificial',
      'ia',
      'bot',
      'ayuda',
    ],
  },
]

/* ============================ RECUPERACIÓN ============================ */

const STOPWORDS = new Set([
  'como', 'cual', 'cuales', 'que', 'quiero', 'puedo', 'puede', 'donde', 'dime', 'explica',
  'explicame', 'hacer', 'hago', 'estoy', 'esta', 'este', 'esto', 'estan', 'para', 'por',
  'con', 'del', 'desde', 'sobre', 'entre', 'cuando', 'tiene', 'tengo', 'ser', 'son', 'mas',
  'los', 'las', 'una', 'unos', 'unas', 'unos', 'ante', 'bajo', 'hasta', 'mediante', 'segun',
  'todo', 'todos', 'toda', 'todas', 'muy', 'sin', 'sus', 'mis', 'tu', 'mi', 'es', 'el', 'la',
  'un', 'al', 'lo', 'y', 'o', 'en', 'de', 'me', 'te', 'le', 'se', 'ya', 'hay', 'voy', 'ir',
])

export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token))
}

export type KnowledgeHit = {
  source: KnowledgeSource
  score: number
}

/**
 * Recuperación léxica ponderada: frases clave completas pesan más que
 * palabras sueltas; el umbral descarta coincidencias débiles para no
 * responder con documentación que no trata el tema preguntado.
 */
export function searchKnowledge(query: string, limit = 3): KnowledgeHit[] {
  const normalized = normalizeText(query)
  const tokens = tokenize(query)
  if (!tokens.length) return []

  const hits = KNOWLEDGE_SOURCES.map<KnowledgeHit>((source) => {
    const title = normalizeText(source.title)
    const summary = normalizeText(source.summary)
    const context = normalizeText(`${source.area} ${source.module}`)
    const keywords = source.keywords.map(normalizeText)
    const steps = (source.steps ?? []).map(normalizeText)
    const permissions = normalizeText((source.permissions ?? []).join(' '))
    const route = normalizeText(source.route ?? '')
    let score = 0

    for (const keyword of keywords) {
      if (keyword.includes(' ') && normalized.includes(keyword)) score += 6
    }

    for (const token of tokens) {
      if (keywords.some((keyword) => keyword === token)) score += 5
      else if (keywords.some((keyword) => keyword.includes(token))) score += 3
      if (title.includes(token)) score += 3
      if (context.includes(token)) score += 2
      if (summary.includes(token)) score += 1
      if (steps.some((step) => step.includes(token))) score += 1
      if (route.includes(token)) score += 1
      if (permissions.includes(token)) score += 1
    }

    return { source, score }
  })
    .filter((hit) => hit.score >= 6)
    .sort((left, right) => right.score - left.score)

  return hits.slice(0, limit)
}

function toReference(source: KnowledgeSource): ChatReference {
  const kind: ChatReferenceKind =
    source.kind === 'faq' ? 'faq' : source.kind === 'procedimiento' ? 'procedimiento' : 'modulo'
  return {
    id: source.id,
    title: source.title,
    kind,
    route: source.route,
    version: source.version ?? KNOWLEDGE_VERSION,
    updatedAt: source.updatedAt ?? KNOWLEDGE_UPDATED_AT,
  }
}

export type KnowledgeAnswer = {
  found: boolean
  text: string
  references: ChatReference[]
}

function formatAnswer(source: KnowledgeSource): string {
  const lines: string[] = [source.summary]

  if (source.steps?.length) {
    lines.push('')
    lines.push('Pasos:')
    source.steps.forEach((step, index) => lines.push(`${index + 1}. ${step}`))
  }

  if (source.permissions?.length) {
    lines.push('')
    lines.push(`Permisos necesarios: ${source.permissions.join(', ')}.`)
  }

  if (source.roles?.length) {
    lines.push(`Aplica para: ${source.roles.join(' / ')}.`)
  }

  if (source.route) {
    lines.push(`Ruta en SIGMA: ${source.route}`)
  }

  return lines.join('\n')
}

/**
 * Construye la respuesta local a partir de la documentación. Si no hay
 * coincidencia suficiente, lo declara en lugar de inventar contenido.
 */
export function answerFromKnowledge(query: string): KnowledgeAnswer {
  const hits = searchKnowledge(query, 2)
  const cleanQuery = query.trim()

  if (!hits.length) {
    return {
      found: false,
      text:
        `No encontré documentación oficial de SIGMA sobre «${cleanQuery}». ` +
        'No voy a inventar un procedimiento que no existe.\n\n' +
        'Puedo ayudarte con los módulos documentados: inventario, bodegas, stands, ítems y elementos, ' +
        'solicitudes y devoluciones, materiales de formación, programas, fichas, redes, líneas, niveles, ' +
        'aprobaciones y compras, perfiles, usuarios, notificaciones, vigencias, presupuesto, reportes y actividades. ' +
        'Prueba a reformular la pregunta con el nombre del módulo.',
      references: [],
    }
  }

  const [top, second] = hits
  const text = formatAnswer(top.source)
  const references = [toReference(top.source)]

  if (second && second.score >= top.score * 0.6) {
    references.push(toReference(second.source))
    return {
      found: true,
      text: `${text}\n\nVer también: ${second.source.title}.`,
      references,
    }
  }

  return { found: true, text, references }
}
