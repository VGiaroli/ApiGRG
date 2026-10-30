# ApiGRG Admin 2.0 — Diseño aprobado

## Objetivo

Actualizar la administración de GRG con navegación consistente, dashboard real, inventario por producto, acciones rápidas y vista previa reutilizable, preservando el catálogo público y las entidades existentes.

## Alcance

### Incluye

- Sidebar administrativo con Bootstrap Icons, carga de recursos desde los `head`, selección activa por ruta, modo compacto persistido y comportamiento móvil.
- Dashboard en `/views/Admin/dashboard.html` con indicadores reales, últimos productos, accesos rápidos y estados de carga, vacío y error.
- Inventario por producto con SKU, stock actual nullable, stock mínimo, estados derivados, búsqueda, filtros, movimientos y consulta de historial.
- Endpoints para resumen, listado administrativo, precios, disponibilidad y movimientos.
- Acciones rápidas desde productos: precio, stock, disponibilidad y vista previa.
- Vista previa de producto en formularios de alta/edición y tabla, reutilizando la presentación del catálogo.
- Migración EF Core para campos de inventario, movimientos y control de concurrencia.

### No incluye

- Ventas, ingresos, ganancias, reservas, múltiples almacenes o descuento automático por ventas.
- Reimplementación de categorías o cambios sustanciales en solicitudes de servicio.
- Cambios al flujo de compra/WhatsApp del catálogo público.
- Migración de base de datos, tests, builds, linters o validaciones manuales.

## Decisiones de arquitectura

### API y seguridad

- `ProductosController` conservará `GET /api/productos` como contrato público y no expondrá SKU, stock ni movimientos.
- La propiedad pública `Disponible` representará disponibilidad efectiva: si existe stock, será `Disponible && StockActual > 0`; si el stock es `null`, respetará `Disponible`.
- Los endpoints administrativos devolverán el valor almacenado de `Disponible` como `HabilitadoVenta` y la disponibilidad calculada como `DisponibilidadEfectiva`, además del inventario.
- Por decisión explícita del usuario, esta iteración no agregará `[Authorize]`; la API continuará libre. El frontend conservará la sesión existente y podrá enviar JWT mediante `authFetch` para facilitar la futura activación de autorización.
- El dashboard contará solicitudes activas mediante `!Eliminado`, sin depender del estado de confirmación.

### Inventario y concurrencia

- `Producto` incorporará `SKU` nullable, `StockActual` nullable, `StockMinimo` con valor por defecto `1` y un token `RowVersion` para detectar escrituras concurrentes.
- `MovimientoStock` tendrá producto, tipo (`Inicial`, `Ingreso`, `Egreso`, `Ajuste`), cantidades anterior/nueva, diferencia, motivo, fecha UTC y usuario responsable nullable.
- El cambio de stock validará que la cantidad final no sea negativa, actualizará el producto y creará el movimiento dentro de una transacción.
- Un conflicto de `RowVersion` devolverá `409 Conflict` y no sobrescribirá el cambio de otro administrador.
- `StockActual = null` se conservará como “sin registrar” y no modificará automáticamente `Disponible`.

### Frontend compartido

- Se agregará un módulo de presentación compartido para fallback de imagen, colores, financiación, precios, estado y disponibilidad de la card.
- `catalogo.js` lo usará sin cambiar sus filtros ni WhatsApp; `productos.js` lo usará para la vista previa sin guardar.
- El sidebar se inicializará mediante una función idempotente expuesta por `sidebar.js`; `layout.js` insertará el fragmento y llamará esa función una sola vez.
- Se mantendrá el lenguaje visual existente: Bootstrap 5, Bootstrap Icons, paleta violeta/coral, densidad de dashboard de datos, foco visible y responsive mobile-first.

## Contratos principales

### `GET /api/admin/resumen`

Devuelve `totalProductos`, `productosDisponibles`, `productosAgotados`, `productosStockBajo`, `productosSinStockRegistrado`, `solicitudesActivas` y una colección de productos recientes con datos públicos y de inventario mínimos.

### `GET /api/productos/admin`

Devuelve el listado enriquecido para administración: identificador, SKU, nombre, categoría, precios, estado, `habilitadoVenta`, `disponibilidadEfectiva`, stock actual, stock mínimo, estado del stock, imagen, colores y cuotas.

### Operaciones parciales

- `PATCH /api/productos/{id}/precios`: actualiza únicamente `PrecioARS` y `PrecioUSD`.
- `PATCH /api/productos/{id}/disponibilidad`: actualiza únicamente `Disponible`.
- `POST /api/productos/{id}/movimientos-stock`: crea un movimiento y actualiza stock atómicamente.
- `GET /api/productos/{id}/movimientos-stock`: devuelve movimientos recientes ordenados por fecha descendente.

## Estados y errores de interfaz

- Dashboard e inventario tendrán carga, error con reintento y vacío con acción útil.
- Formularios y acciones rápidas deshabilitarán el botón durante la petición y mostrarán confirmación o error contextual.
- El modal de vista previa indicará discretamente “Cambios sin guardar” cuando lea datos del formulario.
- La disponibilidad efectiva mostrará una aclaración cuando el producto esté habilitado pero agotado.

## Migración y compatibilidad

- Se creará una migración nueva sin editar migraciones históricas.
- Las columnas nuevas no eliminarán ni sobrescribirán datos existentes; `StockMinimo` tendrá default `1` y el stock existente quedará `null`.
- El snapshot de EF Core reflejará `MovimientoStock`, sus relaciones y `RowVersion`.
- El catálogo seguirá consumiendo los nombres actuales de `ProductoListadoDto`, especialmente `productoID`, `disponible`, `colores` y `cuotas`.

## Estrategia de pruebas

El usuario indicó expresamente no crear ni ejecutar tests, builds, linters, validaciones manuales ni migraciones. La implementación se limitará a cambios de código, archivos de migración y documentación de las decisiones; no se declarará validación de funcionamiento.

## Revisión adversarial

- Contrato público ambiguo entre habilitación y disponibilidad: se resuelve manteniendo `disponible` como efectivo en el endpoint público y separando ambos valores en el endpoint administrativo.
- Actualizaciones concurrentes de stock: se resuelve con `RowVersion`, transacción y respuesta `409` ante conflicto.
- Carga dinámica duplicada del sidebar: se resuelve con recursos en cada `head`, script compartido único y guard idempotente de inicialización.

## Pendientes explícitos

- Activar `[Authorize]` y políticas de roles en una iteración posterior.
- Ejecutar la migración contra la base de datos cuando el equipo autorice cambios de esquema.
