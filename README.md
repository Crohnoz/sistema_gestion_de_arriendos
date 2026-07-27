# Sistema Administrativo de Arriendos

Aplicación React/Vite para administrar edificios pequeños: departamentos, arrendatarios, cobros, abonos, vouchers, contratos, boletas y liquidaciones de salida.

## Funcionalidades

- Dashboard con deuda, pagos, ocupación y ajustes por redondeo.
- CRUD completo para departamentos, arrendatarios, cobros, vouchers, boletas, contratos y salidas.
- Vouchers con folio correlativo e impresión térmica.
- Redondeo de cobros al múltiplo de $100 más cercano.
- Registro automático de la diferencia para aplicarla en el cobro siguiente.
- Liquidación de salida con garantía, deuda, retención por luz pendiente y descuentos.
- Asistente administrativo basado en reglas y alertas.
- Respaldo y restauración mediante archivo JSON.
- Interfaz de alta legibilidad pensada para administración diaria.

## Dos entornos aislados

El mismo código se despliega en dos sitios independientes:

### Demo pública

```env
VITE_APP_MODE=demo
```

- Poblada con 23 departamentos y datos completamente ficticios.
- Permite interactuar con todos los módulos.
- Los cambios quedan únicamente en el navegador del visitante.
- Incluye restauración inmediata de los datos originales de demostración.
- No tiene conexión con la base de datos privada.

### Producción privada

```env
VITE_APP_MODE=private
VITE_SUPABASE_URL=https://PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=CLAVE_ANON_PUBLICA
```

- Inicio de sesión obligatorio con Supabase Auth.
- Espacio de trabajo centralizado y sincronizado.
- Row Level Security para impedir acceso entre propietarios.
- La copia temporal del navegador usa `sessionStorage` y se elimina al cerrar la sesión o pestaña.
- Los datos reales nunca forman parte del repositorio ni de la demo.

La configuración completa está documentada en [`docs/ENTORNOS_Y_SEGURIDAD.md`](docs/ENTORNOS_Y_SEGURIDAD.md).

## Regla de redondeo

El total calculado se redondea al múltiplo de $100 más cercano. La diferencia se registra con signo contrario como `ajusteSiguiente`, para compensarla en el próximo cobro y mantener trazabilidad contable.

## Desarrollo

```bash
cp .env.example .env
npm install
npm run dev
```

## Producción

```bash
npm run build
```

El repositorio incluye `netlify.toml` con publicación desde `dist` y redirección SPA.

## Base de datos privada

Ejecutar la migración [`supabase/migrations/001_private_workspaces.sql`](supabase/migrations/001_private_workspaces.sql) en el proyecto Supabase de producción antes de activar el modo privado.
