
import { useMemo, useState } from "react";
import {
  Building2, Home, Users, FileText, WalletCards, ReceiptText, Zap, Droplets,
  Landmark, Bell, BrainCircuit, AlertTriangle, CheckCircle2, CalendarClock,
  Search, Plus, Pencil, Trash2, Save, X, Menu, Printer, Download, BadgeDollarSign
} from "lucide-react";

const CLP = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

function money(v) {
  return CLP.format(Number(v || 0));
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const deptos = Array.from({ length: 23 }, (_, i) => {
  const n = i + 1;
  const piso = n <= 8 ? 1 : n <= 16 ? 2 : 3;
  return {
    id: n,
    numero: `${piso}${String(n).padStart(2, "0")}`,
    piso,
    estado: n % 5 === 0 ? "Disponible" : "Arrendado",
    canon: piso === 1 ? 330000 : piso === 2 ? 370000 : 410000,
    arrendatario: n % 5 === 0 ? "" : `Arrendatario ${n}`,
    telefono: n % 5 === 0 ? "" : `+56 9 ${1000+n} ${2000+n}`,
    diaPago: 5,
    observacion: ""
  };
});

const seed = {
  departamentos: deptos,
  arrendatarios: deptos.filter(d => d.arrendatario).map(d => ({
    id: d.id,
    nombre: d.arrendatario,
    rut: "",
    telefono: d.telefono,
    email: "",
    departamento: d.numero,
    contactoEmergencia: ""
  })),
  cobros: deptos.filter(d => d.estado === "Arrendado").map((d, idx) => ({
    id: idx + 1,
    periodo: "2026-06",
    departamento: d.numero,
    arrendatario: d.arrendatario,
    arriendo: d.canon,
    luz: idx % 3 === 0 ? 0 : 28000 + idx * 900,
    agua: idx % 4 === 0 ? 0 : 16000 + idx * 700,
    gastosComunes: 52000 + idx * 500,
    abonado: idx % 3 === 0 ? 0 : d.canon,
    fechaVencimiento: "2026-06-05",
    estado: idx % 3 === 0 ? "Pendiente" : "Pagado",
    nota: ""
  })),
  vouchers: [
    { id: 1, folio: "V-000001", fecha: todayISO(), departamento: "101", arrendatario: "Arrendatario 1", concepto: "Pago arriendo junio", monto: 330000, medio: "Transferencia", recibidoPor: "Administrador" }
  ],
  boletas: [
    { id: 1, servicio: "Luz edificio", proveedor: "CGÉ", periodo: "2026-06", vencimiento: addDaysISO(4), monto: 165000, estado: "Pendiente" },
    { id: 2, servicio: "Agua edificio", proveedor: "Aguas Araucanía", periodo: "2026-06", vencimiento: addDaysISO(8), monto: 142000, estado: "Pendiente" },
    { id: 3, servicio: "Gastos comunes edificio", proveedor: "Administración", periodo: "2026-06", vencimiento: addDaysISO(2), monto: 320000, estado: "Pendiente" }
  ],
  contratos: [
    { id: 1, departamento: "101", arrendatario: "Arrendatario 1", inicio: "2026-01-01", termino: "2026-12-31", garantia: 330000, estado: "Vigente" }
  ]
};

const sections = {
  inicio: { label: "Inicio", icon: Home },
  departamentos: { label: "Departamentos", icon: Building2 },
  arrendatarios: { label: "Arrendatarios", icon: Users },
  cobros: { label: "Cobros y deudas", icon: WalletCards },
  vouchers: { label: "Voucher", icon: ReceiptText },
  boletas: { label: "Boletas y vencimientos", icon: CalendarClock },
  contratos: { label: "Contratos", icon: FileText },
  asistente: { label: "Asistente IA", icon: BrainCircuit }
};

const fields = {
  departamentos: ["numero", "piso", "estado", "canon", "arrendatario", "telefono", "diaPago", "observacion"],
  arrendatarios: ["nombre", "rut", "telefono", "email", "departamento", "contactoEmergencia"],
  cobros: ["periodo", "departamento", "arrendatario", "arriendo", "luz", "agua", "gastosComunes", "abonado", "fechaVencimiento", "estado", "nota"],
  vouchers: ["folio", "fecha", "departamento", "arrendatario", "concepto", "monto", "medio", "recibidoPor"],
  boletas: ["servicio", "proveedor", "periodo", "vencimiento", "monto", "estado"],
  contratos: ["departamento", "arrendatario", "inicio", "termino", "garantia", "estado"]
};

const moneyFields = ["canon", "arriendo", "luz", "agua", "gastosComunes", "abonado", "monto", "garantia"];
const dateFields = ["fecha", "fechaVencimiento", "vencimiento", "inicio", "termino"];

function label(key) {
  const map = {
    numero: "N° Depto", banos: "Baños", gastosComunes: "Gastos comunes",
    fechaVencimiento: "Vencimiento", diaPago: "Día de pago", recibidoPor: "Recibido por",
    contactoEmergencia: "Contacto emergencia"
  };
  return map[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, m => m.toUpperCase());
}

function value(key, val) {
  if (moneyFields.includes(key)) return money(val);
  return val || "—";
}

function empty(section, data) {
  const obj = {};
  fields[section].forEach(f => obj[f] = "");
  if (section === "vouchers") {
    obj.folio = `V-${String((data.vouchers.length || 0) + 1).padStart(6, "0")}`;
    obj.fecha = todayISO();
    obj.medio = "Efectivo";
    obj.recibidoPor = "Administrador";
  }
  if (section === "cobros") {
    obj.periodo = "2026-07";
    obj.fechaVencimiento = "2026-07-05";
    obj.estado = "Pendiente";
  }
  if (section === "boletas") {
    obj.vencimiento = todayISO();
    obj.estado = "Pendiente";
  }
  return obj;
}

function calcDebt(c) {
  return Number(c.arriendo || 0) + Number(c.luz || 0) + Number(c.agua || 0) + Number(c.gastosComunes || 0) - Number(c.abonado || 0);
}

function daysUntil(date) {
  const a = new Date(todayISO());
  const b = new Date(date);
  return Math.ceil((b - a) / 86400000);
}

function buildInsights(data) {
  const insights = [];
  const pendingCobros = data.cobros.filter(c => calcDebt(c) > 0);
  const totalDebt = pendingCobros.reduce((a, c) => a + calcDebt(c), 0);
  const missingUtilities = data.cobros.filter(c => Number(c.luz || 0) === 0 || Number(c.agua || 0) === 0);
  const dueBoletas = data.boletas.filter(b => b.estado !== "Pagado" && daysUntil(b.vencimiento) <= 7);
  const emptyDeptos = data.departamentos.filter(d => d.estado === "Disponible");

  if (totalDebt > 0) {
    insights.push({
      type: "Riesgo de deuda",
      priority: "Alta",
      text: `Hay ${pendingCobros.length} cobro(s) con saldo pendiente por ${money(totalDebt)}. Conviene revisar antes de emitir nuevos vouchers.`,
      action: "Ir a Cobros"
    });
  }
  if (dueBoletas.length) {
    insights.push({
      type: "Vencimientos cercanos",
      priority: "Alta",
      text: `${dueBoletas.length} boleta(s) vencen dentro de 7 días o menos: ${dueBoletas.map(b => b.servicio).join(", ")}.`,
      action: "Ir a Boletas"
    });
  }
  if (missingUtilities.length) {
    insights.push({
      type: "Datos incompletos",
      priority: "Media",
      text: `${missingUtilities.length} departamento(s) tienen luz o agua en cero. Puede faltar ingresar consumo del mes.`,
      action: "Completar consumos"
    });
  }
  if (emptyDeptos.length) {
    insights.push({
      type: "Vacancia",
      priority: "Media",
      text: `Hay ${emptyDeptos.length} departamento(s) disponibles: ${emptyDeptos.map(d => d.numero).join(", ")}.`,
      action: "Revisar departamentos"
    });
  }
  if (!insights.length) {
    insights.push({ type: "Todo en orden", priority: "Baja", text: "No hay alertas críticas. La administración del edificio está al día.", action: "Mantener seguimiento" });
  }
  return insights;
}

export default function App() {
  const [data, setData] = useState(seed);
  const [active, setActive] = useState("inicio");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [sidebar, setSidebar] = useState(false);

  const insights = useMemo(() => buildInsights(data), [data]);
  const totals = useMemo(() => {
    const deuda = data.cobros.reduce((a, c) => a + Math.max(0, calcDebt(c)), 0);
    const pagado = data.cobros.reduce((a, c) => a + Number(c.abonado || 0), 0);
    const ocupados = data.departamentos.filter(d => d.estado === "Arrendado").length;
    const disponibles = data.departamentos.filter(d => d.estado === "Disponible").length;
    return { deuda, pagado, ocupados, disponibles };
  }, [data]);

  function save(row) {
    const clean = { ...row };
    (fields[active] || []).forEach(f => {
      if (moneyFields.includes(f) || ["piso", "diaPago"].includes(f)) clean[f] = Number(clean[f] || 0);
    });
    if (active === "cobros") clean.estado = calcDebt(clean) <= 0 ? "Pagado" : "Pendiente";
    setData(prev => {
      const list = prev[active] || [];
      return { ...prev, [active]: clean.id ? list.map(r => r.id === clean.id ? clean : r) : [{ ...clean, id: Date.now() }, ...list] };
    });
    setEditing(null);
  }

  function remove(id) {
    if (!confirm("¿Seguro que desea eliminar este registro?")) return;
    setData(prev => ({ ...prev, [active]: prev[active].filter(r => r.id !== id) }));
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `respaldo-arriendos-${todayISO()}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  const ActiveIcon = sections[active].icon;
  const rows = active !== "inicio" && active !== "asistente" ? data[active] || [] : [];
  const filtered = rows.filter(r => JSON.stringify(r).toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="app">
      <aside className={`sidebar ${sidebar ? "open" : ""}`}>
        <div className="brand"><span className="brand-icon"><Building2 size={34}/></span><div><b>Edificio</b><small>23 departamentos</small></div></div>
        {Object.entries(sections).map(([key, sec]) => {
          const Icon = sec.icon;
          return <button className={`nav ${active === key ? "active" : ""}`} key={key} onClick={() => { setActive(key); setEditing(null); setQuery(""); setSidebar(false); }}>
            <Icon size={23}/>{sec.label}
          </button>
        })}
      </aside>

      <main className="main">
        <header className="hero">
          <button className="menu" onClick={() => setSidebar(!sidebar)}><Menu /></button>
          <div className="hero-title"><ActiveIcon size={42}/><div><h1>{sections[active].label}</h1><p>Sistema interno sin login, enfocado en voucher, pagos, boletas y sugerencias administrativas.</p></div></div>
          <button className="backup" onClick={exportBackup}><Download size={20}/> Respaldo JSON</button>
        </header>

        {active === "inicio" && (
          <>
            <section className="cards">
              <Stat icon={Building2} title="Departamentos" value="23" note={`${totals.ocupados} ocupados / ${totals.disponibles} disponibles`} />
              <Stat icon={BadgeDollarSign} title="Pagado este mes" value={money(totals.pagado)} note="Según cobros registrados" />
              <Stat icon={AlertTriangle} title="Deuda pendiente" value={money(totals.deuda)} note="Arriendo + luz + agua + gastos" />
              <Stat icon={BrainCircuit} title="Alertas IA" value={insights.length} note="Sugerencias automáticas" />
            </section>
            <section className="grid2">
              <div className="panel">
                <h2>Acciones rápidas</h2>
                <div className="quick">
                  <button onClick={() => setActive("vouchers")}><ReceiptText/> Emitir voucher</button>
                  <button onClick={() => setActive("cobros")}><WalletCards/> Revisar deudas</button>
                  <button onClick={() => setActive("boletas")}><CalendarClock/> Ver vencimientos</button>
                  <button onClick={() => setActive("departamentos")}><Building2/> Ver edificio</button>
                </div>
              </div>
              <AIBox insights={insights} setActive={setActive}/>
            </section>
          </>
        )}

        {active === "asistente" && <AssistantPanel insights={insights} data={data} setActive={setActive}/>}

        {active !== "inicio" && active !== "asistente" && (
          <section className="panel">
            <div className="toolbar">
              <div className="search"><Search size={22}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={`Buscar en ${sections[active].label}`} /></div>
              <button className="primary" onClick={() => setEditing(empty(active, data))}><Plus size={22}/> Agregar</button>
            </div>

            {editing && <Editor section={active} record={editing} onSave={save} onCancel={() => setEditing(null)} data={data}/>}

            <div className="tablebox">
              <table>
                <thead><tr>{fields[active].map(f => <th key={f}>{label(f)}</th>)}{active==="cobros" && <th>Saldo</th>}<th>Acciones</th></tr></thead>
                <tbody>
                  {filtered.map(r => <tr key={r.id}>
                    {fields[active].map(f => <td key={f}>{value(f, r[f])}</td>)}
                    {active==="cobros" && <td className={calcDebt(r)>0 ? "debt" : "ok"}>{money(calcDebt(r))}</td>}
                    <td className="actions">
                      {active==="vouchers" && <button onClick={() => window.print()}><Printer size={18}/> Imprimir</button>}
                      <button onClick={() => setEditing(r)}><Pencil size={18}/> Editar</button>
                      <button className="danger" onClick={() => remove(r.id)}><Trash2 size={18}/> Borrar</button>
                    </td>
                  </tr>)}
                  {!filtered.length && <tr><td className="empty" colSpan={(fields[active]?.length || 0) + 2}>Sin registros.</td></tr>}
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
  return <div className="stat"><Icon size={38}/><b>{value}</b><span>{title}</span><small>{note}</small></div>
}

function AIBox({ insights, setActive }) {
  return <div className="panel ai">
    <h2><BrainCircuit/> Sugerencias IA</h2>
    {insights.slice(0,3).map((i, idx) => <div className={`insight ${i.priority.toLowerCase()}`} key={idx}>
      <strong>{i.type}</strong><p>{i.text}</p><button onClick={() => {
        if (i.action.includes("Cobros")) setActive("cobros");
        else if (i.action.includes("Boletas")) setActive("boletas");
        else if (i.action.includes("departamentos")) setActive("departamentos");
        else setActive("asistente");
      }}>{i.action}</button>
    </div>)}
  </div>
}

function AssistantPanel({ insights, data, setActive }) {
  const pendientes = data.boletas.filter(b => b.estado !== "Pagado").sort((a,b) => new Date(a.vencimiento)-new Date(b.vencimiento));
  return <section className="panel">
    <h2><BrainCircuit/> Asistente administrativo</h2>
    <p className="lead">Este módulo no reemplaza al administrador. Observa los datos ingresados y sugiere acciones: pagos próximos, deudas, consumos faltantes y departamentos disponibles.</p>
    <div className="assistant-grid">
      {insights.map((i, idx) => <div className={`insight ${i.priority.toLowerCase()}`} key={idx}>
        <strong>{i.priority} · {i.type}</strong><p>{i.text}</p>
      </div>)}
    </div>
    <h2>Recordatorios de boletas</h2>
    <div className="reminders">
      {pendientes.map(b => <div className="reminder" key={b.id}>
        <Bell/><div><b>{b.servicio}</b><span>Vence: {b.vencimiento} · {money(b.monto)} · faltan {daysUntil(b.vencimiento)} día(s)</span></div>
      </div>)}
    </div>
    <button className="primary wide" onClick={() => setActive("boletas")}>Administrar boletas</button>
  </section>
}

function Editor({ section, record, onSave, onCancel, data }) {
  const [form, setForm] = useState(record);
  const deptos = data.departamentos.map(d => d.numero);

  function update(field, value) {
    const next = { ...form, [field]: value };
    if (section === "vouchers" && field === "departamento") {
      const d = data.departamentos.find(x => x.numero === value);
      if (d) {
        next.arrendatario = d.arrendatario;
        next.concepto = next.concepto || "Pago de arriendo";
      }
    }
    setForm(next);
  }

  return <div className="editor">
    <div className="editor-head"><h2>{record.id ? "Editar registro" : "Nuevo registro"}</h2><button onClick={onCancel}><X/></button></div>
    <div className="formgrid">
      {fields[section].map(f => <label key={f}>
        <span>{label(f)}</span>
        {["estado", "pagado", "medio", "departamento"].includes(f) ? (
          <select value={form[f] ?? ""} onChange={e => update(f, e.target.value)}>
            <option value="">Seleccione</option>
            {f === "estado" && ["Pendiente", "Pagado", "Vigente", "Finalizado", "Disponible", "Arrendado"].map(o => <option key={o}>{o}</option>)}
            {f === "medio" && ["Efectivo", "Transferencia", "Débito", "Crédito", "Otro"].map(o => <option key={o}>{o}</option>)}
            {f === "departamento" && deptos.map(o => <option key={o}>{o}</option>)}
          </select>
        ) : (
          <input type={moneyFields.includes(f) || ["piso", "diaPago"].includes(f) ? "number" : dateFields.includes(f) ? "date" : "text"} value={form[f] ?? ""} onChange={e => update(f, e.target.value)} />
        )}
      </label>)}
    </div>
    <div className="editor-actions"><button className="primary" onClick={() => onSave(form)}><Save/> Guardar</button><button className="secondary" onClick={onCancel}>Cancelar</button></div>
  </div>
}
