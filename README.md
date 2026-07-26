# Sistema de Administración de Arriendos — Edificio 23 Departamentos

Aplicación React/Vite para administrar departamentos, arrendatarios, cobros, vouchers, contratos, boletas y liquidaciones de salida.

## Funcionalidades actuales

- Dashboard con deuda, pagos, ocupación y ajustes por redondeo.
- CRUD completo para departamentos, arrendatarios, cobros, vouchers, boletas, contratos y salidas.
- Persistencia automática en `localStorage`.
- Respaldo y restauración mediante archivo JSON.
- Vouchers con folio correlativo.
- Redondeo de cobros al múltiplo de $100 más cercano.
- Registro automático de la diferencia para aplicarla en el cobro siguiente.
- Liquidación de salida con garantía, deuda, retención por luz pendiente y descuentos.
- Asistente administrativo basado en reglas y alertas.
- Interfaz de alta legibilidad pensada para administración diaria.

## Regla de redondeo

El total calculado se redondea al múltiplo de $100 más cercano. La diferencia se registra con signo contrario como `ajusteSiguiente`, para compensarla en el próximo cobro y mantener trazabilidad contable.

## Desarrollo

```bash
npm install
npm run dev
```

## Producción

```bash
npm run build
```

El repositorio incluye `netlify.toml` con publicación desde `dist` y redirección SPA.

## Limitación actual

La persistencia es local al navegador. Antes de uso multiusuario o acceso desde varios equipos se debe incorporar autenticación y una base de datos centralizada.
