# Contrato API del Asistente SIGMA (ChatBox)

**Estado: PENDIENTE DE IMPLEMENTAR EN EL BACKEND.**
El frontend ya está listo y tipado (`src/modules/chatbox/`). Este documento es
el contrato que debe cumplir el backend para que el asistente deje de operar
en modo documentación local.

Referencia cruzada: [`docs/api.md`](api.md) (convenciones generales del API).

---

## 1. Endpoint

```
POST /api/v1/chat/messages
```

- **Autenticación:** igual que el resto del API → `Authorization: Bearer <token>`
  (token emitido por `POST /api/v1/auth/login`, ver `docs/api.md`).
- **Content-Type:** `application/json`
- **Accept:** `application/json`
- **Sin claves de IA en el frontend.** El proveedor de modelos, el prompt y el
  vector store viven **solo** en el backend.

### Cuerpo de la petición

```jsonc
{
  "conversationId": "0f1c…-uuid-generado-en-el-cliente",
  "message": "¿Cómo solicito un equipo?",
  "attachments": [                       // opcional
    { "name": "soporte.pdf", "size": 183204, "type": "application/pdf" }
  ],
  "context": {                            // opcional
    "source": "chatbox"
  }
}
```

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `conversationId` | string (uuid) | sí | Lo genera el cliente; el backend lo valida/crea. |
| `message` | string | sí | 1–1000 caracteres. Se valida también en el cliente. |
| `attachments` | array | no | Solo metadatos (nombre/tamaño/tipo). El binario se sube por un endpoint de archivos dedicado, no por este. |
| `context` | object | no | Información de origen; **no** se usa para autorizar nada. |

### Respuesta exitosa (200)

```jsonc
{
  "conversationId": "0f1c…",
  "messageId": "msg_01H…",
  "reply": "Para solicitar un equipo entra a Inventario → Solicitudes…",
  "references": [
    {
      "id": "solicitudes-equipo",
      "title": "Solicitudes de equipo devolutivo: crear y entregar",
      "kind": "procedimiento",           // modulo | procedimiento | permiso | faq
      "route": "/inventario/solicitudes",
      "source": "Inventario",
      "version": "1.0.0",
      "updatedAt": "2026-11-06"
    }
  ],
  "status": "ok",                        // ok | no_knowledge
  "createdAt": "2026-11-06T15:04:05.000Z"
}
```

- `references`: fuentes utilizadas para armar la respuesta (RAG). Si no hay
  ninguna, `status` debe ser `"no_knowledge"` y el `reply` debe **declarar la
  falta de información** en lugar de inventar un procedimiento.
- El frontend desempaqueta el envoltorio `{ data: … }` si el API lo usa.

## 2. Manejo de errores

| Código | Uso | Qué hace el frontend |
|---|---|---|
| `400` / `422` | Validación (mensaje vacío, >1000 chars, conversationId inválido) | Muestra el mensaje de error y conserva el texto escrito. |
| `401` / `403` | Sesión inválida o sin permiso | Aviso "Tu sesión ya no es válida. Vuelve a iniciar sesión". |
| `429` | Límite de uso por usuario | (Backend a definir) el frontend mostrará el mensaje devuelto. |
| `5xx` | Falla del servidor | El frontend cae al modo documentación local. |
| `404` / red caída | **Endpoint aún no existe** (situación actual) | Modo documentación local + aviso único. |

Cuerpo de error (misma forma que el resto del API):

```jsonc
{ "message": "El mensaje es obligatorio." }
```

## 3. Requisitos del backend (RAG y seguridad)

1. **Búsqueda con citas.** La respuesta se arma con recuperación sobre la
   documentación del producto y cada respuesta debe devolver `references` con
   `version` y `updatedAt` de la fuente citada.
2. **Sin alucinación.** Si la recuperación no encuentra material suficiente →
   `status: "no_knowledge"` y respuesta que declare la falta de información.
3. **Control de acceso por usuario.** El `conversationId` debe quedar asociado
   al `id` del usuario autenticado: un usuario **nunca** puede leer ni escribir
   en la conversación de otro. Consultar el historial exige el mismo token.
4. **Aislamiento de contexto.** El modelo no debe recibir datos de otros
   usuarios, ni contraseñas, ni documentos de terceros, ni el historial de
   conversaciones ajenas.
5. **Salida no confiable.** El `reply` es texto del modelo: el backend debe
   escaparlo/limitarlo (sin HTML crudo, sin acciones ejecutables) y el frontend
   lo pinta como texto plano, nunca como `dangerouslySetInnerHTML`.
6. **Sin acciones.** El asistente no ejecuta escrituras (no crea, aprueba ni
   borra registros). Si en el futuro se habilita, será un flujo explícito con
   confirmación y permisos propios.
7. **Trazabilidad.** Registrar fecha, usuario, mensaje y fuentes usadas
   (auditoría), sin guardar contraseñas ni archivos completos.
8. **Límites.** Rate limit por usuario/IP y límite de tamaño de mensaje.

## 4. Historial (fase 2, opcional)

```
GET  /api/v1/chat/conversations              → lista (solo la del usuario)
GET  /api/v1/chat/conversations/:id          → mensajes con paginación
DELETE /api/v1/chat/conversations/:id        → archivar (solo la del usuario)
```

Hoy la conversación vive en memoria del navegador (`useChat`), se conserva al
navegar entre rutas y se reinicia al cerrar la ventana. Con este endpoint se
pasaría a persistir en servidor sin cambiar la interfaz: solo habría que
sustituir el store local por `GET /conversations/:id`.

## 5. Qué hace el frontend hoy (sin backend)

1. `chatService.sendMessage()` intenta `POST /api/v1/chat/messages` con el Bearer
   token.
2. Si el endpoint no existe o el backend no responde, responde con la base de
   conocimiento local (`knowledge/knowledgeSources.ts`, 37 fuentes cubriendo las
   23 áreas requeridas) etiquetando el mensaje como `origin: "local"` y
   mostrando **una sola vez** el aviso "La IA conectada de SIGMA aún no está
   disponible en este entorno".
3. La cabecera refleja el estado real: `Verificando conexión…` → `Conectado`
   (solo tras una respuesta real del backend) o `IA no conectada · modo
   documentación`. **Nunca** afirma estar conectada sin comprobarlo.
4. Ante `401/403/400/422` muestra el error en la conversación con botón
   *Reintentar*, sin simular respuestas.

## 6. Checklist de implementación pendiente

- [ ] `POST /api/v1/chat/messages` con Bearer y validación de `message` (1–1000).
- [ ] Asociar `conversationId` al usuario autenticado y bloquear cruces.
- [ ] Pipeline RAG: chunking + embeddings + búsqueda + citas con versión/fecha.
- [ ] Respuesta honesta `status: "no_knowledge"` cuando no haya material.
- [ ] Rate limit y auditoría.
- [ ] (Fase 2) Endpoints de historial listados en la sección 4.
- [ ] Actualizar `KNOWLEDGE_VERSION` / `KNOWLEDGE_UPDATED_AT` en
      `src/modules/chatbox/knowledge/knowledgeSources.ts` con cada cambio de
      documentación.
