export interface Ingreso {
  id: string;
  monto: number;
  cliente: string;
  categoria: "Instalación Eléctrica" | "Mantenimiento Preventivo" | "Servicio de Urgencia 24h" | "Certificaciones y Leyes" | "Reparación / Cambio de Componente" | "Otros";
  formaPago: "Efectivo" | "Transferencia" | "Tarjeta" | "Mercado Pago" | "Otro";
  fecha: string;
  notas?: string;
  registradoPor?: string;
}

export interface Gasto {
  id: string;
  monto: number;
  proveedor: string;
  categoria: "Materiales Eléctricos" | "Herramientas" | "Transporte y Combustible" | "Servicios y Oficina" | "E.P.P. y Seguridad" | "Otros Gastos";
  fecha: string;
  descripcion: string;
  imagenRecibo?: string; // Base64 string o URL de imagen de recibo adjunta
  automaticoPorIA?: boolean;
  registradoPor?: string;
}

export interface QuoteItem {
  id: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export interface Presupuesto {
  id: string;
  numero: string;
  clienteNombre: string;
  clienteContacto: string;
  direccionObra: string;
  fechaEmision: string;
  fechaVencimiento: string;
  items: QuoteItem[];
  estado: "Borrador" | "Enviado" | "Aceptado" | "Pendiente de Pago" | "Pagado" | "Cancelado";
  montoTotal: number;
  notaAdicional?: string;
  alertaVencimientoEnviada?: boolean;
  registradoPor?: string;
}

export interface SistemaNotificacion {
  id: string;
  presupuestoId: string;
  clienteNombre: string;
  monto: number;
  fechaVencimiento: string;
  diasVencidos: number;
  leido: boolean;
  tipo: "Vencido" | "Alerta Vencimiento" | "Pago Recibido";
}
