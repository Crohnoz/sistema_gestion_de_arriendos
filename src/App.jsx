import { useEffect, useMemo, useState } from "react";
import {
  Building2, Home, Users, FileText, WalletCards, ReceiptText, Bell,
  BrainCircuit, AlertTriangle, CalendarClock, Search, Plus, Pencil,
  Trash2, Save, X, Menu, Printer, Download, BadgeDollarSign, LogOut
} from "lucide-react";

const STORAGE_KEY = "sistema-arriendos-v2";
const CLP = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const money = v => CLP.format(Number(v || 0));
const todayISO = () => new Date().toISOString().slice(0, 10);
const currentPeriod = () => todayISO().slice(0, 7);

function roundHundred(value) {
  const original = Number(value || 0);
  const rounded = Math.round(original / 100) * 100;
  return { original, rounded, adjustment: rounded - original };
}

const deptos = Array.from({ length: 23 }, (_, i) => {
  const n = i + 1;
  const piso = n <= 8 ? 1 : n <= 16 ? 2 : 3;
  return { id:n, numero:`${piso}${String(n).padStart(2,"0")}`, piso, estado:n%5===0?"Disponible":"Arrendado", canon:piso===1?330000:piso===2?370000:410000, arrendatario:n%5===0?"":`Arrendatario ${n}`, telefono:"", diaPago:5, observacion:"" };
});

const seed = {
  configuracion: { nombre:"Edificio 23", redondearCentenas:true, administrador:"Administrador" },
  departamentos: deptos,
  arrendatarios: deptos.filter(d=>d.arrendatario).map(d=>({ id:d.id,nombre:d.arrendatario,rut:"",telefono:"",email:"",departamento:d.numero,contactoEmergencia:"" })),
  cobros: deptos.filter(d=>d.estado==="Arrendado").map((d,i)=>({ id:i+1,periodo:currentPeriod(),departamento:d.numero,arrendatario:d.arrendatario,arriendo:d.canon,luz:i%3?28500+i*700:0,agua:16000+i*400,gastosComunes:52000,ajusteAnterior:0,totalCalculado:0,totalCobrado:0,ajusteSiguiente:0,abonado:i%3?d.canon:0,fechaVencimiento:`${currentPeriod()}-05`,estado:i%3?"Pendiente":"Pendiente",nota:"" })),
  vouchers: [],
  boletas: [],
  contratos: [{ id:1,departamento:"101",arrendatario:"Arrendatario 1",inicio:"2026-01-01",termino:"2026-12-31",garantia:330000,estado:"Vigente" }],
  salidas: []
};

const sections = {
  inicio:{label:"Inicio",icon:Home}, departamentos:{label:"Departamentos",icon:Building2},
  arrendatarios:{label:"Arrendatarios",icon:Users}, cobros:{label:"Cobros y deudas",icon:WalletCards},
  vouchers:{label:"Vouchers",icon:ReceiptText}, boletas:{label:"Boletas y vencimientos",icon:CalendarClock},
  contratos:{label:"Contratos",icon:FileText}, salidas:{label:"Liquidaciones de salida",icon:LogOut},
  asistente:{label:"Asistente administrativo",icon:BrainCircuit}
};

const fields = {
  departamentos:["numero","piso","estado","canon","arrendatario","telefono","diaPago","observacion"],
  arrendatarios:["nombre","rut","telefono","email","departamento","contactoEmergencia"],
  cobros:["periodo","departamento","arrendatario","arriendo","luz","agua","gastosComunes","ajusteAnterior","totalCalculado","totalCobrado","ajusteSiguiente","abonado","fechaVencimiento","estado","nota"],
  vouchers:["folio","fecha","departamento","arrendatario","concepto","monto","medio","recibidoPor"],
  boletas:["servicio","proveedor","periodo","vencimiento","monto","estado"],
  contratos:["departamento","arrendatario","inicio","termino","garantia","estado"],
  salidas:["departamento","arrendatario","fechaAviso","fechaEntrega","garantia","deudaActual","retencionLuz","otrosDescuentos","montoDevolver","estado","observacion"]
};

