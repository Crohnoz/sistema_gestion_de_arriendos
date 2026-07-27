# Entornos, autenticación y separación de datos

El proyecto utiliza un solo código fuente y dos despliegues independientes.

## 1. Demo pública

Variables de entorno:

```env
VITE_APP_MODE=demo
VITE_PRODUCT_NAME=Sistema Administrativo de Arriendos · Demo
```

Características:

- No requiere inicio de sesión.
- Se inicia con 23 departamentos y datos completamente ficticios.
- Permite crear, editar, eliminar, emitir vouchers y probar liquidaciones.
- Guarda cambios solo en el navegador del visitante.
- Incluye un botón para restaurar la demostración original.
- Nunca se conecta a la base de datos privada.

Sitio recomendado:

- `sistema-administrativo-arriendos.netlify.app`
- Futuro dominio: `demo.arriendos.crohnozlabs.cl`

## 2. Producción privada de don Cristian

Variables de entorno:

```env
VITE_APP_MODE=private
VITE_PRODUCT_NAME=Administración Edificio 23
VITE_SUPABASE_URL=https://PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=CLAVE_ANON_PUBLICA
```

Características:

- Inicio de sesión obligatorio mediante correo y contraseña.
- La aplicación no se renderiza mientras no exista una sesión válida.
- Los datos se obtienen desde `rental_workspaces`.
- Row Level Security restringe cada registro a su propietario.
- La copia de trabajo del navegador usa `sessionStorage`, no `localStorage`.
- Al cerrar sesión o cerrar la pestaña se elimina la copia local de trabajo.
- Los cambios se sincronizan automáticamente con la base central.

Sitio recomendado:

- Nombre Netlify distinto al de la demo.
- Futuro dominio: `cristian.arriendos.crohnozlabs.cl` o `app.arriendos.crohnozlabs.cl`.

## Configuración de Supabase

1. Crear un proyecto exclusivo para producción.
2. Ejecutar `supabase/migrations/001_private_workspaces.sql` en SQL Editor.
3. En Authentication, crear o invitar al usuario de don Cristian.
4. Exigir una contraseña de al menos 12 caracteres para la cuenta real.
5. Desactivar registros públicos si solo se crearán usuarios administrativamente.
6. Configurar las variables privadas en el sitio Netlify de producción.
7. No copiar datos reales al despliegue demo.

La `VITE_SUPABASE_ANON_KEY` no es una contraseña administrativa. Supabase la diseña para estar presente en clientes web. La protección depende de Authentication y de las políticas RLS incluidas en la migración. La `service_role` nunca debe agregarse a Netlify ni al repositorio.

## Creación de ambos sitios en Netlify

Ambos sitios pueden apuntar al mismo repositorio y a la misma rama estable:

| Sitio | Variable `VITE_APP_MODE` | Base de datos |
|---|---|---|
| Demo pública | `demo` | Ninguna; datos ficticios locales |
| Producción privada | `private` | Proyecto Supabase de producción |

La demo y producción deben tener nombres, dominios y variables de entorno diferentes. No utilizar deploy previews con variables privadas compartidas.

## Migración de información real existente

Si don Cristian ya ingresó datos en una versión local anterior:

1. Abrir la versión anterior en el mismo navegador.
2. Descargar el respaldo JSON.
3. Ingresar a la versión privada autenticada.
4. Usar la función Restaurar para cargar ese JSON.
5. Confirmar que el estado indique “Cambios guardados”.
6. Descargar un respaldo adicional y almacenarlo fuera del navegador.
7. Eliminar manualmente los datos del despliegue público anterior.

## Próxima evolución multiusuario

La primera versión utiliza un propietario por espacio de trabajo. Para vender el producto a administradores con equipos se deberá agregar:

- tabla de organizaciones;
- tabla de membresías y roles;
- permisos de administrador, operador y solo lectura;
- auditoría por usuario;
- normalización progresiva de departamentos, cobros, vouchers y contratos.

La separación actual permite lanzar el piloto sin bloquear esa evolución.
