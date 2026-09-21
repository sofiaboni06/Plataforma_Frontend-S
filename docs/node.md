# Node.js del equipo

Front y back usan **la misma versión**. Si cada quien instala Node “el de ahora”, el `package-lock.json` cambia y salen conflictos al clonar.

| | Versión |
| --- | --- |
| **Node.js** | **24.21.0** (LTS *Krypton*, línea 24.x) |
| **npm** | **11.19.0** (el que trae ese Node) |

## Por qué esta y no otra

- **No Node 26 (Current).** Es la de moda. Cambia APIs y el lockfile a cada rato.
- **No Node 22 ni 20.** El backend es **AdonisJS 7** y declara `node >= 24.0.0` (loader de TypeScript y APIs nativas de 24). Con 22 el API ni arranca.
- **Sí Node 24 LTS.** Es la línea estable de producción. No es Current, tiene parches de seguridad y la aceptan Vite 8 (front) y Adonis 7 (back).

La línea 24.x sigue en soporte hasta **abril 2028**. No suban de major (25/26) sin acuerdo del grupo.

## Al clonar

Con nvm (Windows o Unix):

```bash
nvm install 24.21.0
nvm use
node -v   # v24.21.0
npm -v    # 11.19.0
npm ci
```

`nvm use` lee `.nvmrc`. Si npm se queja de `engine-strict`, estás en otra versión de Node: cámbiala antes de instalar.
