import React, { useState } from "react";
import { Presupuesto, QuoteItem } from "../types";
import { generateQuotePDF } from "../utils/pdfGenerator";
import { FilePlus2, Download, Trash2, Plus, FileText, CheckCircle, Clock, AlertCircle, Sparkles, Send } from "lucide-react";
import { exportPresupuestosToExcel } from "../utils/excelExport";

interface PresupuestosTabProps {
  presupuestos: Presupuesto[];
  onAddPresupuesto: (newPres: Omit<Presupuesto, "id" | "montoTotal">) => void;
  onUpdatePresupuestoEstado: (id: string, nuevoEstado: Presupuesto["estado"]) => void;
  onTriggerAlerta: (id: string) => void;
  onClearPresupuestos: () => void;
}

const SERVICIOS_PREDETERMINADOS = [
  { desc: "Instalación de tablero seccional eléctrico (incluye térmicas y disyuntor)", precio: 120000 },
  { desc: "Puesta a tierra reglamentaria (jabalina de cobre, caja de inspección y certificado)", precio: 45000 },
  { desc: "Habilitación e informe técnico de aptitud eléctrica AEA", precio: 30000 },
  { desc: "Detección de falla / fuga eléctrica nocturna y re-aislación", precio: 25000 },
  { desc: "Reemplazo de boca de luz / tomacorrientes (mano de obra por boca)", precio: 5000 },
  { desc: "Tendido de cableado libre de halógeno 2.5mm (metro líneal)", precio: 1200 }
];

