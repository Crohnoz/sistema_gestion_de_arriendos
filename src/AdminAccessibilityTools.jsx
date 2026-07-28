import { useEffect, useMemo, useState } from "react";
import {
  Accessibility,
  CheckCircle2,
  Copy,
  Minus,
  Plus,
  RotateCcw,
  Save,
  X,
  Zap,
} from "lucide-react";
import { STORAGE_KEY } from "./runtime";

const UI_SIZE_KEY = "arriendos-accessibility-large";
const CLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const money = (value) => CLP.format(Number(value || 0));
const currentPeriod = () => new Date().toISOString().slice(0, 7);

function previousPeriod(period) {
  const [year, month] = period.split("-").map(Number);
  const date = new Date(year, month - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function loadWorkspace() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function roundHundred(value) {
  const original = Number(value || 0);
  const rounded = Math.round(original / 100) * 100;
  return { original, rounded, adjustment: rounded - original };
}

function normalizeCharge(charge) {
  const total =
    Number(charge.arriendo || 0) +
    Number(charge.luz || 0) +
    Number(charge.agua || 0) +
    Number(charge.gastosComunes || 0) +
    Number(charge.ajusteAnterior || 0);
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

function setReactInputValue(input, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, String(Math.max(0, Number(value || 0))));
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.focus();
}

const editableMoneyLabels = new Set([
  "Canon",
  "Arriendo",
  "Luz",
  "Agua",
  "Gastos comunes",
  "Ajuste anterior",
  "Abonado",
  "Monto",
  "Garantía",
  "Deuda actual",
  "Retención por luz pendiente",
  "Otros descuentos",
]);

function installQuickMoneyButtons() {
  function enhance() {
    document.querySelectorAll(".formgrid label").forEach((labelElement) => {
      const title = labelElement.querySelector(":scope > span")?.textContent?.trim();
      const input = labelElement.querySelector(":scope > input[type='number']:not([readonly])");
      if (!input || !editableMoneyLabels.has(title) || input.dataset.quickMoney === "1") return;

      input.dataset.quickMoney = "1";
      const controls = document.createElement("div");
      controls.className = "quick-money-controls";
      controls.setAttribute("aria-label", `Ajuste rápido de ${title}`);

      [-5000, -1000, 1000, 5000].forEach((delta) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = delta < 0 ? "decrease" : "increase";
        button.textContent = `${delta < 0 ? "−" : "+"}$${Math.abs(delta).toLocaleString("es-CL")}`;
        button.setAttribute(
          "aria-label",
          `${delta < 0 ? "Restar" : "Sumar"} ${money(Math.abs(delta))} a ${title}`,
        );
        button.addEventListener("click", () => {
          setReactInputValue(input, Number(input.value || 0) + delta);
        });
        controls.appendChild(button);
      });

      input.insertAdjacentElement("afterend", controls);
    });
  }

  enhance();
  const observer = new MutationObserver(enhance);
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}

function buildElectricityRows(period) {
  const data = loadWorkspace();
  if (!data) return [];
  const previous = previousPeriod(period);

  return [...(data.departamentos || [])]
    .sort((a, b) => String(a.numero).localeCompare(String(b.numero), "es", { numeric: true }))
    .map((department) => {
      const currentCharge = (data.cobros || []).find(
        (charge) => charge.periodo === period && charge.departamento === department.numero,
      );
      const previousCharge = (data.cobros || []).find(
        (charge) => charge.periodo === previous && charge.departamento === department.numero,
      );

      return {
        departamento: department.numero,
        arrendatario: department.arrendatario || currentCharge?.arrendatario || "Sin arrendatario",
        estado: department.estado || "Disponible",
        canon: Number(department.canon || 0),
        value: Number(currentCharge?.luz || 0),
        previousValue: Number(previousCharge?.luz || 0),
        hasCurrentCharge: Boolean(currentCharge),
      };
    });
}

export default function AdminAccessibilityTools() {
  const [appReady, setAppReady] = useState(false);
  const [largeMode, setLargeMode] = useState(
    () => window.localStorage.getItem(UI_SIZE_KEY) === "true",
  );
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState(currentPeriod());
  const [invoiceTotal, setInvoiceTotal] = useState(0);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    const refreshVisibility = () => setAppReady(Boolean(document.querySelector(".app")));
    refreshVisibility();
    const observer = new MutationObserver(refreshVisibility);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("accessibility-large", largeMode);
    window.localStorage.setItem(UI_SIZE_KEY, String(largeMode));
  }, [largeMode]);

  useEffect(() => installQuickMoneyButtons(), []);

  useEffect(() => {
    if (!open) return;
    setRows(buildElectricityRows(period));
    const data = loadWorkspace();
    const electricityBill = (data?.boletas || []).find(
      (bill) =>
        bill.periodo === period &&
        /luz|electricidad|eléctric/i.test(`${bill.servicio || ""} ${bill.proveedor || ""}`),
    );
    setInvoiceTotal(Number(electricityBill?.monto || 0));
    setStatus("idle");
  }, [open, period]);

  const distributedTotal = useMemo(
    () => rows.reduce((total, row) => total + Number(row.value || 0), 0),
    [rows],
  );
  const difference = Number(invoiceTotal || 0) - distributedTotal;

  function changeRow(departmentNumber, nextValue) {
    setRows((current) =>
      current.map((row) =>
        row.departamento === departmentNumber
          ? { ...row, value: Math.max(0, Number(nextValue || 0)) }
          : row,
      ),
    );
  }

  function copyPreviousAll() {
    setRows((current) =>
      current.map((row) => ({ ...row, value: Number(row.previousValue || 0) })),
    );
  }

  function saveElectricity() {
    const data = loadWorkspace();
    if (!data) {
      setStatus("error");
      return;
    }

    const previous = previousPeriod(period);
    const currentCharges = [...(data.cobros || [])];
    const now = Date.now();

    rows.forEach((row, index) => {
      const existingIndex = currentCharges.findIndex(
        (charge) => charge.periodo === period && charge.departamento === row.departamento,
      );
      const previousCharge = currentCharges.find(
        (charge) => charge.periodo === previous && charge.departamento === row.departamento,
      );
      const shouldKeep =
        existingIndex >= 0 ||
        Number(row.value || 0) > 0 ||
        row.estado === "Arrendado" ||
        Number(row.canon || 0) > 0;

      if (!shouldKeep) return;

      const base =
        existingIndex >= 0
          ? currentCharges[existingIndex]
          : {
              id: now + index,
              periodo: period,
              departamento: row.departamento,
              arrendatario: row.arrendatario === "Sin arrendatario" ? "" : row.arrendatario,
              arriendo: Number(row.canon || 0),
              luz: 0,
              agua: 0,
              gastosComunes: 0,
              ajusteAnterior: Number(previousCharge?.ajusteSiguiente || 0),
              abonado: 0,
              fechaVencimiento: `${period}-05`,
              estado: "Pendiente",
              nota: "Consumo ingresado mediante carga rápida de luz.",
            };

      const normalized = normalizeCharge({
        ...base,
        periodo: period,
        departamento: row.departamento,
        arrendatario: row.arrendatario === "Sin arrendatario" ? "" : row.arrendatario,
        arriendo: Number(base.arriendo || row.canon || 0),
        luz: Number(row.value || 0),
      });

      if (existingIndex >= 0) currentCharges[existingIndex] = normalized;
      else currentCharges.unshift(normalized);
    });

    let bills = [...(data.boletas || [])];
    if (Number(invoiceTotal || 0) > 0) {
      const billIndex = bills.findIndex(
        (bill) =>
          bill.periodo === period &&
          /luz|electricidad|eléctric/i.test(`${bill.servicio || ""} ${bill.proveedor || ""}`),
      );
      const bill = {
        ...(billIndex >= 0 ? bills[billIndex] : {}),
        id: billIndex >= 0 ? bills[billIndex].id : now + 1000,
        servicio: billIndex >= 0 ? bills[billIndex].servicio : "Electricidad",
        proveedor: billIndex >= 0 ? bills[billIndex].proveedor : "Proveedor eléctrico",
        periodo: period,
        vencimiento: billIndex >= 0 ? bills[billIndex].vencimiento : `${period}-25`,
        monto: Number(invoiceTotal),
        estado: billIndex >= 0 ? bills[billIndex].estado : "Pendiente",
      };
      if (billIndex >= 0) bills[billIndex] = bill;
      else bills.unshift(bill);
    }

    setStatus("saving");
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...data, cobros: currentCharges, boletas: bills }),
    );

    window.setTimeout(() => {
      setStatus("saved");
      window.setTimeout(() => window.location.reload(), 550);
    }, 1000);
  }

  if (!appReady) return null;

  return (
    <>
      <div className="admin-assist-floating" aria-label="Herramientas de accesibilidad y consumos">
        <button
          type="button"
          className={largeMode ? "active" : ""}
          onClick={() => setLargeMode((current) => !current)}
          aria-pressed={largeMode}
          title="Aumentar tamaño de textos, botones y campos"
        >
          <Accessibility size={22} />
          {largeMode ? "Tamaño normal" : "Modo grande"}
        </button>
        <button type="button" className="electricity" onClick={() => setOpen(true)}>
          <Zap size={22} /> Cargar luz
        </button>
      </div>

      {open && (
        <div className="electricity-modal-backdrop" role="presentation">
          <section className="electricity-modal" role="dialog" aria-modal="true" aria-labelledby="electricity-title">
            <header>
              <div>
                <span className="modal-eyebrow">Carga asistida</span>
                <h2 id="electricity-title"><Zap /> Consumos de luz</h2>
                <p>Edite los 23 departamentos en una sola pantalla. Los totales y redondeos se recalculan al guardar.</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Cerrar carga de luz">
                <X />
              </button>
            </header>

            <div className="electricity-summary">
              <label>
                <span>Período de cobro</span>
                <input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} />
              </label>
              <label>
                <span>Total de la boleta general</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={invoiceTotal || ""}
                  onChange={(event) => setInvoiceTotal(Math.max(0, Number(event.target.value || 0)))}
                  placeholder="$0"
                />
              </label>
              <div className="electricity-total">
                <span>Total distribuido</span>
                <strong>{money(distributedTotal)}</strong>
              </div>
              <div className={`electricity-difference ${difference === 0 ? "balanced" : "pending"}`}>
                <span>Diferencia por distribuir</span>
                <strong>{money(difference)}</strong>
              </div>
            </div>

            <div className="bulk-actions">
              <button type="button" onClick={copyPreviousAll}><Copy size={19} /> Copiar mes anterior</button>
              <button type="button" onClick={() => setRows((current) => current.map((row) => ({ ...row, value: 0 })))}>
                <RotateCcw size={19} /> Dejar todos en cero
              </button>
            </div>

            <div className="electricity-list">
              {rows.map((row) => (
                <article className="electricity-row" key={row.departamento}>
                  <div className="electricity-person">
                    <strong>Depto. {row.departamento}</strong>
                    <span>{row.arrendatario}</span>
                    <small>{row.estado} · anterior {money(row.previousValue)}</small>
                  </div>
                  <div className="electricity-stepper">
                    <button type="button" onClick={() => changeRow(row.departamento, row.value - 5000)} aria-label={`Restar 5000 al departamento ${row.departamento}`}>
                      <Minus size={18} /> $5.000
                    </button>
                    <button type="button" onClick={() => changeRow(row.departamento, row.value - 1000)} aria-label={`Restar 1000 al departamento ${row.departamento}`}>
                      <Minus size={18} /> $1.000
                    </button>
                    <label>
                      <span className="sr-only">Luz departamento {row.departamento}</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={row.value}
                        onChange={(event) => changeRow(row.departamento, event.target.value)}
                      />
                    </label>
                    <button type="button" onClick={() => changeRow(row.departamento, row.value + 1000)} aria-label={`Sumar 1000 al departamento ${row.departamento}`}>
                      <Plus size={18} /> $1.000
                    </button>
                    <button type="button" onClick={() => changeRow(row.departamento, row.value + 5000)} aria-label={`Sumar 5000 al departamento ${row.departamento}`}>
                      <Plus size={18} /> $5.000
                    </button>
                    <button type="button" className="copy-one" onClick={() => changeRow(row.departamento, row.previousValue)} disabled={!row.previousValue}>
                      <Copy size={18} /> Anterior
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <footer>
              <div className={`save-feedback ${status}`} aria-live="polite">
                {status === "saving" && "Guardando consumos y recalculando cobros…"}
                {status === "saved" && <><CheckCircle2 size={19} /> Consumos guardados</>}
                {status === "error" && "No fue posible leer los datos del edificio."}
              </div>
              <button type="button" className="secondary-action" onClick={() => setOpen(false)}>Cancelar</button>
              <button type="button" className="save-electricity" onClick={saveElectricity} disabled={status === "saving"}>
                <Save size={20} /> Guardar consumos
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