const moneyFields=["canon","arriendo","luz","agua","gastosComunes","ajusteAnterior","totalCalculado","totalCobrado","ajusteSiguiente","abonado","monto","garantia","deudaActual","retencionLuz","otrosDescuentos","montoDevolver"];
const dateFields=["fecha","fechaVencimiento","vencimiento","inicio","termino","fechaAviso","fechaEntrega"];
const labels={numero:"N° depto",diaPago:"Día de pago",gastosComunes:"Gastos comunes",contactoEmergencia:"Contacto emergencia",fechaVencimiento:"Vencimiento",recibidoPor:"Recibido por",ajusteAnterior:"Ajuste anterior",totalCalculado:"Total calculado",totalCobrado:"Total redondeado",ajusteSiguiente:"Ajuste próximo cobro",fechaAviso:"Fecha de aviso",fechaEntrega:"Fecha de entrega",deudaActual:"Deuda actual",retencionLuz:"Retención luz pendiente",otrosDescuentos:"Otros descuentos",montoDevolver:"Monto a devolver"};
const label=k=>labels[k]||k.replace(/([A-Z])/g," $1").replace(/^./,m=>m.toUpperCase());
const value=(k,v)=>moneyFields.includes(k)?money(v):(v||"—");

function calcCharge(c){ return Number(c.arriendo||0)+Number(c.luz||0)+Number(c.agua||0)+Number(c.gastosComunes||0)+Number(c.ajusteAnterior||0); }
function calcDebt(c){ return Number(c.totalCobrado||calcCharge(c))-Number(c.abonado||0); }
function normalizeCharge(c){ const total=calcCharge(c); const r=roundHundred(total); return {...c,totalCalculado:total,totalCobrado:r.rounded,ajusteSiguiente:-r.adjustment,estado:r.rounded-Number(c.abonado||0)<=0?"Pagado":"Pendiente"}; }

function empty(section,data){
  const o={}; fields[section].forEach(f=>o[f]="");
  if(section==="vouchers") Object.assign(o,{folio:`V-${String(data.vouchers.length+1).padStart(6,"0")}`,fecha:todayISO(),medio:"Transferencia",recibidoPor:data.configuracion.administrador});
  if(section==="cobros") Object.assign(o,{periodo:currentPeriod(),fechaVencimiento:`${currentPeriod()}-05`,estado:"Pendiente",ajusteAnterior:0});
  if(section==="boletas") Object.assign(o,{vencimiento:todayISO(),estado:"Pendiente"});
  if(section==="salidas") Object.assign(o,{fechaAviso:todayISO(),fechaEntrega:todayISO(),estado:"En preparación",retencionLuz:0,otrosDescuentos:0});
  return o;
}

function buildInsights(data){
  const debt=data.cobros.filter(c=>calcDebt(c)>0); const missing=data.cobros.filter(c=>!Number(c.luz)); const expiring=data.contratos.filter(c=>c.estado==="Vigente"&&new Date(c.termino)-new Date()<2592e6);
  const out=[];
  if(debt.length) out.push({priority:"Alta",type:"Cobros pendientes",text:`${debt.length} departamento(s) mantienen deuda por ${money(debt.reduce((a,c)=>a+calcDebt(c),0))}.`,target:"cobros"});
  if(missing.length) out.push({priority:"Media",type:"Consumos faltantes",text:`${missing.length} cobro(s) tienen luz en cero. Verifique si falta ingresar la boleta del mes anterior.`,target:"cobros"});
  if(expiring.length) out.push({priority:"Media",type:"Contratos próximos a vencer",text:`${expiring.length} contrato(s) vencen dentro de 30 días.`,target:"contratos"});
  if(data.salidas.some(s=>s.estado!=="Cerrada")) out.push({priority:"Alta",type:"Salidas abiertas",text:"Hay liquidaciones de salida pendientes. Mantenga retenida la estimación de luz hasta recibir la boleta definitiva.",target:"salidas"});
  return out.length?out:[{priority:"Baja",type:"Todo en orden",text:"No hay alertas críticas en los datos registrados.",target:"inicio"}];
}

