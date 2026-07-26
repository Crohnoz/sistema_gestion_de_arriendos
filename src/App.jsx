import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeDollarSign,
  BrainCircuit,
  Building2,
  CalendarClock,
  Download,
  FileText,
  Home,
  LogOut,
  Menu,
  Pencil,
  Plus,
  Printer,
  ReceiptText,
  Save,
  Search,
  Trash2,
  Users,
  WalletCards,
  X,
} from "lucide-react";

const STORAGE_KEY = "sistema-arriendos-v3-clean";
const CLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const money = (value) => CLP.format(Number(value || 0));
const todayISO = () => new Date().toISOString().slice(0, 10);
const currentPeriod = () => todayISO().slice(0, 7);

function roundHundred(value) {
  const original = Number(value || 0);
  const rounded = Math.round(original / 100) * 100;
  return { original, rounded, adjustment: rounded - original };
}

const departments = Array.from({ length: 23 }, (_, index) => {
  const position = index + 1;
  const floor = position <= 8 ? 1 : position <= 16 ? 2 : 3;

  return {
    id: position,
    numero: `${floor}${String(position).padStart(2, "0")}`,
    piso: floor,
    estado: "Disponible",
    canon: 0,
    arrendatario: "",
    telefono: "",
    diaPago: 5,
    observacion: "",
  };
});

const seed = {
  configuracion: {
    nombre: "Edificio 23",
    redondearCentenas: true,
    administrador: "Administrador",
  },
  departamentos: departments,
  arrendatarios: [],
  cobros: [],
  vouchers: [],
  boletas: [],
  contratos: [],
  salidas: [],
};

const sections = {
  inicio: { label: "Inicio", icon: Home },
  departamentos: { label: "Departamentos", icon: Building2 },
  arrendatarios: { label: "Arrendatarios", icon: Users },
  cobros: { label: "Cobros y deudas", icon: WalletCards },
  vouchers: { label: "Vouchers", icon: ReceiptText },
  boletas: { label: "Boletas y vencimientos", icon: CalendarClock },
  contratos: { label: "Contratos", icon: FileText },
  salidas: { label: "Liquidaciones de salida", icon: LogOut },
  asistente: { label: "Asistente administrativo", icon: BrainCircuit },
};

const fields = {
  departamentos: [
    "numero",
    "piso",
    "estado",
    "canon",
    "arrendatario",
    "telefono",
    "diaPago",
    "observacion",
  ],
  arrendatarios: [
    "nombre",
    "rut",
    "telefono",
    "email",
    "departamento",
    "contactoEmergencia",
  ],
  cobros: [
    "periodo",
    "departamento",
    "arrendatario",
    "arriendo",
    "luz",
    "agua",
    "gastosComunes",
    "ajusteAnterior",
    "totalCalculado",
    "totalCobrado",
    "ajusteSiguiente",
    "abonado",
    "fechaVencimiento",
    "estado",
    "nota",
  ],
  vouchers: [
    "folio",
    "fecha",
    "departamento",
    "arrendatario",
    "concepto",
    "monto",
    "medio",
    "recibidoPor",
  ],
  boletas: ["servicio", "proveedor", "periodo", "vencimiento", "monto", "estado"],
  contratos: ["departamento", "arrendatario", "inicio", "termino", "garantia", "estado"],
  salidas: [
    "departamento",
    "arrendatario",
    "fechaAviso",
    "fechaEntrega",
    "garantia",
    "deudaActual",
    "retencionLuz",
    "otrosDescuentos",
    "montoDevolver",
    "estado",
    "observacion",
  ],
};

const moneyFields = [
  "canon",
  "arriendo",
  "luz",
  "agua",
  "gastosComunes",
  "ajusteAnterior",
  "totalCalculado",
  "totalCobrado",
  "ajusteSiguiente",
  "abonado",
  "monto",
  "garantia",
  "deudaActual",
  "retencionLuz",
  "otrosDescuentos",
  "montoDevolver",
];

const dateFields = [
  "fecha",
  "fechaVencimiento",
  "vencimiento",
  "inicio",
  "termino",
  "fechaAviso",
  "fechaEntrega",
];

