# Frontend ↔ API

Node **24.21.0** (LTS) en front y back. Si clonas con otra versión, el lockfile choca: [`docs/node.md`](node.md).

El proxy de Vite manda `/api` a `http://localhost:3333`.

1. En `Plataformaback`: `npm run dev` (puerto 3333).
2. En este repo: `npm run dev`.
3. **Iniciar sesión** en `/login`.
   - Correo: `carlos@correo.com` (o documento `1001001001`)
   - Contraseña: `123456`

Vista de perfil: `/perfil` (requiere token). Editar guarda con `PATCH /api/v1/account/profile`. Cambiar contraseña usa `PATCH /api/v1/account/password`.

Cómo armar otros endpoints (paso a paso para quien no ha hecho backend): `Plataformaback/docs/guia-para-el-equipo.md`.

Vistas ya montadas en el frontend (tras login van a `/inicio`):

- `/inicio` inicio autenticado (tarjetas = módulos del perfil)
- `/inventario` `/materiales` `/ambiental` `/actividades` `/reportes` (solo si el perfil los tiene)
- `/perfil` conectado al API
- `/usuarios` (solo Administrador): crear/editar cuentas y asignar perfil
- `/perfiles` (solo Administrador): crear roles y asignar módulos padre/hijo/nieto

Cadena de permisos: usuario → perfil (`id_perfil`) → `modulo_perfil` → módulos. El menú sale de `GET /api/v1/modules` (ya filtrado). El admin no asigna módulos uno a uno al usuario.

API de usuarios (Bearer + perfil Administrador):

- `GET /api/v1/users/options` perfiles activos y centros
- `GET /api/v1/users` listado
- `POST /api/v1/users` alta (`nombres`, `apellidos`, `tipoDocumento`, `numeroDocumento`, `email`, `password`, `passwordConfirmation`, `idPerfil`, `idCformacion`)
- `GET /api/v1/users/:id`
- `PATCH /api/v1/users/:id` (perfil, datos, estado; contraseña opcional)