export default function App(){
  const [data,setData]=useState(()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||seed}catch{return seed}});
  const [active,setActive]=useState("inicio"),[query,setQuery]=useState(""),[editing,setEditing]=useState(null),[sidebar,setSidebar]=useState(false);
  useEffect(()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(data)),[data]);
  const insights=useMemo(()=>buildInsights(data),[data]);
  const totals=useMemo(()=>({deuda:data.cobros.reduce((a,c)=>a+Math.max(0,calcDebt(c)),0),pagado:data.cobros.reduce((a,c)=>a+Number(c.abonado||0),0),ocupados:data.departamentos.filter(d=>d.estado==="Arrendado").length,disponibles:data.departamentos.filter(d=>d.estado==="Disponible").length,ajustes:data.cobros.reduce((a,c)=>a+Number(c.ajusteSiguiente||0),0)}),[data]);

  function save(row){
    let clean={...row}; (fields[active]||[]).forEach(f=>{if(moneyFields.includes(f)||["piso","diaPago"].includes(f)) clean[f]=Number(clean[f]||0)});
    if(active==="cobros") clean=normalizeCharge(clean);
    if(active==="salidas") clean.montoDevolver=Math.max(0,Number(clean.garantia||0)-Number(clean.deudaActual||0)-Number(clean.retencionLuz||0)-Number(clean.otrosDescuentos||0));
    setData(prev=>{const list=prev[active]||[];return {...prev,[active]:clean.id?list.map(r=>r.id===clean.id?clean:r):[{...clean,id:Date.now()},...list]}}); setEditing(null);
  }
  function remove(id){if(confirm("¿Eliminar este registro? Esta acción no se puede deshacer."))setData(p=>({...p,[active]:p[active].filter(r=>r.id!==id)}))}
  function exportBackup(){const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`respaldo-arriendos-${todayISO()}.json`;a.click();URL.revokeObjectURL(a.href)}
  function importBackup(e){const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{setData(JSON.parse(reader.result));alert("Respaldo restaurado correctamente") }catch{alert("El archivo no es válido")}};reader.readAsText(file)}

  const ActiveIcon=sections[active].icon; const rows=!['inicio','asistente'].includes(active)?data[active]||[]:[]; const filtered=rows.filter(r=>JSON.stringify(r).toLowerCase().includes(query.toLowerCase()));
  return <div className="app">
    <aside className={`sidebar ${sidebar?"open":""}`}><div className="brand"><span className="brand-icon"><Building2 size={34}/></span><div><b>{data.configuracion.nombre}</b><small>Datos guardados automáticamente</small></div></div>{Object.entries(sections).map(([k,s])=>{const I=s.icon;return <button className={`nav ${active===k?"active":""}`} key={k} onClick={()=>{setActive(k);setEditing(null);setQuery("");setSidebar(false)}}><I size={22}/>{s.label}</button>})}</aside>
    <main className="main"><header className="hero"><button className="menu" onClick={()=>setSidebar(!sidebar)}><Menu/></button><div className="hero-title"><ActiveIcon size={42}/><div><h1>{sections[active].label}</h1><p>Administración clara, editable y con trazabilidad de redondeos, pagos y salidas.</p></div></div><div className="header-actions"><label className="secondary import-button">Restaurar<input type="file" accept="application/json" onChange={importBackup}/></label><button className="backup" onClick={exportBackup}><Download size={20}/>Respaldar</button></div></header>
    {active==="inicio"&&<><section className="cards"><Stat icon={Building2} title="Departamentos" value="23" note={`${totals.ocupados} ocupados / ${totals.disponibles} disponibles`}/><Stat icon={BadgeDollarSign} title="Pagado" value={money(totals.pagado)} note="Abonos registrados"/><Stat icon={AlertTriangle} title="Deuda pendiente" value={money(totals.deuda)} note="Saldo total"/><Stat icon={WalletCards} title="Ajustes próximos" value={money(totals.ajustes)} note="Diferencias por redondeo"/></section><section className="rounding-banner"><b>Regla de redondeo activa</b><span>Cada cobro se redondea al múltiplo de $100 más cercano. La diferencia se guarda con signo contrario para aplicarla en el siguiente cobro.</span></section><section className="grid2"><div className="panel"><h2>Acciones rápidas</h2><div className="quick"><button onClick={()=>setActive("vouchers")}><ReceiptText/>Emitir voucher</button><button onClick={()=>setActive("cobros")}><WalletCards/>Registrar cobro</button><button onClick={()=>setActive("salidas")}><LogOut/>Preparar salida</button><button onClick={()=>setActive("departamentos")}><Building2/>Editar departamento</button></div></div><AIBox insights={insights} setActive={setActive}/></section></>}
    {active==="asistente"&&<AssistantPanel insights={insights} setActive={setActive}/>} 
    {!['inicio','asistente'].includes(active)&&<section className="panel"><div className="toolbar"><div className="search"><Search size={22}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={`Buscar en ${sections[active].label}`}/></div><button className="primary" onClick={()=>setEditing(empty(active,data))}><Plus size={22}/>Agregar</button></div>{editing&&<Editor section={active} record={editing} onSave={save} onCancel={()=>setEditing(null)} data={data}/>}<div className="tablebox"><table><thead><tr>{fields[active].map(f=><th key={f}>{label(f)}</th>)}{active==="cobros"&&<th>Saldo</th>}<th>Acciones</th></tr></thead><tbody>{filtered.map(r=><tr key={r.id}>{fields[active].map(f=><td key={f}>{value(f,r[f])}</td>)}{active==="cobros"&&<td className={calcDebt(r)>0?"debt":"ok"}>{money(calcDebt(r))}</td>}<td className="actions">{active==="vouchers"&&<button onClick={()=>window.print()}><Printer size={17}/>Imprimir</button>}<button onClick={()=>setEditing(r)}><Pencil size={17}/>Editar</button><button className="danger" onClick={()=>remove(r.id)}><Trash2 size={17}/>Borrar</button></td></tr>)}{!filtered.length&&<tr><td className="empty" colSpan={fields[active].length+2}>Sin registros.</td></tr>}</tbody></table></div></section>}</main>
  </div>
}

