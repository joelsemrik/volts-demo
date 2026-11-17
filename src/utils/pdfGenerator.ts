import { jsPDF } from "jspdf";
import { Presupuesto } from "../types";

export function generateQuotePDF(presupuesto: Presupuesto) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Theme colors: Charcoal (31, 41, 55), Amber (245, 158, 11), Light Gray (243, 244, 246)
  const cCharcoal = [31, 41, 55];
  const cAmber = [245, 158, 11];
  const cLightGray = [243, 244, 246];

  // Draw Header Band
  doc.setFillColor(cCharcoal[0], cCharcoal[1], cCharcoal[2]);
  doc.rect(0, 0, 210, 38, "F");

  // Draw Yellow Accent Bar
  doc.setFillColor(cAmber[0], cAmber[1], cAmber[2]);
  doc.rect(0, 38, 210, 3, "F");

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("PRESUPUESTO ELÉCTRICO", 14, 18);

  // Subtitle / Logo mockup
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text("Servicios Eléctricos Profesionales • Instalaciones y Mantenimiento", 14, 25);
  doc.text("Matrícula de Instalador Eléctrico Profesional Habilitado", 14, 30);

  // Budget details top-right (on the light cover)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(`N°: ${presupuesto.numero}`, 145, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Fecha: ${presupuesto.fechaEmision}`, 145, 24);
  doc.text(`Vence: ${presupuesto.fechaVencimiento}`, 145, 29);

  // Content body
  doc.setTextColor(55, 65, 81);

  // Installer block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("De / Prestador del Servicio:", 14, 52);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text("Volts - Servicios Eléctricos (demo)", 14, 58);
  doc.text("Instalador: Demo", 14, 63);
  doc.text("Email: contact@example.com", 14, 68);
  doc.text("Habilitación AEA Cat. III - Registrado", 14, 73);

  // Client block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Para / Datos del Cliente:", 115, 52);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(presupuesto.clienteNombre, 115, 58);
  doc.text(`Contacto: ${presupuesto.clienteContacto}`, 115, 63);
  doc.text(`Obra: ${presupuesto.direccionObra}`, 115, 68);

  // Line Spacer
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(14, 80, 196, 80);

  // Table header
  doc.setFillColor(cCharcoal[0], cCharcoal[1], cCharcoal[2]);
  doc.rect(14, 86, 182, 7, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Descripción de Tareas / Materiales", 18, 91);
  doc.text("Cant.", 130, 91);
  doc.text("Precio Unit.", 148, 91);
  doc.text("Total", 178, 91);

  // Table items loop
  let startY = 93;
  const items = presupuesto.items;
  doc.setTextColor(31, 41, 55);
  
  items.forEach((item, index) => {
    startY += 8;
    // Row background stripes
    if (index % 2 === 1) {
      doc.setFillColor(cLightGray[0], cLightGray[1], cLightGray[2]);
      doc.rect(14, startY - 5, 182, 8, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    
    // Description text truncation / wrapping
    const textWrapped = doc.splitTextToSize(item.descripcion, 105);
    doc.text(textWrapped, 18, startY);
    
    doc.text(item.cantidad.toString(), 132, startY);
    doc.text(`$${item.precioUnitario.toLocaleString("es-AR")}`, 148, startY);
    
    const rowTotal = item.cantidad * item.precioUnitario;
    doc.setFont("helvetica", "bold");
    doc.text(`$${rowTotal.toLocaleString("es-AR")}`, 178, startY);
    
    // Compensate if text was long and wrapped
    if (textWrapped.length > 1) {
      startY += (textWrapped.length - 1) * 4;
    }
  });

  // Calculate Subtotal and Total
  const total = items.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);

  // Totals Area
  startY += 15;
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.3);
  doc.line(125, startY - 5, 196, startY - 5);

  doc.setTextColor(75, 85, 99);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Subtotal:", 130, startY);
  doc.text(`$${total.toLocaleString("es-AR")}`, 178, startY);

  startY += 7;
  doc.setFillColor(cAmber[0], cAmber[1], cAmber[2]);
  doc.rect(125, startY - 5, 71, 7.5, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);
  doc.text("Monto Total:", 128, startY);
  doc.text(`$${total.toLocaleString("es-AR")}`, 178, startY);

  // Term of conditions & Notes
  startY += 20;
  if (startY > 250) {
    doc.addPage();
    startY = 30;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);
  doc.text("Condiciones y Datos de Pago:", 14, startY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(75, 85, 99);
  doc.text("• Banco: Banco Galicia S.A.", 14, startY + 6);
  doc.text("• Alias CBU: COBRE.CABLE.CORRIENTE.MAT", 14, startY + 11);
  doc.text("• Cuenta Corriente en $: 302-5402919-4", 14, startY + 16);
  doc.text("• Enviar comprobante una vez realizada la transferencia para reservar materiales.", 14, startY + 21);

  if (presupuesto.notaAdicional) {
    doc.setFont("helvetica", "bold");
    doc.text("Notas aclaratorias:", 115, startY);
    doc.setFont("helvetica", "italic");
    doc.text(doc.splitTextToSize(presupuesto.notaAdicional, 80), 115, startY + 6);
  }

  // Electrical Security standard footer
  doc.setFillColor(cLightGray[0], cLightGray[1], cLightGray[2]);
  doc.rect(14, 260, 182, 18, "F");

  doc.setDrawColor(cAmber[0], cAmber[1], cAmber[2]);
  doc.setLineWidth(1);
  doc.line(14, 260, 14, 278);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(17, 24, 39);
  doc.text(" REGLAMENTACIÓN Y SEGURIDAD IMPORTANTE:", 16, 265);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(75, 85, 99);
  doc.setFontSize(7.5);
  doc.text("Todos los trabajos se ejecutan conforme a la normativa vigente AEA 90364 de la Asociación Electrotécnica Argentina.", 16, 270);
  doc.text("Se utilizan únicamente materiales homologados con sello de seguridad IRAM y certificación de aptitud eléctrica.", 16, 274);

  // Save the PDF
  const filename = `Presupuesto_${presupuesto.numero}_${presupuesto.clienteNombre.replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
}
