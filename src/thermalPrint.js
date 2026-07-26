const PRINT_BUTTON_TEXT = "Imprimir";

function getCellText(cells, index) {
  return cells[index]?.textContent?.trim() || "—";
}

function addLine(container, label, value, className = "thermal-row") {
  const row = document.createElement("div");
  row.className = className;

  const name = document.createElement("span");
  name.textContent = label;

  const detail = document.createElement("span");
  detail.textContent = value;

  row.append(name, detail);
  container.appendChild(row);
}

function addDetail(container, label, value) {
  const block = document.createElement("div");
  block.className = "thermal-detail";

  const name = document.createElement("b");
  name.textContent = label;

  const detail = document.createElement("span");
  detail.textContent = value;

  block.append(name, detail);
  container.appendChild(block);
}

function createThermalTicket(voucher) {
  document.querySelector(".thermal-ticket")?.remove();

  const ticket = document.createElement("section");
  ticket.className = "thermal-ticket";

  const header = document.createElement("header");
  header.className = "thermal-center";

  const building = document.createElement("h1");
  building.textContent = voucher.building;

  const title = document.createElement("h2");
  title.textContent = "COMPROBANTE DE PAGO";

  const subtitle = document.createElement("p");
  subtitle.textContent = "Administración de arriendos";

  header.append(building, title, subtitle);
  ticket.appendChild(header);

  const separatorOne = document.createElement("div");
  separatorOne.className = "thermal-separator";
  ticket.appendChild(separatorOne);

  addLine(ticket, "Folio", voucher.folio);
  addLine(ticket, "Fecha", voucher.date);
  addLine(ticket, "Departamento", voucher.department);

  const separatorTwo = document.createElement("div");
  separatorTwo.className = "thermal-separator";
  ticket.appendChild(separatorTwo);

  addDetail(ticket, "Recibido de", voucher.tenant);
  addDetail(ticket, "Concepto", voucher.concept);
  addDetail(ticket, "Medio de pago", voucher.paymentMethod);
  addLine(ticket, "TOTAL", voucher.amount, "thermal-total");
  addDetail(ticket, "Recibido por", voucher.receivedBy);

  const signature = document.createElement("div");
  signature.className = "thermal-signature";
  signature.textContent = "Firma / recepción";
  ticket.appendChild(signature);

  const footer = document.createElement("footer");
  footer.textContent = `Emitido ${new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date())}. Comprobante interno; no reemplaza un documento tributario.`;
  ticket.appendChild(footer);

  document.body.appendChild(ticket);
  return ticket;
}

function handleThermalPrint(event) {
  const button = event.target.closest("button");
  if (!button || !button.textContent?.includes(PRINT_BUTTON_TEXT)) return;

  const title = document.querySelector(".hero h1")?.textContent?.trim();
  if (title !== "Vouchers") return;

  const row = button.closest("tr");
  const cells = row ? Array.from(row.querySelectorAll(":scope > td")) : [];
  if (cells.length < 8) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  const ticket = createThermalTicket({
    building: document.querySelector(".brand b")?.textContent?.trim() || "Administración de arriendos",
    folio: getCellText(cells, 0),
    date: getCellText(cells, 1),
    department: getCellText(cells, 2),
    tenant: getCellText(cells, 3),
    concept: getCellText(cells, 4),
    amount: getCellText(cells, 5),
    paymentMethod: getCellText(cells, 6),
    receivedBy: getCellText(cells, 7),
  });

  document.body.classList.add("thermal-printing");

  const cleanup = () => {
    document.body.classList.remove("thermal-printing");
    ticket.remove();
    window.removeEventListener("afterprint", cleanup);
  };

  window.addEventListener("afterprint", cleanup);
  window.print();
  window.setTimeout(cleanup, 1500);
}

document.addEventListener("click", handleThermalPrint, true);