function Stat({icon:Icon,title,value,note}){return <div className="stat"><Icon size={36}/><b>{value}</b><span>{title}</span><small>{note}</small></div>}
function AIBox({insights,setActive}){return <div className="panel ai"><h2><BrainCircuit/>Sugerencias</h2>{insights.slice(0,4).map((i,n)=><div className={`insight ${i.priority.toLowerCase()}`} key={n}><strong>{i.priority} · {i.type}</strong><p>{i.text}</p><button onClick={()=>setActive(i.target)}>Revisar</button></div>)}</div>}
function AssistantPanel({insights,setActive}){return <section className="panel"><h2><BrainCircuit/>Asistente administrativo</h2><p className="lead">Prioriza tareas según deudas, consumos faltantes, vencimientos y liquidaciones abiertas.</p>{insights.map((i,n)=><div className={`insight ${i.priority.toLowerCase()}`} key={n}><strong>{i.priority} · {i.type}</strong><p>{i.text}</p><button onClick={()=>setActive(i.target)}>Abrir módulo</button></div>)}</section>}
function Editor({section,record,onSave,onCancel,data}){const[form,setForm]=useState(record);const deptos=data.departamentos.map(d=>d.numero);function update(f,v){const next={...form,[f]:v};const d=data.departamentos.find(x=>x.numero===v);if(d&&["vouchers","cobros","salidas"].includes(section)){next.arrendatario=d.arrendatario;if(section==="salidas"){const c=data.contratos.find(x=>x.departamento===v&&x.estado==="Vigente");next.garantia=c?.garantia||0;next.deudaActual=data.cobros.filter(x=>x.departamento===v).reduce((a,x)=>a+Math.max(0,calcDebt(x)),0)}}setForm(next)}return <div className="editor"><div className="editor-head"><h2>{record.id?"Editar registro":"Nuevo registro"}</h2><button onClick={onCancel}><X/></button></div><div className="formgrid">{fields[section].map(f=><label key={f}><span>{label(f)}</span>{["estado","medio","departamento"].includes(f)?<select value={form[f]??""} onChange={e=>update(f,e.target.value)}><option value="">Seleccione</option>{f==="departamento"&&deptos.map(o=><option key={o}>{o}</option>)}{f==="medio"&&["Efectivo","Transferencia","Débito","Crédito","Otro"].map(o=><option key={o}>{o}</option>)}{f==="estado"&&["Pendiente","Pagado","Vigente","Finalizado","Disponible","Arrendado","En preparación","Esperando boleta de luz","Cerrada"].map(o=><option key={o}>{o}</option>)}</select>:<input type={moneyFields.includes(f)||["piso","diaPago"].includes(f)?"number":dateFields.includes(f)?"date":"text"} value={form[f]??""} readOnly={["totalCalculado","totalCobrado","ajusteSiguiente","montoDevolver"].includes(f)} onChange={e=>update(f,e.target.value)}/>}</label>)}</div><div className="editor-actions"><button className="primary" onClick={()=>onSave(form)}><Save/>Guardar</button><button className="secondary" onClick={onCancel}>Cancelar</button></div></div>}
