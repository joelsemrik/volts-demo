import React, { useState, useRef } from "react";
import { Gasto } from "../types";
import { Camera, Image as ImageIcon, Sparkles, Plus, Loader, Trash2, Calendar, FileText, CheckCircle2, Download } from "lucide-react";
import { exportGastosToExcel } from "../utils/excelExport";

interface GastosTabProps {
  gastos: Gasto[];
  onAddGasto: (newGasto: Omit<Gasto, "id">) => void;
  onDeleteGasto: (id: string) => void;
  onClearGastos: () => void;
}

const SPINNER_MESSAGES = [
  "⚡ Escaneando circuito del ticket por IA...",
  "📐 Identificando materiales y repuestos aislantes...",
  "💸 Verificando tensiones y sumas en factura...",
  "⚙️ Clasificando en categoría operativa de electricista...",
  "✔️ Extrayendo fecha y proveedor registrado..."
];

export default function GastosTab({ gastos, onAddGasto, onDeleteGasto, onClearGastos }: GastosTabProps) {
  const [monto, setMonto] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [categoria, setCategoria] = useState<Gasto["categoria"]>("Materiales Eléctricos");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [descripcion, setDescripcion] = useState("");
  const [imagenRecibo, setImagenRecibo] = useState<string | null>(null);

  const [cargandoIA, setCargandoIA] = useState(false);
  const [msgIA, setMsgIA] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rotate spinner messages for engaging UX
  const startLoadingMessages = () => {
    let index = 0;
    setMsgIA(SPINNER_MESSAGES[0]);
    const interval = setInterval(() => {
      index = (index + 1) % SPINNER_MESSAGES.length;
      setMsgIA(SPINNER_MESSAGES[index]);
    }, 2000);
    return interval;
  };

  // Convert uploaded image to Base64 for receipt parsing and preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagenRecibo(base64String);
      setMostrarForm(true);
    };
    reader.readAsDataURL(file);
  };

  // Trigger file dialog
  const triggerCamera = () => {
    fileInputRef.current?.click();
  };

  // Call server-side Gemini API for receipt parsing and category identification
  const parseReceiptWithIA = async () => {
    if (!imagenRecibo) {
      alert("Por favor captura o sube una imagen de ticket primero.");
      return;
    }

    setCargandoIA(true);
    const msgInterval = startLoadingMessages();

    try {
      const response = await fetch("/api/classify-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image: imagenRecibo })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Fallo en el servicio de análisis.");
      }

      const result = await response.json();
      
      // Auto-populate form
      if (result.amount) setMonto(result.amount.toString());
      if (result.provider) setProveedor(result.provider);
      if (result.category) setCategoria(result.category as Gasto["categoria"]);
      if (result.date) setFecha(result.date);
      if (result.description) setDescripcion(result.description);

      alert("🎉 ¡Ticket clasificado con éxito por Gemini AI!");
    } catch (error: any) {
      console.error(error);
      alert("No se pudo clasificar el ticket por IA automáticamente: " + error.message + "\nPuedes ingresar los datos manualmente.");
    } finally {
      clearInterval(msgInterval);
      setCargandoIA(false);
      setMsgIA("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!monto || isNaN(Number(monto)) || Number(monto) <= 0) {
      alert("Por favor introduce un monto de gasto válido.");
      return;
    }
    if (!proveedor.trim()) {
      alert("Introduce el nombre del proveedor o comercio.");
      return;
    }

    onAddGasto({
      monto: Number(monto),
      proveedor: proveedor.trim(),
      categoria,
      fecha,
      descripcion: descripcion.trim() || `Compra en ${proveedor}`,
      imagenRecibo: imagenRecibo || undefined,
      automaticoPorIA: cargandoIA || !!monto && !!descripcion // Mark as parsed
    });

    // Reset Form
    setMonto("");
    setProveedor("");
    setDescripcion("");
    setImagenRecibo(null);
    setFecha(new Date().toISOString().split("T")[0]);
    setMostrarForm(false);
  };

  const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);

  return (
    <div className="space-y-4">
      {/* Visual header stats for bills */}
      <div className="bg-gradient-to-br from-neutral-900 to-red-950/20 border border-neutral-800 rounded-2xl p-4 flex justify-between items-center shadow-lg relative overflow-hidden">
        <div>
          <span className="text-xs text-red-400 uppercase font-mono tracking-widest block">Gastos Operativos del Mes</span>
          <span className="text-3xl font-bold text-red-500 tracking-tight block mt-1">
            ${totalGastos.toLocaleString("es-AR")}
          </span>
          <span className="text-[11px] text-neutral-400 block mt-0.5 font-mono">
            {gastos.length} facturas y tickets guardados
          </span>
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-neutral-800 hover:bg-neutral-750 text-neutral-100 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1 border border-neutral-700 transition shadow-sm active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>{mostrarForm ? "Cerrar" : "Nuevo Gasto"}</span>
        </button>
      </div>

      {/* QUICK ACTIONS FOR RECEIPT CAPTURE (TACTILE FIRST) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-center space-y-3">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10">
          <Camera className="h-6 w-6 text-amber-400" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-neutral-200">
            📸 Adjuntar Recibo Eléctrico
          </h4>
          <p className="text-[11px] text-neutral-400 mt-1 max-w-xs mx-auto leading-relaxed">
            Saca una foto a tu ticket de materiales (térmicas, cables o nafta) o sube el PDF de compra para clasificar los montos de forma automática mediante Inteligencia Artificial.
          </p>
        </div>

        <div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={triggerCamera}
            className="w-full bg-amber-400 hover:bg-amber-500 text-neutral-900 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center space-x-2"
          >
            <ImageIcon className="h-4 w-4" />
            <span>Sacar Foto / Subir Recibo</span>
          </button>
        </div>

        {imagenRecibo && (
          <div className="p-3 bg-neutral-800/60 rounded-xl flex items-center justify-between border border-neutral-700 animate-fade-in">
            <div className="flex items-center space-x-2.5">
              <img
                src={imagenRecibo}
                alt="Miniatura ticket"
                className="w-12 h-12 rounded object-cover border border-neutral-600 flex-shrink-0"
              />
              <div className="text-left">
                <span className="text-[11px] text-neutral-300 font-semibold block">Recibo listo para procesar</span>
                <span className="text-[9px] text-neutral-400 font-mono block">Tamaño adecuado detectado</span>
              </div>
            </div>
            
            <button
              onClick={parseReceiptWithIA}
              disabled={cargandoIA}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 hover:text-amber-300 border border-amber-500/30 font-bold px-3 py-1.5 rounded-lg text-[10.5px] transition flex items-center space-x-1 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{cargandoIA ? "Analizando..." : "Clasificar por IA"}</span>
            </button>
          </div>
        )}
      </div>

      {/* SPINNER CAPTURE PROGRESS OVERLAY */}
      {cargandoIA && (
        <div className="p-4 bg-neutral-900 border border-amber-500/30 rounded-2xl flex flex-col items-center justify-center space-y-3 animate-pulse text-center">
          <Loader className="h-7 w-7 text-amber-400 animate-spin" />
          <div className="space-y-1">
            <span className="text-xs font-bold text-neural-100 block">Procesando con Gemini AI</span>
            <span className="text-[11px] text-amber-300 block font-mono">
              {msgIA}
            </span>
          </div>
        </div>
      )}

      {/* NEW EXPENSE FORM */}
      {(mostrarForm || imagenRecibo) && (
        <form
          onSubmit={handleSubmit}
          className="bg-neutral-900 border border-red-500/10 rounded-2xl p-4 shadow-xl space-y-4 animate-fade-in"
        >
          <h3 className="font-sans font-bold text-sm text-neutral-100 flex items-center space-x-1.5 border-b border-neutral-800 pb-2">
            <FileText className="h-4 w-4 text-red-500" />
            <span>Detalles del Comprobante Eléctrico</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-neutral-400 uppercase font-mono block mb-1">Monto de Gasto ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-neutral-500 text-sm">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-red-500 font-mono"
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
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-neutral-400 uppercase font-mono block mb-1">Comercio / Proveedor</label>
              <input
                type="text"
                placeholder="Ej: Electro Oeste SRL"
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 px-3 py-2 text-xs focus:outline-none focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="text-[10px] text-neutral-400 uppercase font-mono block mb-1">Categoría</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as any)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 px-3 py-2 text-xs focus:outline-none focus:border-red-500"
              >
                <option value="Materiales Eléctricos">🔌 Materiales Eléctricos</option>
                <option value="Herramientas">🛠️ Herramientas</option>
                <option value="Transporte y Combustible">⛽ Transporte / Nafta</option>
                <option value="E.P.P. y Seguridad">🪖 Botas/EPP Dieléctrico</option>
                <option value="Servicios y Oficina">📞 Celular / Papelería</option>
                <option value="Otros Gastos">📦 Otros Gastos</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-neutral-400 uppercase font-mono block mb-1">Descripción / Conceptos adquiridos</label>
            <input
              type="text"
              placeholder="Ej: Térmicas tubulares 20A y cables cobre vulcanizado"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 px-3 py-2 text-xs focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-red-500 hover:bg-red-650 text-white font-bold py-2.5 rounded-xl text-xs transition"
            >
              Guardar Gasto
            </button>
            <button
              type="button"
              onClick={() => {
                setMostrarForm(false);
                setImagenRecibo(null);
              }}
              className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-semibold px-4 py-2.5 rounded-xl text-xs transition"
            >
              Descartar
            </button>
          </div>
        </form>
      )}

      {/* REGISTERED EXPENSES LIST */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
        <h3 className="font-sans font-semibold text-sm text-neutral-100 mb-3 flex items-center justify-between border-b border-neutral-800 pb-2 flex-wrap gap-2">
          <div className="flex items-center space-x-1.5">
            <ImageIcon className="h-4 w-4 text-red-500" />
            <span>Detalle de Egresos Operativos</span>
          </div>

          {gastos.length > 0 && (
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => exportGastosToExcel(gastos)}
                className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold font-mono tracking-wider transition flex items-center space-x-1 uppercase"
                title="Descargar Planilla Excel / CSV de Gastos"
              >
                <Download className="h-3 w-3" />
                <span>Excel</span>
              </button>
              <button
                onClick={onClearGastos}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-red-500/10 text-neutral-400 hover:text-red-400 border border-neutral-700 hover:border-red-500/20 rounded-lg text-[10px] font-bold font-mono tracking-wider transition flex items-center space-x-1 uppercase"
                title="Limpiar todos los gastos del mes"
              >
                <Trash2 className="h-3 w-3" />
                <span>Limpiar</span>
              </button>
            </div>
          )}
        </h3>

        {gastos.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 font-mono text-xs">
            💸 No hay gastos operativos guardados todavía.
          </div>
        ) : (
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {gastos.slice().reverse().map((gast) => (
              <div
                key={gast.id}
                className="p-3 bg-neutral-800/40 border border-neutral-800/80 rounded-xl flex items-center justify-between hover:bg-neutral-850 transition"
              >
                <div className="space-y-1 flex-1 min-w-0 pr-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] text-red-400 bg-red-400/10 border border-red-500/20 px-1.5 py-0.5 rounded font-mono font-medium">
                      {gast.categoria}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono flex items-center">
                      <Calendar className="h-3 w-3 mr-0.5" />
                      {gast.fecha}
                    </span>
                    {gast.automaticoPorIA && (
                      <span className="text-[9px] text-amber-300 bg-amber-500/5 border border-amber-500/10 px-1 py-0.2 rounded flex items-center">
                        <Sparkles className="h-2 w-2 mr-0.5" />
                        IA
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-neutral-100 uppercase tracking-wide">{gast.proveedor}</h4>
                  <p className="text-[11px] text-neutral-400 leading-tight line-clamp-1">{gast.descripcion}</p>
                  <p className="text-[9.5px] text-neutral-500 font-mono flex items-center mt-0.5">
                    Registrado por: <strong className="text-amber-400 ml-1.5">{gast.registradoPor || "Demo"}</strong>
                  </p>
                </div>

                <div className="flex items-center space-x-3 flex-shrink-0">
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-red-400 block">
                      -${gast.monto.toLocaleString("es-AR")}
                    </span>
                    {gast.imagenRecibo && (
                      <span className="text-[8.5px] text-amber-400 border border-amber-500/20 bg-amber-505/10 rounded px-1 font-mono inline-block mt-0.5">
                        Ver recibo d.
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("¿Deseas eliminar este registro de gasto?")) {
                        onDeleteGasto(gast.id);
                      }
                    }}
                    className="p-1.5 bg-neutral-800 hover:bg-red-500/10 text-neutral-400 hover:text-red-500 rounded-lg transition"
                    title="Eliminar gasto"
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
