import { Ingreso, Gasto, Presupuesto } from "../types";

/**
 * Helper to download structured data as a Microsoft Excel-ready CSV file.
 * Includes UTF-8 BOM to prevent symbol distortion in Spanish locales.
 */
function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export Incomes (Ingresos)
 */
export function exportIngresosToExcel(ingresos: Ingreso[]) {
  const headers = ["Fecha", "Cliente/Obra", "Categoría", "Forma de Pago", "Monto ($)", "Registrado Por", "Notas/Detalle"];
  const rows = ingresos.map((ing) => [
    ing.fecha,
    ing.cliente.replace(/;/g, ","),
    ing.categoria,
    ing.formaPago,
    ing.monto.toString(),
    ing.registradoPor || "Sistema / Preset",
    ing.notas ? ing.notas.replace(/[\n\r]+/g, " ").replace(/;/g, ",") : "",
  ]);

  const csvContent = [
    headers.join(";"),
    ...rows.map((row) => row.join(";")),
  ].join("\n");

  const today = new Date().toISOString().split("T")[0];
  downloadCSV(csvContent, `Incomes_DT_e_Hijos_${today}.csv`);
}

/**
 * Export Expenses (Gastos)
 */
export function exportGastosToExcel(gastos: Gasto[]) {
  const headers = ["Fecha", "Proveedor", "Categoría", "Detalle de Material/Servicio", "Monto ($)", "Registrado Por", "Analizado por IA"];
  const rows = gastos.map((g) => [
    g.fecha,
    g.proveedor.replace(/;/g, ","),
    g.categoria,
    g.descripcion.replace(/[\n\r]+/g, " ").replace(/;/g, ","),
    g.monto.toString(),
    g.registradoPor || "Sistema / Preset",
    g.automaticoPorIA ? "Sí" : "No",
  ]);

  const csvContent = [
    headers.join(";"),
    ...rows.map((row) => row.join(";")),
  ].join("\n");

  const today = new Date().toISOString().split("T")[0];
  downloadCSV(csvContent, `Gastos_DT_e_Hijos_${today}.csv`);
}

/**
 * Export Quotes/Estimates (Presupuestos)
 */
export function exportPresupuestosToExcel(presupuestos: Presupuesto[]) {
  const headers = [
    "Número",
    "Cliente",
    "Contacto",
    "Dirección de Obra",
    "Fecha Emisión",
    "Fecha Vencimiento",
    "Total ($)",
    "Estado de Factura/Servicio",
    "Cantidad de Tareas",
    "Registrado Por",
    "Nota Adicional",
  ];

  const rows = presupuestos.map((p) => [
    p.numero,
    p.clienteNombre.replace(/;/g, ","),
    p.clienteContacto ? p.clienteContacto.replace(/;/g, ",") : "",
    p.direccionObra.replace(/;/g, ","),
    p.fechaEmision,
    p.fechaVencimiento,
    p.montoTotal.toString(),
    p.estado,
    p.items.length.toString(),
    p.registradoPor || "Sistema / Preset",
    p.notaAdicional ? p.notaAdicional.replace(/[\n\r]+/g, " ").replace(/;/g, ",") : "",
  ]);

  const csvContent = [
    headers.join(";"),
    ...rows.map((row) => row.join(";")),
  ].join("\n");

  const today = new Date().toISOString().split("T")[0];
  downloadCSV(csvContent, `Presupuestos_DT_e_Hijos_${today}.csv`);
}
