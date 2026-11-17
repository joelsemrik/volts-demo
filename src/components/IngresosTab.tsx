import React, { useState } from "react";
import { Ingreso } from "../types";
import { Plus, Flame, Zap, Award, Edit, Trash2, Calendar, DollarSign, Wallet, Download } from "lucide-react";
import { exportIngresosToExcel } from "../utils/excelExport";

interface IngresosTabProps {
  ingresos: Ingreso[];
  onAddIngreso: (newIngreso: Omit<Ingreso, "id">) => void;
  onDeleteIngreso: (id: string) => void;
  onClearIngresos: () => void;
}

const PRESETS = [
  { label: "⚡ Guardia Urgencia 24h", monto: 45000, categoria: "Servicio de Urgencia 24h", desc: "Servicio de urgencia por falla eléctrica" },
  { label: "🔌 Cambio Térmica / Disyuntor", monto: 18000, categoria: "Reparación / Cambio de Componente", desc: "Cambio de llave térmica en tablero seccional" },
  { label: "📐 Protocolo Puesta a Tierra", monto: 35000, categoria: "Certificaciones y Leyes", desc: "Medición de jabalina, certificado AEA y protocolo" },
  { label: "🛠️ Mano de Obra (Media Jornada)", monto: 25000, categoria: "Instalación Eléctrica", desc: "4 horas de trabajo de instalación general" },
];

