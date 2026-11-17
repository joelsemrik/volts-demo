import React, { useState } from "react";
import { Ingreso, Gasto, Presupuesto } from "../types";
import { TrendingUp, TrendingDown, DollarSign, Download, Printer, ShieldCheck, Database, Calendar } from "lucide-react";

interface FlujoCajaTabProps {
  ingresos: Ingreso[];
  gastos: Gasto[];
  presupuestos: Presupuesto[];
}

export default function FlujoCajaTab({ ingresos, gastos, presupuestos }: FlujoCajaTabProps) {
  const [selectedMonth, setSelectedMonth] = useState("2026-06");

  // Sums
  const totalIngresos = ingresos.reduce((s, i) => s + i.monto, 0);
  const totalGastos = gastos.reduce((s, g) => s + g.monto, 0);
  const balanceNeto = totalIngresos - totalGastos;

  // Pending Payments from Presupuestos
  const cobrarPendiente = presupuestos
    .filter((p) => p.estado === "Pendiente de Pago")
    .reduce((s, p) => s + p.montoTotal, 0);

  // Category counts for expenses
  const gastadoPorCategoria = gastos.reduce((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] || 0) + g.monto;
    return acc;
  }, {} as Record<string, number>);

  // Export full transactional log to CSV
  const exportToCSV = () => {
    let csvContent = "\uFEFF"; // UTF-8 BOM for Excel Spanish accent safety
    csvContent += "TIPO;FECHA;COMERCIO / RECEPTOR;CATEGORIA;METODO;MONTO;DESCRIPCION\n";

    // Add Incomes
    ingresos.forEach((i) => {
      csvContent += `INGRESO;${i.fecha};"${i.cliente.replace(/"/g, '""')}";"${i.categoria}";"${i.formaPago}";${i.monto};"${(i.notas || "Venta de servicio").replace(/"/g, '""')}"\n`;
    });

    // Add Expenses
    gastos.forEach((g) => {
      csvContent += `EGRESO;${g.fecha};"${g.proveedor.replace(/"/g, '""')}";"${g.categoria}";"Recibo adjunto";${g.monto};"${g.descripcion.replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Mensual_Flujo_Caja_${selectedMonth}_Electricista.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SVG Chart Height calculation
  const maxVal = Math.max(totalIngresos, totalGastos, 10000);
  const scale = (val: number) => (val / maxVal) * 110; // Out of 120 max height

  const revenueHeight = scale(totalIngresos);
  const expenseHeight = scale(totalGastos);

  return (
    <div className="space-y-4">
      {/* Metrics board */}
      <div className="grid grid-cols-2 gap-3">
        {/* Metric 1 */}
        <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-400">Total Ingresos</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-xl font-bold text-neutral-100 font-mono">
              +${totalIngresos.toLocaleString("es-AR")}
            </span>
            <span className="text-[9px] text-emerald-400 block mt-1">✓ Caja Activa</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-400">Total Gastos</span>
            <TrendingDown className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <span className="text-xl font-bold text-neutral-100 font-mono">
              -${totalGastos.toLocaleString("es-AR")}
            </span>
            <span className="text-[9px] text-red-400 block mt-1">⚡ Inversión Operativa</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-400">Balance Neto</span>
            <DollarSign className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <span className={`text-xl font-bold font-mono ${balanceNeto >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {balanceNeto >= 0 ? "+" : ""}${balanceNeto.toLocaleString("es-AR")}
            </span>
            <span className="text-[9.5px] text-neutral-400 block mt-1">Margen de Ganancia Real</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-400">Por Cobrar</span>
            <span className="text-[11px] font-bold text-amber-400 font-sans">⏳ Pendiente</span>
          </div>
          <div>
            <span className="text-xl font-bold text-amber-400 font-mono">
              ${cobrarPendiente.toLocaleString("es-AR")}
            </span>
            <span className="text-[9.5px] text-neutral-400 block mt-1">Poli-Presupuestos Emitidos</span>
          </div>
        </div>
      </div>

      {/* RENDER DYNAMIC SVG CHART OF INCOME VS OUTCOME */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2">
          <h3 className="text-xs font-bold font-sans text-neutral-100">
            📊 Gráfico Comparativo Mensual (Flujo de Caja)
          </h3>
          <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
            Junio 2026
          </span>
        </div>

        <div className="flex items-end justify-center space-x-12 py-4 h-40">
          {/* Revenues Bar */}
          <div className="flex flex-col items-center space-y-2">
            <div className="relative w-12 flex items-end justify-center bg-neutral-800 rounded-lg overflow-hidden" style={{ height: "120px" }}>
              <div
                className="w-full bg-emerald-400/95 duration-500 transition-all rounded-b-lg border-t-2 border-emerald-300"
                style={{ height: `${revenueHeight}px` }}
              />
            </div>
            <span className="text-[10px] font-bold text-neutral-300">Ganancias</span>
            <span className="text-[9.5px] font-mono text-emerald-400 font-semibold">${totalIngresos.toLocaleString("es-AR")}</span>
          </div>

          {/* Expenses Bar */}
          <div className="flex flex-col items-center space-y-2">
            <div className="relative w-12 flex items-end justify-center bg-neutral-800 rounded-lg overflow-hidden" style={{ height: "120px" }}>
              <div
                className="w-full bg-red-400/95 duration-500 transition-all rounded-b-lg border-t-2 border-red-300"
                style={{ height: `${expenseHeight}px` }}
              />
            </div>
            <span className="text-[10px] font-bold text-neutral-300">Gastos</span>
            <span className="text-[9.5px] font-mono text-red-400 font-semibold">${totalGastos.toLocaleString("es-AR")}</span>
          </div>
        </div>
      </div>

      {/* CATEGORY SPENDING PIE / BAR ANALYSIS */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
        <h3 className="text-xs font-bold font-sans text-neutral-100 mb-3 border-b border-neutral-800 pb-2">
          🔌 Distribución de Gastos Operativos
        </h3>

        {Object.keys(gastadoPorCategoria).length === 0 ? (
          <div className="text-center py-6 text-neutral-500 font-mono text-xs">
            No hay gastos clasificados aún.
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(gastadoPorCategoria).map(([cat, val]) => {
              const weight = totalGastos > 0 ? (val / totalGastos) * 100 : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-300">{cat}</span>
                    <span className="text-neutral-400 font-mono font-bold">
                      ${val.toLocaleString("es-AR")} ({weight.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${weight}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EXPORTS CARD ACTION PANEL */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
        <div>
          <h4 className="text-xs font-bold text-neutral-100 flex items-center space-x-1">
            <Database className="h-4 w-4 text-amber-400" />
            <span>Exportación Contable y Rendimiento</span>
          </h4>
          <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
            Genera e instrumenta reportes para entregar a tu contador o para tu propio control operativo de material facturado.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={exportToCSV}
            className="p-2.5 bg-amber-400 hover:bg-amber-500 text-neutral-950 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-95"
          >
            <Download className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Descargar CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-100 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border border-neutral-700 transition active:scale-95"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimir Resumen</span>
          </button>
        </div>

        {/* Professional Certification footnote block */}
        <div className="p-2 bg-neutral-850 rounded-lg flex items-center justify-between text-[9.5px] text-neutral-500 font-mono">
          <span className="flex items-center">
            <ShieldCheck className="h-3 w-3 mr-1 text-emerald-400" />
            Copias de seguridad del sistema activa
          </span>
          <span>Volts v3.1</span>
        </div>
      </div>
    </div>
  );
}
