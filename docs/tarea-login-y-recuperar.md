# Tarea tuya: login y recuperar contraseña

Backend **y** frontend. Las vistas se **borraron a propósito**: las tienes que crear tú.

La receta completa (migración, servicio, rutas, pruebas) está en el repo del API:

`Plataformaback/docs/tarea-login-y-recuperar.md`

## Qué debes crear (frontend)

1. `src/pages/LoginPage.tsx` — ruta `/login`
2. `src/pages/RecoverPasswordPage.tsx` — ruta `/recuperar`
3. `src/lib/recovery.ts` — las 3 llamadas al API
4. En `src/App.tsx` quita `AuthPending` y monta esas páginas en `/login` y `/recuperar`

## Login

El API **ya entra**: `POST /api/v1/auth/login`. No lo reescribas. Usa `login()` de `src/lib/auth.tsx`.

La pantalla no existe. Ármala con el mismo lenguaje visual que el resto (Figma + `Dashboard` / `Header`):

- Fondo ` /img/imageninicio.jpg `
- Logo `SenaMark`
- Usuario o documento + contraseña
- Checkbox **Recordar sesión**: si está marcado, token en `localStorage`; si no, `sessionStorage` (`src/lib/api.ts`, hoy siempre usa `localStorage`)
- Enlace **¿Olvidaste tu contraseña?** a `/recuperar`
- Mensajes claros si el API responde 401 / 403 / 422

Cuentas: `carlos@correo.com` / `juan@correo.com` / `maria@correo.com`, clave `123456`.

## Recuperar

Flujo de **3 pasos**, mismo estilo que el login:

1. `POST /auth/recover` — correo
2. `POST /auth/recover/verify` — código de 6
3. `POST /auth/recover/reset` — clave nueva
4. Volver a `/login`

`api()` ya antepone `/api/v1`.