const labels = {
  numero: "N° depto",
  diaPago: "Día de pago",
  gastosComunes: "Gastos comunes",
  contactoEmergencia: "Contacto de emergencia",
  fechaVencimiento: "Vencimiento",
  recibidoPor: "Recibido por",
  ajusteAnterior: "Ajuste anterior",
  totalCalculado: "Total calculado",
  totalCobrado: "Total redondeado",
  ajusteSiguiente: "Ajuste próximo cobro",
  fechaAviso: "Fecha de aviso",
  fechaEntrega: "Fecha de entrega",
  deudaActual: "Deuda actual",
  retencionLuz: "Retención por luz pendiente",
  otrosDescuentos: "Otros descuentos",
  montoDevolver: "Monto a devolver",
};

const label = (key) =>
  labels[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());

const displayValue = (key, value) => {
  if (moneyFields.includes(key)) return money(value);
  return value || "—";
};

function calcCharge(charge) {
  return (
    Number(charge.arriendo || 0) +
    Number(charge.luz || 0) +
    Number(charge.agua || 0) +
    Number(charge.gastosComunes || 0) +
    Number(charge.ajusteAnterior || 0)
  );
}

function calcDebt(charge) {
  return Number(charge.totalCobrado || calcCharge(charge)) - Number(charge.abonado || 0);
}

function normalizeCharge(charge) {
  const total = calcCharge(charge);
  const rounded = roundHundred(total);
  const balance = rounded.rounded - Number(charge.abonado || 0);

  return {
    ...charge,
    totalCalculado: total,
    totalCobrado: rounded.rounded,
    ajusteSiguiente: -rounded.adjustment,
    estado: balance <= 0 ? "Pagado" : "Pendiente",
  };
}

function nextVoucherFolio(vouchers) {
  const highest = vouchers.reduce((maximum, voucher) => {
    const number = Number(String(voucher.folio || "").replace(/\D/g, ""));
    return Number.isFinite(number) ? Math.max(maximum, number) : maximum;
  }, 0);

  return `V-${String(highest + 1).padStart(6, "0")}`;
}

function emptyRecord(section, data) {
  const record = {};
  fields[section].forEach((field) => {
    record[field] = "";
  });

  if (section === "vouchers") {
    Object.assign(record, {
      folio: nextVoucherFolio(data.vouchers),
      fecha: todayISO(),
      medio: "Transferencia",
      recibidoPor: data.configuracion.administrador,
    });
  }

  if (section === "cobros") {
    Object.assign(record, {
      periodo: currentPeriod(),
      fechaVencimiento: `${currentPeriod()}-05`,
      estado: "Pendiente",
      ajusteAnterior: 0,
    });
  }

  if (section === "boletas") {
    Object.assign(record, { vencimiento: todayISO(), estado: "Pendiente" });
  }

  if (section === "salidas") {
    Object.assign(record, {
      fechaAviso: todayISO(),
      fechaEntrega: todayISO(),
      estado: "En preparación",
      retencionLuz: 0,
      otrosDescuentos: 0,
    });
  }

  return record;
}

function buildInsights(data) {
  const debt = data.cobros.filter((charge) => calcDebt(charge) > 0);
  const missingElectricity = data.cobros.filter((charge) => !Number(charge.luz));
  const expiringContracts = data.contratos.filter(
    (contract) =>
      contract.estado === "Vigente" &&
      new Date(contract.termino) - new Date() < 2592e6,
  );
  const insights = [];

  if (!data.arrendatarios.length && !data.contratos.length) {
    insights.push({
      priority: "Media",
      type: "Puesta en marcha",
      text: "Comience editando cada departamento con su canon, estado y arrendatario real.",
      target: "departamentos",
    });
  }

  if (debt.length) {
    insights.push({
      priority: "Alta",
      type: "Cobros pendientes",
      text: `${debt.length} departamento(s) mantienen deuda por ${money(
        debt.reduce((total, charge) => total + calcDebt(charge), 0),
      )}.`,
      target: "cobros",
    });
  }

  if (data.cobros.length && missingElectricity.length) {
    insights.push({
      priority: "Media",
      type: "Consumos faltantes",
      text: `${missingElectricity.length} cobro(s) tienen luz en cero. Verifique si falta ingresar la boleta del mes anterior.`,
      target: "cobros",
    });
  }

  if (expiringContracts.length) {
    insights.push({
      priority: "Media",
      type: "Contratos próximos a vencer",
      text: `${expiringContracts.length} contrato(s) vencen dentro de 30 días.`,
      target: "contratos",
    });
  }

  if (data.salidas.some((exit) => exit.estado !== "Cerrada")) {
    insights.push({
      priority: "Alta",
      type: "Salidas abiertas",
      text: "Hay liquidaciones de salida pendientes. Mantenga retenida la estimación de luz hasta recibir la boleta definitiva.",
      target: "salidas",
    });
  }

  return insights.length
    ? insights
    : [
        {
          priority: "Baja",
          type: "Todo en orden",
          text: "No hay alertas críticas en los datos registrados.",
          target: "inicio",
        },
      ];
}