export default function PresupuestosTab({
  presupuestos,
  onAddPresupuesto,
  onUpdatePresupuestoEstado,
  onTriggerAlerta,
  onClearPresupuestos
}: PresupuestosTabProps) {
  const [nuevoPresupuestoMode, setNuevoPresupuestoMode] = useState(false);

  // Form states
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteContacto, setClienteContacto] = useState("");
  const [direccionObra, setDireccionObra] = useState("");
  const [notaAdicional, setNotaAdicional] = useState("Válido por 10 días por volatilidad de precios de metales (cobre).");
  
  // List of items state
  const [items, setItems] = useState<Omit<QuoteItem, "id">[]>([
    { descripcion: "Mano de obra para recableado de instalación monofásica", cantidad: 1, precioUnitario: 85000 }
  ]);

  // Temporary single item draft inputs
  const [tempDesc, setTempDesc] = useState("");
  const [tempCant, setTempCant] = useState(1);
  const [tempPrecio, setTempPrecio] = useState(0);

  const addItemToQuote = () => {
    if (!tempDesc.trim()) {
      alert("Por favor escribe una descripción para la tarea o material.");
      return;
    }
    setItems([...items, { descripcion: tempDesc.trim(), cantidad: tempCant, precioUnitario: tempPrecio }]);
    setTempDesc("");
    setTempCant(1);
    setTempPrecio(0);
  };

  const applyTemplateService = (srv: typeof SERVICIOS_PREDETERMINADOS[0]) => {
    setTempDesc(srv.desc);
    setTempPrecio(srv.precio);
  };

  const removeItemFromQuote = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
  };

  const currentYearSuffix = new Date().getFullYear().toString().substring(2);
  const nextNum = (presupuestos.length + 1).toString().padStart(4, "0");
  const defaultPropNum = `P-${nextNum}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNombre.trim()) {
      alert("Introduce el nombre del cliente.");
      return;
    }
    if (items.length === 0) {
      alert("Por favor carga al menos dos tareas o materiales para el presupuesto.");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    // Expiration date + 15 days
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 15);
    const expStr = expDate.toISOString().split("T")[0];

    const itemsWithIds: QuoteItem[] = items.map((it, idx) => ({
      ...it,
      id: `item-${Date.now()}-${idx}`
    }));

    onAddPresupuesto({
      numero: defaultPropNum,
      clienteNombre: clienteNombre.trim(),
      clienteContacto: clienteContacto.trim(),
      direccionObra: direccionObra.trim(),
      fechaEmision: todayStr,
      fechaVencimiento: expStr,
      items: itemsWithIds,
      estado: "Borrador",
      notaAdicional: notaAdicional.trim()
    });

    // Reset All states
    setClienteNombre("");
    setClienteContacto("");
    setDireccionObra("");
    setItems([{ descripcion: "Mano de obra para instalación de luminaria", cantidad: 1, precioUnitario: 15000 }]);
    setNuevoPresupuestoMode(false);
  };

  // Status style helper
  const getStatusBadge = (estado: Presupuesto["estado"]) => {
    switch (estado) {
      case "Pagado":
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">✓ Pagado</span>;
      case "Pendiente de Pago":
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold">⏳ Pendiente</span>;
      case "Aceptado":
        return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold">⚡ Aceptado</span>;
      case "Enviado":
        return <span className="bg-neutral-800 text-neutral-300 border border-neutral-700 px-2 py-0.5 rounded text-[10px] font-medium">✉️ Enviado</span>;
      default:
        return <span className="bg-neutral-900 text-neutral-400 border border-neutral-850 px-2 py-0.5 rounded text-[10px]">📝 Borrador</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Toggle Button */}
      <div className="flex items-center justify-between">
        <h3 className="font-sans font-bold text-sm text-neutral-200">
          📋 Presupuestos y Cotizaciones de Trabajo
        </h3>
        <button
          onClick={() => setNuevoPresupuestoMode(!nuevoPresupuestoMode)}
          className="bg-amber-400 hover:bg-amber-500 text-neutral-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition active:scale-95"
        >
          <FilePlus2 className="h-4 w-4" />
          <span>{nuevoPresupuestoMode ? "Ver Listado" : "Crear Presupuesto"}</span>
        </button>
      </div>

      {nuevoPresupuestoMode ? (
        /* PROFESSIONAL ESTIMATOR BUILDER FORM */
        <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <h4 className="font-sans font-bold text-xs text-amber-400 flex items-center space-x-1.5">
              <span>Nuevo Presupuesto Eléctrico {defaultPropNum}</span>
            </h4>
            <span className="text-[10px] text-neutral-400 font-mono">AEA Reglamentario Habilitado</span>
          </div>

          {/* Customer Core details */}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-neutral-400 uppercase font-mono block mb-1">Nombre Completo del Cliente</label>
              <input
                type="text"
                placeholder="Ej: Clínica Dental o Inmobiliaria Ramos"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className="w-full bg-neutral-850 border border-neutral-700/80 rounded-xl text-neutral-100 px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-neutral-400 uppercase font-mono block mb-1">Contacto (Tel / Email)</label>
                <input
                  type="text"
                  placeholder="Ej: +54 9 11 9999-5555"
                  value={clienteContacto}
                  onChange={(e) => setClienteContacto(e.target.value)}
                  className="w-full bg-neutral-850 border border-neutral-700/80 rounded-xl text-neutral-100 px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 uppercase font-mono block mb-1">Ubicación / Dirección de Obra</label>
                <input
                  type="text"
                  placeholder="Ej: Belgrano 1050, Piso 3"
                  value={direccionObra}
                  onChange={(e) => setDireccionObra(e.target.value)}
                  className="w-full bg-neutral-850 border border-neutral-700/80 rounded-xl text-neutral-100 px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-800 pt-3 space-y-3">
            <span className="text-[11px] font-bold text-neutral-100 block">⚡ Items y Tareas Eléctricas</span>

            {/* QUICK SELECTION PRESET JOBS FOR FAST ESTIMATING */}
            <div className="p-2.5 bg-neutral-850 border border-neutral-800 rounded-xl space-y-2">
              <span className="text-[9.5px] text-neutral-400 font-bold uppercase tracking-wider block">Plantillas de Tareas Frecuentes:</span>
              <div className="flex flex-wrap gap-1.5 max-h-[90px] overflow-y-auto">
                {SERVICIOS_PREDETERMINADOS.map((srv, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => applyTemplateService(srv)}
                    className="text-[9.5px] text-amber-300 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 p-1.5 rounded transition text-left shrink-0 max-w-[280px] truncate"
                  >
                    + {srv.desc.split(" (")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* DYNAMIC ITEM LINE EDITOR BOX */}
            <div className="bg-neutral-850 p-3 rounded-xl border border-neutral-850 space-y-2.5">
              <div>
                <label className="text-[9px] text-neutral-400 uppercase font-mono block mb-0.5">Tarea / Material comprado</label>
                <input
                  type="text"
                  placeholder="Ej: Kit Llave Termomagnética 2x25A Siemens + Disyuntor Diferencial 2x40A"
                  value={tempDesc}
                  onChange={(e) => setTempDesc(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] text-neutral-400 uppercase font-mono block mb-0.5">Cantidad</label>
                  <input
                    type="number"
                    value={tempCant}
                    onChange={(e) => setTempCant(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[9px] text-neutral-400 uppercase font-mono block mb-0.5">Precio Unit. ($)</label>
                  <input
                    type="number"
                    value={tempPrecio === 0 ? "" : tempPrecio}
                    onChange={(e) => setTempPrecio(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0.00"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addItemToQuote}
                    className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold py-1.5 rounded-lg border border-amber-500/20 text-xs transition flex items-center justify-center space-x-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* CURRENT ITEMS TABLE PREVIEW */}
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-neutral-850 rounded-xl border border-neutral-800 text-xs">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-neutral-200 truncate font-semibold">{item.descripcion}</p>
                    <p className="text-[10px] text-neutral-400 font-mono">
                      Cant: {item.cantidad} x ${item.precioUnitario.toLocaleString("es-AR")}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-amber-400 text-xs flex-shrink-0">
                      ${(item.cantidad * item.precioUnitario).toLocaleString("es-AR")}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItemFromQuote(idx)}
                      className="text-neutral-500 hover:text-red-400 transition p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nota de validez y pie */}
          <div>
            <label className="text-[10px] text-neutral-400 uppercase font-mono block mb-1">Notas del Presupuesto (Validez y Plazos)</label>
            <input
              type="text"
              value={notaAdicional}
              onChange={(e) => setNotaAdicional(e.target.value)}
              className="w-full bg-neutral-850 border border-neutral-700/80 rounded-xl text-neutral-100 px-3 py-2 text-xs focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] text-neutral-400 uppercase font-mono block">Monto Total Estimado</span>
              <span className="text-xl font-bold font-mono text-amber-400">
                ${calculateTotal().toLocaleString("es-AR")}
              </span>
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-amber-400 hover:bg-amber-500 text-neutral-900 font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                Crear Borrador
              </button>
              <button
                type="button"
                onClick={() => setNuevoPresupuestoMode(false)}
                className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-semibold px-4 py-2 rounded-xl text-xs transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* REGISTERED LIST OF DRAFTED QUOTES */
        <div className="space-y-2.5">
          {presupuestos.length > 0 && (
            <div className="flex items-center justify-between bg-neutral-900 border border-neutral-850 p-2.5 px-3.5 rounded-2xl">
              <span className="text-[10px] text-neutral-400 font-mono tracking-wider uppercase">Listado de Presupuestos</span>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => exportPresupuestosToExcel(presupuestos)}
                  type="button"
                  className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold font-mono tracking-wider transition flex items-center space-x-1 uppercase"
                  title="Exportar Todos los Presupuestos a Excel"
                >
                  <Download className="h-3 w-3" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={onClearPresupuestos}
                  type="button"
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-red-500/10 text-neutral-400 hover:text-red-400 border border-neutral-700 hover:border-red-500/15 rounded-lg text-[10px] font-bold font-mono tracking-wider transition flex items-center space-x-1 uppercase"
                  title="Limpiar presupuestos del mes"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Limpiar</span>
                </button>
              </div>
            </div>
          )}

          {presupuestos.length === 0 ? (
            <div className="text-center py-10 bg-neutral-900 border border-neutral-800 rounded-2xl text-neutral-500 font-mono text-xs">
              📂 No se ha estructurado ningún presupuesto.
            </div>
          ) : (
            presupuestos.slice().reverse().map((pres) => (
              <div
                key={pres.id}
                className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl hover:border-neutral-700 transition space-y-3 shadow"
              >
                {/* Header of proposal block */}
                <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-neutral-300 bg-neutral-800 px-2 py-0.5 rounded">
                      {pres.numero}
                    </span>
                    <h4 className="text-xs font-bold text-neutral-100 truncate max-w-[150px]">
                      {pres.clienteNombre}
                    </h4>
                  </div>
                  {getStatusBadge(pres.estado)}
                </div>

                {/* Details layout */}
                <div className="grid grid-cols-2 gap-2 text-[10.5px] text-neutral-400 font-sans leading-relaxed">
                  <p>🏗️ <strong>Obra:</strong> {pres.direccionObra}</p>
                  <p className="text-right">📆 <strong>Emisión:</strong> {pres.fechaEmision}</p>
                  <p>⚡ <strong>Items:</strong> {pres.items.length} tareas cargadas</p>
                  <p className="text-right">⌛ <strong>Vencimiento:</strong> {pres.fechaVencimiento}</p>
                  <p className="col-span-2 border-t border-neutral-800/40 pt-1 mt-0.5 text-neutral-500 font-mono text-[9px]">
                    ✍️ <strong>Emitido por:</strong> <strong className="text-amber-400 font-bold">{pres.registradoPor || "Demo"}</strong>
                  </p>
                </div>

                {/* Pricing / CTA row */}
                <div className="bg-neutral-850 p-2.5 rounded-xl flex items-center justify-between border border-neutral-800">
                  <div className="text-left">
                    <span className="text-[9px] uppercase font-mono tracking-wider text-neutral-500">Monto Total de Obra</span>
                    <span className="text-[13.5px] font-mono font-bold text-amber-400 block">${pres.montoTotal.toLocaleString("es-AR")}</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {/* Action trigger: Download PDF */}
                    <button
                      onClick={() => generateQuotePDF(pres)}
                      className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 hover:text-amber-300 border border-amber-500/10 rounded-lg text-xs flex items-center space-x-1 transition"
                      title="Descargar Presupuesto en PDF"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold">PDF</span>
                    </button>

                    {/* Status updater dropdown or button */}
                    {pres.estado !== "Pagado" ? (
                      <button
                        onClick={() => {
                          const steps: Presupuesto["estado"][] = ["Borrador", "Enviado", "Aceptado", "Pendiente de Pago", "Pagado"];
                          const curIdx = steps.indexOf(pres.estado);
                          const nextState = steps[(curIdx + 1) % steps.length];
                          onUpdatePresupuestoEstado(pres.id, nextState);
                          if (nextState === "Pendiente de Pago") {
                            onTriggerAlerta(pres.id);
                          }
                        }}
                        className="px-2 py-1.5 bg-amber-400 hover:bg-amber-500 text-neutral-950 font-bold rounded-lg text-[10.5px] transition"
                      >
                        Avanzar Estado
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10 font-bold">
                        Completado ✓
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
