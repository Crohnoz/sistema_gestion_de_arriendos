const today = new Date();
const isoDate = (date) => date.toISOString().slice(0, 10);
const period = isoDate(today).slice(0, 7);

function shiftedDate(months, day = 1) {
  const date = new Date(today.getFullYear(), today.getMonth() + months, day);
  return isoDate(date);
}

function departmentNumber(index) {
  const position = index + 1;
  const floor = position <= 8 ? 1 : position <= 16 ? 2 : 3;
  return `${floor}${String(position).padStart(2, "0")}`;
}

const tenantNames = [
  "Camila Ejemplo",
  "Tomás Demostración",
  "Valentina Muestra",
  "Benjamín Prueba",
  "Martina Referencia",
  "Vicente Modelo",
  "Florencia Ficticia",
  "Joaquín Simulado",
  "Isidora Portafolio",
  "Agustín Ejemplo",
  "Emilia Demostración",
  "Matías Muestra",
  "Josefa Prueba",
  "Lucas Referencia",
  "Antonia Modelo",
  "Santiago Ficticio",
  "Trinidad Simulada",
  "Diego Portafolio",
];

const arrendatarios = tenantNames.map((nombre, index) => ({
  id: 1000 + index,
  nombre,
  rut: `DEMO-${String(index + 1).padStart(3, "0")}`,
  telefono: `+56 9 0000 ${String(index + 1).padStart(4, "0")}`,
  email: `arrendatario${index + 1}@example.com`,
  departamento: departmentNumber(index),
  contactoEmergencia: `Contacto ficticio ${index + 1} · +56 9 1111 ${String(index + 1).padStart(4, "0")}`,
}));

const departamentos = Array.from({ length: 23 }, (_, index) => {
  const tenant = arrendatarios[index];
  const position = index + 1;
  const floor = position <= 8 ? 1 : position <= 16 ? 2 : 3;

  return {
    id: position,
    numero: departmentNumber(index),
    piso: floor,
    estado: tenant ? "Arrendado" : "Disponible",
    canon: tenant ? 260000 + (index % 5) * 15000 : 0,
    arrendatario: tenant?.nombre || "",
    telefono: tenant?.telefono || "",
    diaPago: 5 + (index % 3),
    observacion: tenant
      ? "Registro ficticio creado exclusivamente para la demostración."
      : "Unidad ficticia disponible para probar una nueva asignación.",
  };
});

function chargeFor(tenant, index) {
  const arriendo = departamentos[index].canon;
  const luz = 12840 + (index % 6) * 2370;
  const agua = 8500 + (index % 4) * 950;
  const gastosComunes = 24000 + (index % 3) * 3000;
  const ajusteAnterior = [-37, 24, -11, 42][index % 4];
  const totalCalculado = arriendo + luz + agua + gastosComunes + ajusteAnterior;
  const totalCobrado = Math.round(totalCalculado / 100) * 100;
  const ajusteSiguiente = totalCalculado - totalCobrado;
  const abonado = index % 7 === 0 ? 0 : index % 5 === 0 ? totalCobrado - 65000 : totalCobrado;

  return {
    id: 2000 + index,
    periodo: period,
    departamento: tenant.departamento,
    arrendatario: tenant.nombre,
    arriendo,
    luz,
    agua,
    gastosComunes,
    ajusteAnterior,
    totalCalculado,
    totalCobrado,
    ajusteSiguiente,
    abonado,
    fechaVencimiento: `${period}-0${5 + (index % 3)}`,
    estado: abonado >= totalCobrado ? "Pagado" : "Pendiente",
    nota: "Cobro ficticio para explorar pagos, saldos y redondeos.",
  };
}

const cobros = arrendatarios.map(chargeFor);

const vouchers = cobros
  .filter((charge) => charge.abonado > 0)
  .slice(0, 12)
  .map((charge, index) => ({
    id: 3000 + index,
    folio: `V-${String(index + 1).padStart(6, "0")}`,
    fecha: shiftedDate(0, 6 + (index % 10)),
    departamento: charge.departamento,
    arrendatario: charge.arrendatario,
    concepto: `Abono arriendo y servicios ${period}`,
    monto: charge.abonado,
    medio: index % 3 === 0 ? "Efectivo" : "Transferencia",
    recibidoPor: "Administrador Demo",
  }));

const contratos = arrendatarios.map((tenant, index) => ({
  id: 4000 + index,
  departamento: tenant.departamento,
  arrendatario: tenant.nombre,
  inicio: shiftedDate(-8 + (index % 5), 1),
  termino: shiftedDate(4 + (index % 9), 1),
  garantia: departamentos[index].canon,
  estado: "Vigente",
}));

export const demoSeed = {
  configuracion: {
    nombre: "Edificio Mirador Demo",
    redondearCentenas: true,
    administrador: "Administrador Demo",
  },
  departamentos,
  arrendatarios,
  cobros,
  vouchers,
  boletas: [
    {
      id: 5001,
      servicio: "Electricidad",
      proveedor: "Proveedor Eléctrico Demo",
      periodo,
      vencimiento: shiftedDate(0, 24),
      monto: 486320,
      estado: "Pendiente",
    },
    {
      id: 5002,
      servicio: "Agua",
      proveedor: "Empresa Sanitaria Demo",
      periodo,
      vencimiento: shiftedDate(0, 21),
      monto: 214800,
      estado: "Pagada",
    },
    {
      id: 5003,
      servicio: "Internet áreas comunes",
      proveedor: "Conectividad Demo",
      periodo,
      vencimiento: shiftedDate(0, 18),
      monto: 32990,
      estado: "Pagada",
    },
  ],
  contratos,
  salidas: [
    {
      id: 6001,
      departamento: arrendatarios[17].departamento,
      arrendatario: arrendatarios[17].nombre,
      fechaAviso: shiftedDate(0, 12),
      fechaEntrega: shiftedDate(1, 12),
      garantia: departamentos[17].canon,
      deudaActual: 0,
      retencionLuz: 35000,
      otrosDescuentos: 12000,
      montoDevolver: departamentos[17].canon - 47000,
      estado: "En preparación",
      observacion: "Liquidación ficticia con retención por consumo eléctrico pendiente.",
    },
  ],
};

export function createEmptyWorkspace() {
  return {
    configuracion: {
      nombre: "Edificio 23",
      redondearCentenas: true,
      administrador: "Don Cristian",
    },
    departamentos: Array.from({ length: 23 }, (_, index) => {
      const position = index + 1;
      const floor = position <= 8 ? 1 : position <= 16 ? 2 : 3;
      return {
        id: position,
        numero: departmentNumber(index),
        piso: floor,
        estado: "Disponible",
        canon: 0,
        arrendatario: "",
        telefono: "",
        diaPago: 5,
        observacion: "",
      };
    }),
    arrendatarios: [],
    cobros: [],
    vouchers: [],
    boletas: [],
    contratos: [],
    salidas: [],
  };
}