export default function App() {
  const [data, setData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seed;
    } catch {
      return seed;
    }
  });
  const [active, setActive] = useState("inicio");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [sidebar, setSidebar] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const insights = useMemo(() => buildInsights(data), [data]);
  const totals = useMemo(
    () => ({
      deuda: data.cobros.reduce((total, charge) => total + Math.max(0, calcDebt(charge)), 0),
      pagado: data.cobros.reduce((total, charge) => total + Number(charge.abonado || 0), 0),
      ocupados: data.departamentos.filter((department) => department.estado === "Arrendado").length,
      disponibles: data.departamentos.filter((department) => department.estado === "Disponible").length,
      ajustes: data.cobros.reduce(
        (total, charge) => total + Number(charge.ajusteSiguiente || 0),
        0,
      ),
    }),
    [data],
  );

  const isFirstSetup = !data.arrendatarios.length && !data.cobros.length && !data.contratos.length;

  function navigate(section) {
    setActive(section);
    setEditing(null);
    setQuery("");
    setSidebar(false);
  }

  function save(record) {
    let clean = { ...record };

    (fields[active] || []).forEach((field) => {
      if (moneyFields.includes(field) || ["piso", "diaPago"].includes(field)) {
        clean[field] = Number(clean[field] || 0);
      }
    });

    if (active === "cobros") clean = normalizeCharge(clean);

    if (active === "salidas") {
      clean.montoDevolver = Math.max(
        0,
        Number(clean.garantia || 0) -
          Number(clean.deudaActual || 0) -
          Number(clean.retencionLuz || 0) -
          Number(clean.otrosDescuentos || 0),
      );
    }

    setData((previous) => {
      const list = previous[active] || [];
      const updatedList = clean.id
        ? list.map((item) => (item.id === clean.id ? clean : item))
        : [{ ...clean, id: Date.now() }, ...list];

      return { ...previous, [active]: updatedList };
    });

    setEditing(null);
  }

  function remove(id) {
    if (!confirm("¿Eliminar este registro? Esta acción no se puede deshacer.")) return;
    setData((previous) => ({
      ...previous,
      [active]: previous[active].filter((record) => record.id !== id),
    }));
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `respaldo-arriendos-${todayISO()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        setData(JSON.parse(reader.result));
        alert("Respaldo restaurado correctamente");
      } catch {
        alert("El archivo no es válido");
      }
    };
    reader.readAsText(file);
  }

  const ActiveIcon = sections[active].icon;
  const rows = !["inicio", "asistente"].includes(active) ? data[active] || [] : [];
  const filtered = rows.filter((record) =>
    JSON.stringify(record).toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="app">
      <aside className={`sidebar ${sidebar ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-icon">
            <Building2 size={34} />
          </span>
          <div>
            <b>{data.configuracion.nombre}</b>
            <small>Datos guardados automáticamente</small>
          </div>
        </div>

        {Object.entries(sections).map(([key, section]) => {
          const Icon = section.icon;
          return (
            <button
              className={`nav ${active === key ? "active" : ""}`}
              key={key}
              onClick={() => navigate(key)}
            >
              <Icon size={22} />
              {section.label}
            </button>
          );
        })}
      </aside>

      <main className="main">
        <header className="hero">
          <button className="menu" onClick={() => setSidebar(!sidebar)} aria-label="Abrir menú">
            <Menu />
          </button>
          <div className="hero-title">
            <ActiveIcon size={42} />
            <div>
              <h1>{sections[active].label}</h1>
              <p>Administración clara, editable y con trazabilidad de redondeos, pagos y salidas.</p>
            </div>
          </div>
          <div className="header-actions">
            <label className="secondary import-button">
              Restaurar
              <input type="file" accept="application/json" onChange={importBackup} />
            </label>
            <button className="backup" onClick={exportBackup}>
              <Download size={20} />
              Respaldar
            </button>
          </div>
        </header>

        {active === "inicio" && (
          <>
            <section className="cards">
              <Stat
                icon={Building2}
                title="Departamentos"
                value={data.departamentos.length}
                note={`${totals.ocupados} ocupados / ${totals.disponibles} disponibles`}
              />
              <Stat
                icon={BadgeDollarSign}
                title="Pagado"
                value={money(totals.pagado)}
                note="Abonos reales registrados"
              />
              <Stat
                icon={AlertTriangle}
                title="Deuda pendiente"
                value={money(totals.deuda)}
                note="Saldo real acumulado"
              />
              <Stat
                icon={WalletCards}
                title="Ajustes próximos"
                value={money(totals.ajustes)}
                note="Diferencias por redondeo"
              />
            </section>

            {isFirstSetup && (
              <section className="setup-banner">
                <div>
                  <b>Sistema limpio y listo para configurar</b>
                  <span>
                    No hay pagos ni deudas ficticias. Comience ingresando el canon, estado y arrendatario de cada departamento.
                  </span>
                </div>
                <button className="primary" onClick={() => navigate("departamentos")}>
                  Configurar departamentos
                </button>
              </section>
            )}

            <section className="rounding-banner">
              <b>Regla de redondeo activa</b>
              <span>
                Cada cobro se redondea al múltiplo de $100 más cercano. La diferencia se guarda con signo contrario para aplicarla en el siguiente cobro.
              </span>
            </section>

            <section className="grid2">
              <div className="panel">
                <h2>Acciones rápidas</h2>
                <div className="quick">
                  <button onClick={() => navigate("vouchers")}>
                    <ReceiptText /> Emitir voucher
                  </button>
                  <button onClick={() => navigate("cobros")}>
                    <WalletCards /> Registrar cobro
                  </button>
                  <button onClick={() => navigate("salidas")}>
                    <LogOut /> Preparar salida
                  </button>
                  <button onClick={() => navigate("departamentos")}>
                    <Building2 /> Editar departamento
                  </button>
                </div>
              </div>
              <AIBox insights={insights} setActive={navigate} />
            </section>
          </>
        )}

        {active === "asistente" && (
          <AssistantPanel insights={insights} setActive={navigate} />
        )}

        {!["inicio", "asistente"].includes(active) && (
          <section className="panel">
            <div className="toolbar">
              <div className="search">
                <Search size={22} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Buscar en ${sections[active].label}`}
                />
              </div>
              <button className="primary" onClick={() => setEditing(emptyRecord(active, data))}>
                <Plus size={22} /> Agregar
              </button>
            </div>

            {editing && (
              <Editor
                section={active}
                record={editing}
                onSave={save}
                onCancel={() => setEditing(null)}
                data={data}
              />
            )}

            <div className="tablebox">
              <table>
                <thead>
                  <tr>
                    {fields[active].map((field) => (
                      <th key={field}>{label(field)}</th>
                    ))}
                    {active === "cobros" && <th>Saldo</th>}
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((record) => (
                    <tr key={record.id}>
                      {fields[active].map((field) => (
                        <td key={field}>{displayValue(field, record[field])}</td>
                      ))}
                      {active === "cobros" && (
                        <td className={calcDebt(record) > 0 ? "debt" : "ok"}>
                          {money(calcDebt(record))}
                        </td>
                      )}
                      <td className="actions">
                        {active === "vouchers" && (
                          <button onClick={() => window.print()}>
                            <Printer size={17} /> Imprimir
                          </button>
                        )}
                        <button onClick={() => setEditing(record)}>
                          <Pencil size={17} /> Editar
                        </button>
                        <button className="danger" onClick={() => remove(record.id)}>
                          <Trash2 size={17} /> Borrar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr>
                      <td className="empty" colSpan={fields[active].length + 2}>
                        Sin registros. Use el botón “Agregar” para ingresar el primero.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Stat({ icon: Icon, title, value, note }) {
  return (
    <div className="stat">
      <Icon size={36} />
      <b>{value}</b>
      <span>{title}</span>
      <small>{note}</small>
    </div>
  );
}

function AIBox({ insights, setActive }) {
  return (
    <div className="panel ai">
      <h2>
        <BrainCircuit /> Sugerencias
      </h2>
      {insights.slice(0, 4).map((insight, index) => (
        <div className={`insight ${insight.priority.toLowerCase()}`} key={index}>
          <strong>
            {insight.priority} · {insight.type}
          </strong>
          <p>{insight.text}</p>
          <button onClick={() => setActive(insight.target)}>Revisar</button>
        </div>
      ))}
    </div>
  );
}

function AssistantPanel({ insights, setActive }) {
  return (
    <section className="panel">
      <h2>
        <BrainCircuit /> Asistente administrativo
      </h2>
      <p className="lead">
        Prioriza tareas según deudas, consumos faltantes, vencimientos y liquidaciones abiertas.
      </p>
      {insights.map((insight, index) => (
        <div className={`insight ${insight.priority.toLowerCase()}`} key={index}>
          <strong>
            {insight.priority} · {insight.type}
          </strong>
          <p>{insight.text}</p>
          <button onClick={() => setActive(insight.target)}>Abrir módulo</button>
        </div>
      ))}
    </section>
  );
}

function Editor({ section, record, onSave, onCancel, data }) {
  const [form, setForm] = useState(record);
  const departmentNumbers = data.departamentos.map((department) => department.numero);

  function update(field, value) {
    const next = { ...form, [field]: value };
    const department = data.departamentos.find((item) => item.numero === value);

    if (department && ["vouchers", "cobros", "salidas", "contratos"].includes(section)) {
      next.arrendatario = department.arrendatario;

      if (section === "cobros") {
        next.arriendo = department.canon;
      }

      if (section === "vouchers") {
        next.concepto = next.concepto || "Pago de arriendo";
      }

      if (section === "salidas") {
        const contract = data.contratos.find(
          (item) => item.departamento === value && item.estado === "Vigente",
        );
        next.garantia = contract?.garantia || 0;
        next.deudaActual = data.cobros
          .filter((item) => item.departamento === value)
          .reduce((total, item) => total + Math.max(0, calcDebt(item)), 0);
      }
    }

    setForm(next);
  }

  const readOnlyFields = [
    "totalCalculado",
    "totalCobrado",
    "ajusteSiguiente",
    "montoDevolver",
  ];

  return (
    <div className="editor">
      <div className="editor-head">
        <h2>{record.id ? "Editar registro" : "Nuevo registro"}</h2>
        <button onClick={onCancel} aria-label="Cerrar editor">
          <X />
        </button>
      </div>

      <div className="formgrid">
        {fields[section].map((field) => (
          <label key={field}>
            <span>{label(field)}</span>
            {["estado", "medio", "departamento"].includes(field) ? (
              <select value={form[field] ?? ""} onChange={(event) => update(field, event.target.value)}>
                <option value="">Seleccione</option>
                {field === "departamento" &&
                  departmentNumbers.map((number) => <option key={number}>{number}</option>)}
                {field === "medio" &&
                  ["Efectivo", "Transferencia", "Débito", "Crédito", "Otro"].map(
                    (option) => <option key={option}>{option}</option>,
                  )}
                {field === "estado" &&
                  [
                    "Pendiente",
                    "Pagado",
                    "Vigente",
                    "Finalizado",
                    "Disponible",
                    "Arrendado",
                    "En preparación",
                    "Esperando boleta de luz",
                    "Cerrada",
                  ].map((option) => <option key={option}>{option}</option>)}
              </select>
            ) : (
              <input
                type={
                  moneyFields.includes(field) || ["piso", "diaPago"].includes(field)
                    ? "number"
                    : dateFields.includes(field)
                      ? "date"
                      : "text"
                }
                value={form[field] ?? ""}
                readOnly={readOnlyFields.includes(field)}
                onChange={(event) => update(field, event.target.value)}
              />
            )}
          </label>
        ))}
      </div>

      <div className="editor-actions">
        <button className="primary" onClick={() => onSave(form)}>
          <Save /> Guardar
        </button>
        <button className="secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
