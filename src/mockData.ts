import { Ingreso, Gasto, Presupuesto, SistemaNotificacion } from "./types";

export const INITIAL_INGRESOS: Ingreso[] = [
  {
    id: "ing-1",
    monto: 120000,
    cliente: "Demo Client 1 - Apartment Building",
    categoria: "Instalación Eléctrica",
    formaPago: "Transferencia",
    fecha: "2026-06-16",
    notas: "Instalación completa de tablero seccional y recableado de pasillos."
  },
  {
    id: "ing-2",
    monto: 45000,
    cliente: "Demo Client 2",
    categoria: "Servicio de Urgencia 24h",
    formaPago: "Efectivo",
    fecha: "2026-06-17",
    notas: "Falla de cortocircuito nocturna en cocina y cambio de disyuntor roto."
  },
  {
    id: "ing-3",
    monto: 30000,
    cliente: "Demo Real Estate Agency",
    categoria: "Certificaciones y Leyes",
    formaPago: "Mercado Pago",
    fecha: "2026-06-15",
    notas: "Certificación de puesta a tierra y protocolo de resistencia de lazo."
  },
  {
    id: "ing-4",
    monto: 15000,
    cliente: "Demo Client 3",
    categoria: "Reparación / Cambio de Componente",
    formaPago: "Efectivo",
    fecha: "2026-06-18",
    notas: "Reemplazo de 3 llaves de luz defectuosas y toma corrientes de exterior."
  }
];

export const INITIAL_GASTOS: Gasto[] = [
  {
    id: "gast-1",
    monto: 32400,
    proveedor: "Demo Electrical Supplier",
    categoria: "Materiales Eléctricos",
    fecha: "2026-06-14",
    descripcion: "Rollos de cable unipolar 2.5mm y caja de tomacorrientes Jeluz",
    automaticoPorIA: false
  },
  {
    id: "gast-2",
    monto: 12500,
    proveedor: "Demo Gas Station",
    categoria: "Transporte y Combustible",
    fecha: "2026-06-15",
    descripcion: "Carga de combustible furgón de trabajo",
    automaticoPorIA: false
  },
  {
    id: "gast-3",
    monto: 18500,
    proveedor: "Demo Tool Store",
    categoria: "Herramientas",
    fecha: "2026-06-10",
    descripcion: "Multímetro digital auto-rango y pinza amperométrica",
    automaticoPorIA: true
  },
  {
    id: "gast-4",
    monto: 9800,
    proveedor: "Demo Insurance",
    categoria: "E.P.P. y Seguridad",
    fecha: "2026-06-12",
    descripcion: "Guantes dieléctricos Clase 0 (1000V) de repuesto",
    automaticoPorIA: false
  }
];

export const INITIAL_PRESUPUESTOS: Presupuesto[] = [
  {
    id: "pres-1",
    numero: "P-0024",
    clienteNombre: "Demo Dental Clinic",
    clienteContacto: "clinic@example.com",
    direccionObra: "Av. Maipú 1540, PB",
    fechaEmision: "2026-06-10",
    fechaVencimiento: "2026-06-25",
    montoTotal: 295000,
    estado: "Pendiente de Pago",
    notaAdicional: "Presupuesto válido por 15 días debido al movimiento de precios de cobre.",
    items: [
      { id: "item-1", descripcion: "Renovación tablero general trifásico con diferenciales Schneider", cantidad: 1, precioUnitario: 180000 },
      { id: "item-2", descripcion: "Instalación de luminaria embutida LED dicroicas en salas", cantidad: 15, precioUnitario: 5000 },
      { id: "item-3", descripcion: "Mano de obra especializada para tendido de cables libre halógeno", cantidad: 8, precioUnitario: 5000 }
    ],
    alertaVencimientoEnviada: false
  },
  {
    id: "pres-2",
    numero: "P-0025",
    clienteNombre: "Demo Client 4 - Textile Plant",
    clienteContacto: "+54 9 000 000-0000",
    direccionObra: "Parque Industrial Pilar",
    fechaEmision: "2026-06-12",
    fechaVencimiento: "2026-06-16",
    montoTotal: 580000,
    estado: "Pendiente de Pago",
    notaAdicional: "Requiere corte general programado para acople de acometida.",
    items: [
      { id: "item-4", descripcion: "Tablero de corrección de factor de potencia automático (Batería de Capacitores)", cantidad: 1, precioUnitario: 450000 },
      { id: "item-5", descripcion: "Puesta a tierra de protección electrostática con jabalinas", cantidad: 2, precioUnitario: 650000 } // Note budget total calculated dynamically is 450k + 1.3M = 1.75M? Ah, we can recalculate dynamically!
    ],
    alertaVencimientoEnviada: true
  },
  {
    id: "pres-3",
    numero: "P-0023",
    clienteNombre: "Demo Client 5",
    clienteContacto: "client5@example.com",
    direccionObra: "San Martín 1045",
    fechaEmision: "2026-06-05",
    fechaVencimiento: "2026-06-20",
    montoTotal: 96000,
    estado: "Pagado",
    notaAdicional: "Trabajo finalizado y aprobado por inspector municipal.",
    items: [
      { id: "item-6", descripcion: "Instalación de tomacorrientes dedicados para aire acondicionado con 4mm2", cantidad: 4, precioUnitario: 24000 }
    ],
    alertaVencimientoEnviada: false
  }
];

export const INITIAL_NOTIFICACIONES: SistemaNotificacion[] = [
  {
    id: "notif-1",
    presupuestoId: "pres-2",
    clienteNombre: "Demo Client 4",
    monto: 1750000, // Recalculated total
    fechaVencimiento: "2026-06-16",
    diasVencidos: 2,
    leido: false,
    tipo: "Vencido"
  },
  {
    id: "notif-2",
    presupuestoId: "pres-1",
    clienteNombre: "Demo Dental Clinic",
    monto: 295000,
    fechaVencimiento: "2026-06-25",
    diasVencidos: -7, // Restantes
    leido: false,
    tipo: "Alerta Vencimiento"
  }
];
