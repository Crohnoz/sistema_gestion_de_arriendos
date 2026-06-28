# Sistema de Administración de Arriendos — Edificio 23 Departamentos

Proyecto React/Vite para uso interno de un edificio de 3 pisos y 23 departamentos.

## Módulos incluidos

- Dashboard general
- Departamentos precargados: 23 unidades, 3 pisos
- Arrendatarios
- Cobros y deudas
- Voucher con folio correlativo
- Boletas y vencimientos
- Contratos
- Asistente IA local basado en reglas
- Respaldo JSON descargable
- Búsqueda, creación, edición y eliminación desde la web
- Sin login ni credenciales

## Enfoque de UX

- Botones grandes
- Texto legible
- Flujo simple
- Uso interno
- Pensado para administrador adulto de 50–60+ años

## Ejecutar

```bash
npm install
npm run dev
```

## Importante

La “IA” incluida en esta versión es un asistente local basado en reglas:
- detecta deudas
- detecta boletas próximas a vencer
- detecta consumos faltantes
- detecta departamentos disponibles

Siguiente paso técnico recomendado:
1. Persistencia local con IndexedDB o SQLite/Django.
2. Generación de voucher PDF.
3. Calendario real de recordatorios.
4. Integración opcional con API de IA cuando haya backend.