export default function IngresosTab({ ingresos, onAddIngreso, onDeleteIngreso, onClearIngresos }: IngresosTabProps) {
  const [monto, setMonto] = useState("");
  const [cliente, setCliente] = useState("");
  const [categoria, setCategoria] = useState<Ingreso["categoria"]>("Instalación Eléctrica");
  const [formaPago, setFormaPago] = useState<Ingreso["formaPago"]>("Efectivo");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [notas, setNotas] = useState("");

  const [mostrarForm, setMostrarForm] = useState(false);

  // Apply a preset to the form
  const applyPreset = (preset: typeof PRESETS[0]) => {
    setMonto(preset.monto.toString());
    setCategoria(preset.categoria as Ingreso["categoria"]);
    setNotas(preset.desc);
    setCliente("Cliente particular");
    setMostrarForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!monto || isNaN(Number(monto)) || Number(monto) <= 0) {
      alert("Por favor introduce un monto válido.");
      return;
    }
    if (!cliente.trim()) {
      alert("Introduce el nombre del cliente o ubicación.");
      return;
    }

    onAddIngreso({
      monto: Number(monto),
      cliente: cliente.trim(),
      categoria,
      formaPago,
      fecha,
      notas: notas.trim() || undefined
    });

    // Reset Form
    setMonto("");
    setCliente("");
    setNotas("");
    setFecha(new Date().toISOString().split("T")[0]);
    setMostrarForm(false);
  };

  const totalSuma = ingresos.reduce((sum, ing) => sum + ing.monto, 0);

  return (
    <div className="space-y-4">
      {/* Visual header stats card */}
      <div className="bg-gradient-to-br from-neutral-900 to-amber-950/20 border border-amber-500/20 rounded-2xl p-4 flex justify-between items-center shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-4 -translate-y-4">
          <Zap className="h-40 w-40 text-amber-500" />
        </div>
        <div>
          <span className="text-xs text-amber-200 uppercase font-mono tracking-widest block">Ingresos Registrados</span>
          <span className="text-3xl font-bold text-amber-400 tracking-tight block mt-1">
            ${totalSuma.toLocaleString("es-AR")}
          </span>
          <span className="text-[11px] text-neutral-400 block mt-0.5 font-mono">
            Total de {ingresos.length} transacciones registradas de ganancias
          </span>
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-amber-400 hover:bg-amber-500 text-neutral-900 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1 transition shadow-md active:scale-95"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>{mostrarForm ? "Cerrar" : "Nuevo Ingreso"}</span>
        </button>
      </div>

      {/* QUICK ACCESSIBILITY PRESETS FOR MOBILE FIELD WORK */}
      {!mostrarForm && (
        <div className="bg-neutral-900 p-4 border border-neutral-800 rounded-2xl space-y-2">
          <span className="text-xs text-neutral-400 font-bold block mb-1">
            ⚡ Ingreso Rápido (Toca un botón para registrar rápido)
          </span>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className="p-3 bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/60 hover:border-amber-500/30 text-left rounded-xl transition flex flex-col justify-between h-[76px] group active:scale-95"
              >
                <span className="text-[11px] font-bold text-neutral-200 line-clamp-1 group-hover:text-amber-300">
                  {p.label}
                </span>
                <span className="text-sm font-mono font-bold text-amber-400 mt-1">
                  ${p.monto.toLocaleString("es-AR")}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* NEW INCOME FORM */}
      {mostrarForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-neutral-900 border border-amber-500/20 rounded-2xl p-4 shadow-xl space-y-4 animate-fade-in"
        >
          <h3 className="font-sans font-bold text-sm text-neutral-100 flex items-center space-x-1.5 border-b border-neutral-800 pb-2">
            <Plus className="h-4 w-4 text-amber-400 stroke-[3.5]" />
            <span>Registrar Nueva Ganancia Diaria</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-neutral-400 uppercase font-mono block mb-1">Monto ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-neutral-500 text-sm">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-amber-400 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-neutral-400 uppercase font-mono block mb-1">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-neutral-400 uppercase font-mono block mb-1">Cliente / Locación de Obra</label>
            <input
              type="text"
              placeholder="Ej: Consorcio Rivadavia 204 o Juan Pérez"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-neutral-400 uppercase font-mono block mb-1">Categoría</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as any)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="Instalación Eléctrica">👷 Instalación General</option>
                <option value="Servicio de Urgencia 24h">🚨 Urgencias 24h</option>
                <option value="Mantenimiento Preventivo">🔧 Mantenimiento</option>
                <option value="Certificaciones y Leyes">📝 Certificaciones / Protocolo</option>
                <option value="Reparación / Cambio de Componente">🔌 Reparaciones</option>
                <option value="Otros">📦 Otros Ingresos</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-neutral-400 uppercase font-mono block mb-1">Método de Cobro Out</label>
              <select
                value={formaPago}
                onChange={(e) => setFormaPago(e.target.value as any)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="Efectivo">💵 Efectivo / Caja</option>
                <option value="Transferencia">🏦 Transferencia Bancaria</option>
                <option value="Mercado Pago">📱 Mercado Pago</option>
                <option value="Tarjeta">💳 Tarjeta Crédito/Débito</option>
                <option value="Otro">⚙️ Otro Medio</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-neutral-400 uppercase font-mono block mb-1">Notas / Detalle de Servicios</label>
            <textarea
              placeholder="Ej: Cableado de luminarias led y sustitución de térmicas quemadas por cortocircuito."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 px-3 py-2 text-xs h-16 resize-none focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-amber-400 hover:bg-amber-500 text-neutral-900 font-bold py-2.5 rounded-xl text-xs transition"
            >
              Guardar Ganancia
            </button>
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-semibold px-4 py-2.5 rounded-xl text-xs transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* INCOME LOGS LIST */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
        <h3 className="font-sans font-semibold text-sm text-neutral-100 mb-3 flex items-center justify-between border-b border-neutral-800 pb-2 flex-wrap gap-2">
          <div className="flex items-center space-x-1.5">
            <Wallet className="h-4 w-4 text-emerald-400" />
            <span>Historial Diario de Ganancias</span>
          </div>

          {ingresos.length > 0 && (
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => exportIngresosToExcel(ingresos)}
                className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold font-mono tracking-wider transition flex items-center space-x-1 uppercase"
                title="Descargar Planilla Excel / CSV"
              >
                <Download className="h-3 w-3" />
                <span>Excel</span>
              </button>
              <button
                onClick={onClearIngresos}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-red-500/10 text-neutral-400 hover:text-red-400 border border-neutral-700 hover:border-red-500/20 rounded-lg text-[10px] font-bold font-mono tracking-wider transition flex items-center space-x-1 uppercase"
                title="Limpiar registros para empezar nuevo mes"
              >
                <Trash2 className="h-3 w-3" />
                <span>Limpiar</span>
              </button>
            </div>
          )}
        </h3>

        {ingresos.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 font-mono text-xs">
            📭 No hay ingresos registrados aún.
          </div>
        ) : (
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {ingresos.slice().reverse().map((ing) => (
              <div
                key={ing.id}
                className="p-3 bg-neutral-800/40 border border-neutral-800/80 rounded-xl flex items-center justify-between hover:bg-neutral-850 transition"
              >
                <div className="space-y-1 flex-1 min-w-0 pr-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded font-medium">
                      {ing.categoria}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono flex items-center">
                      <Calendar className="h-3 w-3 mr-0.5" />
                      {ing.fecha}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-neutral-100 truncate">{ing.cliente}</h4>
                  {ing.notas && <p className="text-[11px] text-neutral-400 line-clamp-1">{ing.notas}</p>}
                  <p className="text-[10px] text-neutral-500 italic flex flex-wrap items-center gap-x-1.5 mt-0.5">
                    <span>Cobrado mediante: <strong className="text-neutral-300 font-sans">{ing.formaPago}</strong></span>
                    <span className="text-neutral-600">•</span>
                    <span>Registrado por: <strong className="text-amber-400 font-mono">{ing.registradoPor || "Demo"}</strong></span>
                  </p>
                </div>

                <div className="flex items-center space-x-3 flex-shrink-0">
                  <span className="font-mono font-bold text-sm text-emerald-400">
                    +${ing.monto.toLocaleString("es-AR")}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm("¿Estás seguro de eliminar este ingreso?")) {
                        onDeleteIngreso(ing.id);
                      }
                    }}
                    className="p-1.5 bg-neutral-800 hover:bg-red-500/10 text-neutral-400 hover:text-red-500 rounded-lg transition"
                    title="Eliminar registro"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
