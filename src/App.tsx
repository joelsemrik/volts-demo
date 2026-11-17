import React, { useState, useEffect } from "react";
import { Ingreso, Gasto, Presupuesto, SistemaNotificacion } from "./types";
import {
  INITIAL_INGRESOS,
  INITIAL_GASTOS,
  INITIAL_PRESUPUESTOS,
  INITIAL_NOTIFICACIONES,
} from "./mockData";

// Components
import IngresosTab from "./components/IngresosTab";
import GastosTab from "./components/GastosTab";
import FlujoCajaTab from "./components/FlujoCajaTab";
import PresupuestosTab from "./components/PresupuestosTab";
import NotificationsPanel from "./components/NotificationsPanel";
import Logo from "./components/Logo";

// Icons
import {
  Zap,
  DollarSign,
  TrendingUp,
  FileText,
  BarChart3,
  Bell,
  Settings,
  X,
  Copy,
  MessageSquare,
  HardHat,
  RotateCcw,
  Cloud,
  CloudDownload,
  CloudUpload,
  RefreshCw,
} from "lucide-react";
import { User } from "firebase/auth";
import {
  initAuth,
  googleSignIn,
  googleSignOut,
  findBackupFile,
  downloadBackupFileContent,
  createBackupFile,
  updateBackupFileContent,
  BackupData,
} from "./utils/driveSync";

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem("voltio_usuario");
  });
  const [loginUser, setLoginUser] = useState<"Partner A" | "Partner B">("Partner A");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // State Initialization from LocalStorage or Fallbacks
  const [ingresos, setIngresos] = useState<Ingreso[]>(() => {
    const saved = localStorage.getItem("voltio_ingresos");
    return saved ? JSON.parse(saved) : INITIAL_INGRESOS;
  });

  const [gastos, setGastos] = useState<Gasto[]>(() => {
    const saved = localStorage.getItem("voltio_gastos");
    return saved ? JSON.parse(saved) : INITIAL_GASTOS;
  });

  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>(() => {
    const saved = localStorage.getItem("voltio_presupuestos");
    return saved ? JSON.parse(saved) : INITIAL_PRESUPUESTOS;
  });

  const [notificaciones, setNotificaciones] = useState<SistemaNotificacion[]>(
    () => {
      const saved = localStorage.getItem("voltio_notificaciones");
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICACIONES;
    }
  );

  const [activeTab, setActiveTab] = useState<"ingresos" | "gastos" | "flujo" | "presupuestos">("ingresos");
  const [showNotifications, setShowNotifications] = useState(false);
  const [whatsappReminder, setWhatsappReminder] = useState<{
    text: string;
    phone: string;
  } | null>(null);

  // Google Drive Synchronization State
  const [driveUser, setDriveUser] = useState<User | null>(null);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [autoSyncDrive, setAutoSyncDrive] = useState<boolean>(() => {
    const saved = localStorage.getItem("voltio_drive_auto");
    return saved !== "false"; // default to true
  });
  const [driveSyncMessage, setDriveSyncMessage] = useState<string | null>(null);
  const [driveFileIdState, setDriveFileIdState] = useState<string | null>(null);
  const [lastDriveSyncTime, setLastDriveSyncTime] = useState<string | null>(() => {
    return localStorage.getItem("voltio_drive_last_sync");
  });

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem("voltio_ingresos", JSON.stringify(ingresos));
  }, [ingresos]);

  useEffect(() => {
    localStorage.setItem("voltio_gastos", JSON.stringify(gastos));
  }, [gastos]);

  useEffect(() => {
    localStorage.setItem("voltio_presupuestos", JSON.stringify(presupuestos));
  }, [presupuestos]);

  useEffect(() => {
    localStorage.setItem("voltio_notificaciones", JSON.stringify(notificaciones));
  }, [notificaciones]);

  useEffect(() => {
    localStorage.setItem("voltio_drive_auto", String(autoSyncDrive));
  }, [autoSyncDrive]);

  // Firebase Auth Observer for Google Drive
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setDriveUser(user);
        setDriveToken(token);
        checkAndFindDriveFile(token);
      },
      () => {
        setDriveUser(null);
        setDriveToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const checkAndFindDriveFile = async (token: string) => {
    setDriveSyncMessage("Buscando base de datos en Drive...");
    const fileId = await findBackupFile(token);
    if (fileId) {
      setDriveFileIdState(fileId);
      setDriveSyncMessage("Base de datos encontrada en Google Drive.");
    } else {
      setDriveFileIdState(null);
      setDriveSyncMessage("No se encontró base de datos previa. Listo para subir.");
    }
  };

  const handleDriveLogin = async () => {
    setIsSyncingDrive(true);
    setDriveSyncMessage("Iniciando sesión en Google...");
    try {
      const res = await googleSignIn();
      if (res) {
        setDriveUser(res.user);
        setDriveToken(res.accessToken);
        setDriveSyncMessage("Cuenta conectada con éxito.");
        await checkAndFindDriveFile(res.accessToken);
      }
    } catch (err) {
      console.error("Error en handleDriveLogin:", err);
      setDriveSyncMessage("Error al conectar con Google Drive.");
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const handleDriveLogout = async () => {
    setIsSyncingDrive(true);
    try {
      await googleSignOut();
      setDriveUser(null);
      setDriveToken(null);
      setDriveFileIdState(null);
      setDriveSyncMessage("Sesión de Drive terminada.");
    } catch (err) {
      console.error("Error en handleDriveLogout:", err);
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const handleSyncToDrive = async (silent = false) => {
    if (!driveToken) return;

    if (!silent) {
      const confirmUpload = window.confirm(
        "📤 ¿Deseas RESPALDAR la base de datos local actual en tu Google Drive?\n\nEsto actualizará el archivo 'voltio_database.json' en tu cuenta de Google."
      );
      if (!confirmUpload) return;
    }

    setIsSyncingDrive(true);
    setDriveSyncMessage("Respaldando datos en la nube...");

    try {
      const fileId = await findBackupFile(driveToken);
      const dataToSave: BackupData = {
        ingresos,
        gastos,
        presupuestos,
        notificaciones,
        exportedAt: new Date().toISOString(),
      };

      let success = false;
      let targetFileId = fileId;

      if (fileId) {
        success = await updateBackupFileContent(driveToken, fileId, dataToSave);
      } else {
        const createdId = await createBackupFile(driveToken, dataToSave);
        if (createdId) {
          success = true;
          targetFileId = createdId;
        }
      }

      if (success) {
        const nowStr = new Date().toLocaleString("es-AR");
        setLastDriveSyncTime(nowStr);
        localStorage.setItem("voltio_drive_last_sync", nowStr);
        if (targetFileId) setDriveFileIdState(targetFileId);
        setDriveSyncMessage("Base de datos sincronizada en Drive.");
        if (!silent) {
          alert("🎉 ¡Datos guardados exitosamente en Google Drive!");
        }
      } else {
        setDriveSyncMessage("Fallo al actualizar el archivo en la nube.");
      }
    } catch (err) {
      console.error("Error en handleSyncToDrive:", err);
      setDriveSyncMessage("Error de conexión al subir.");
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const handleSyncFromDrive = async () => {
    if (!driveToken) return;

    setIsSyncingDrive(true);
    setDriveSyncMessage("Consultando archivo en la nube...");

    try {
      const fileId = await findBackupFile(driveToken);
      if (!fileId) {
        setDriveSyncMessage("No se encontró base de datos en Drive.");
        alert("⚠️ No se encontró ningún archivo 'voltio_database.json' en tu cuenta de Google Drive para descargar.");
        return;
      }

      const confirmDownload = window.confirm(
        "📥 ¿Estás seguro de que deseas DESCARGAR la base de datos de Google Drive?\n\n⚠️ ¡Atención! Esto RESTAURARÁ los datos en esta aplicación y REEMPLAZARÁ toda la información local de ingresos, gastos y presupuestos actuales."
      );
      if (!confirmDownload) return;

      setDriveSyncMessage("Descargando base de datos...");
      const backup = await downloadBackupFileContent(driveToken, fileId);

      if (backup) {
        if (Array.isArray(backup.ingresos)) setIngresos(backup.ingresos);
        if (Array.isArray(backup.gastos)) setGastos(backup.gastos);
        if (Array.isArray(backup.presupuestos)) setPresupuestos(backup.presupuestos);
        if (Array.isArray(backup.notificaciones)) setNotificaciones(backup.notificaciones);

        const nowStr = new Date().toLocaleString("es-AR");
        setLastDriveSyncTime(nowStr);
        localStorage.setItem("voltio_drive_last_sync", nowStr);
        setDriveFileIdState(fileId);
        setDriveSyncMessage("Información local restaurada desde Drive.");
        alert("🎉 ¡Base de datos descargada e importada con éxito!");
      } else {
        setDriveSyncMessage("No fue posible interpretar el archivo de Drive.");
      }
    } catch (err) {
      console.error("Error en handleSyncFromDrive:", err);
      setDriveSyncMessage("Error de conexión al bajar.");
    } finally {
      setIsSyncingDrive(false);
    }
  };

  // Auto Backup effect when data is altered and drive is connected
  useEffect(() => {
    if (!driveToken || !autoSyncDrive) return;

    const timer = setTimeout(() => {
      handleSyncToDrive(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [ingresos, gastos, presupuestos, notificaciones, driveToken, autoSyncDrive]);

  // Handlers for Incomes
  const handleAddIngreso = (newIngreso: Omit<Ingreso, "id">) => {
    const ing: Ingreso = {
      ...newIngreso,
      id: `ing-${Date.now()}`,
      registradoPor: currentUser || "Demo",
    };
    setIngresos((prev) => [...prev, ing]);
  };

  const handleDeleteIngreso = (id: string) => {
    setIngresos((prev) => prev.filter((item) => item.id !== id));
  };

  // Handlers for Expenses
  const handleAddGasto = (newGasto: Omit<Gasto, "id">) => {
    const gast: Gasto = {
      ...newGasto,
      id: `gast-${Date.now()}`,
      registradoPor: currentUser || "Demo",
    };
    setGastos((prev) => [...prev, gast]);
  };

  const handleDeleteGasto = (id: string) => {
    setGastos((prev) => prev.filter((item) => item.id !== id));
  };

  // Handlers for Estimates (Quotes)
  const handleAddPresupuesto = (newPres: Omit<Presupuesto, "id" | "montoTotal">) => {
    const total = newPres.items.reduce((s, it) => s + it.cantidad * it.precioUnitario, 0);
    const pres: Presupuesto = {
      ...newPres,
      id: `pres-${Date.now()}`,
      montoTotal: total,
      registradoPor: currentUser || "Demo",
    };
    setPresupuestos((prev) => [...prev, pres]);
  };

  const handleUpdatePresupuestoEstado = (id: string, nuevoEstado: Presupuesto["estado"]) => {
    setPresupuestos((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, estado: nuevoEstado };
          // If changed to Pending, push an automatic notification alert
          if (nuevoEstado === "Pendiente de Pago") {
            triggerAlertaCobro(p);
          }
          return updated;
        }
        return p;
      })
    );
  };

  // Alert builder for Unpaid bills
  const triggerAlertaCobro = (pres: Presupuesto) => {
    // Avoid double logging alerts
    if (notificaciones.some((n) => n.presupuestoId === pres.id)) return;

    const notif: SistemaNotificacion = {
      id: `notif-${Date.now()}`,
      presupuestoId: pres.id,
      clienteNombre: pres.clienteNombre,
      monto: pres.montoTotal,
      fechaVencimiento: pres.fechaVencimiento,
      diasVencidos: 1, // Fresh
      leido: false,
      tipo: "Vencido",
    };
    setNotificaciones((prev) => [notif, ...prev]);
  };

  const pushManualAlerta = (presId: string) => {
    const pres = presupuestos.find((p) => p.id === presId);
    if (pres) triggerAlertaCobro(pres);
  };

  const handleMarkAsRead = (id: string) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leido: true } : n))
    );
  };

  const handleClearNotifications = () => {
    setNotificaciones([]);
  };

  // Send Whatsapp Reminder Simulation Modal
  const handleSendReminder = (notif: SistemaNotificacion) => {
    const pres = presupuestos.find((p) => p.id === notif.presupuestoId);
    const clientPhone = pres?.clienteContacto || "No registrado";
    
    const senderName = currentUser || "Demo";
    const textMsg = `Hola ${notif.clienteNombre}, te escribe ${senderName} de Volts para recordarte que el presupuesto ${pres?.numero || "eléctrico"} se encuentra pendiente de pago por un total de $${notif.monto.toLocaleString("es-AR")}. Podés abonarlo por transferencia bancaria utilizando el Alias CBU: COBRE.CABLE.CORRIENTE.MAT . ¡Muchas gracias!`;

    setWhatsappReminder({
      text: textMsg,
      phone: clientPhone,
    });
  };

  // Reset local database back to default initial values
  const reloadOriginalMockDataset = () => {
    if (confirm("¿Desear revertir la base de datos a los valores iniciales de prueba?")) {
      setIngresos(INITIAL_INGRESOS);
      setGastos(INITIAL_GASTOS);
      setPresupuestos(INITIAL_PRESUPUESTOS);
      setNotificaciones(INITIAL_NOTIFICACIONES);
      alert("Valores restablecidos con éxito.");
    }
  };

  const unreadNotifCount = notificaciones.filter((n) => !n.leido).length;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = loginUser === "Partner A" ? "1287" : "9090";
    if (password === correctPassword) {
      localStorage.setItem("voltio_usuario", loginUser);
      setCurrentUser(loginUser);
      setPassword("");
      setLoginError("");
    } else {
      setLoginError("Contraseña incorrecta. Intente nuevamente.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("voltio_usuario");
    setCurrentUser(null);
  };

  // IF NOT AUTHENTICATED, RENDER LOGIN SCREEN
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-neutral-950 font-sans text-neutral-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-5 pointer-events-none transform translate-x-8 -translate-y-8">
            <Zap className="h-60 w-60 text-amber-400" />
          </div>

          <div className="text-center space-y-4">
            <Logo size="lg" className="mx-auto" />
            <div>
              <p className="text-[11px] text-neutral-400 font-mono tracking-wider uppercase">Servicio de Electricidad Habilitado • AEA</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] text-neutral-400 uppercase font-mono tracking-wider block mb-2">
                Seleccione su Usuario:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginUser("Partner A");
                    setLoginError("");
                  }}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                    loginUser === "Partner A"
                      ? "bg-amber-400/10 border-amber-400 text-amber-400 shadow-sm"
                      : "bg-neutral-800/40 border-neutral-700/60 text-neutral-400 hover:border-neutral-700"
                  }`}
                >
                  <span className="text-xs font-bold block">Partner A</span>
                  <span className="text-[9px] font-mono opacity-80 mt-1">Socio Instalador</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginUser("Partner B");
                    setLoginError("");
                  }}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                    loginUser === "Partner B"
                      ? "bg-amber-400/10 border-amber-400 text-amber-400 shadow-sm"
                      : "bg-neutral-800/40 border-neutral-700/60 text-neutral-400 hover:border-neutral-700"
                  }`}
                >
                  <span className="text-xs font-bold block">Partner B</span>
                  <span className="text-[9px] font-mono opacity-80 mt-1">Socio Instalador</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-neutral-400 uppercase font-mono tracking-wider block mb-1">
                Contraseña de Acceso:
              </label>
              <input
                type="password"
                placeholder="Introduzca su PIN de 4 dígitos..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 text-center font-mono tracking-widest"
                required
              />
            </div>

            {loginError && (
              <p className="text-xs text-red-400 text-center font-mono">
                ⚠️ {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-amber-400 hover:bg-amber-500 text-neutral-900 font-bold py-3 rounded-xl text-xs transition flex items-center justify-center space-x-2"
            >
              <Zap className="h-4 w-4 fill-neutral-900" />
              <span>Conectar e Iniciar Canales ⚡</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-neutral-100 flex flex-col items-center">
      
      {/* MOBILE SCREEN WRAPPER / CONTAINER (Desktop Centered) */}
      <div className="w-full max-w-md bg-neutral-950 min-h-screen flex flex-col shadow-2xl border-x border-neutral-900 pb-20 relative">
        
        {/* TOP STATUS BAR BRANDING */}
        <header className="p-4 bg-neutral-900/90 backdrop-blur border-b border-neutral-800 sticky top-0 z-40 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            {/* Minimalist Logo on Header */}
            <div className="flex items-center justify-center p-1 bg-neutral-950 rounded-lg border border-neutral-800/80 shadow-inner">
              <svg viewBox="0 0 24 24" className="h-6 w-auto" fill="#f5c518"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>
            </div>
            <div>
              <h1 className="text-xs font-bold font-sans tracking-tight text-neutral-100 flex items-center space-x-1">
                <span>Volts</span>
                <span className="text-[8px] lowercase font-mono font-bold bg-neutral-950 text-amber-400 px-1 rounded border border-neutral-800/80">by Volts</span>
              </h1>
              <p className="text-[9px] text-neutral-400 font-mono">Control: <strong className="text-amber-400">{currentUser}</strong></p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Cerrar Sesión Action Link */}
            <button
              onClick={handleLogout}
              className="text-[10px] uppercase font-mono text-neutral-400 hover:text-red-400 border border-neutral-800 hover:border-red-500/20 bg-neutral-900 px-2.5 py-1.5 rounded-lg transition"
              title="Cerrar sesión"
            >
              Salir
            </button>

            {/* Database Reset Action Button */}
            <button
              onClick={reloadOriginalMockDataset}
              className="p-1.5 hover:bg-neutral-850 rounded-lg text-neutral-500 hover:text-amber-400 transition"
              title="Restablecer Datos"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {/* Notification trigger button */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl bg-neutral-850 hover:bg-neutral-800 transition border border-neutral-800"
            >
              <Bell className="h-4 w-4 text-neutral-200" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>
          </div>
        </header>

        {/* NOTIFICATIONS FLOATING PANEL */}
        {showNotifications && (
          <div className="p-4 bg-neutral-950 border-b border-neutral-900 animate-fade-in z-30">
            <NotificationsPanel
              notificaciones={notificaciones}
              onMarkAsRead={handleMarkAsRead}
              onClearAll={handleClearNotifications}
              onSendReminder={handleSendReminder}
            />
            <button
              onClick={() => setShowNotifications(false)}
              className="mt-3 w-full bg-neutral-900 py-1.5 rounded-lg text-center text-xs text-neutral-400 hover:text-white transition"
            >
              Ocultar Alertas ↑
            </button>
          </div>
        )}

        {/* MAIN BODY SCROLL VIEW */}
        <main className="flex-1 p-4 space-y-4 overflow-y-auto">
          
          {/* GOOGLE DRIVE SYNC CARD */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <div className="flex items-center space-x-2">
                <Cloud className="h-4.5 w-4.5 text-amber-400" />
                <span className="font-bold text-xs text-neutral-100 tracking-tight">Sincronización Google Drive</span>
              </div>
              <div>
                {driveUser ? (
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono font-bold">
                    ● En Línea
                  </span>
                ) : (
                  <span className="text-[9px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full border border-neutral-700">
                    Desconectado
                  </span>
                )}
              </div>
            </div>

            {!driveUser ? (
              <div className="space-y-3">
                <p className="text-[11px] text-neutral-400 leading-relaxed font-sans mt-0.5 animate-fade-in">
                  Guardá y sincronizá automáticamente los registros con tu cuenta de Google Drive para mayor seguridad de tus bases de datos.
                </p>
                <button
                  type="button"
                  onClick={handleDriveLogin}
                  disabled={isSyncingDrive}
                  className="w-full bg-neutral-800 hover:bg-neutral-750 border border-neutral-700/60 rounded-xl py-2.5 px-3 flex items-center justify-center space-x-2 text-xs font-bold transition text-neutral-200 cursor-pointer"
                >
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4.5 w-4.5 text-neutral-200">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>Conectar Cuenta de Google</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 animate-fade-in">
                <div className="flex justify-between items-center bg-neutral-950/45 p-2 px-3 rounded-2xl text-[11.5px] border border-neutral-800/80">
                  <div className="truncate pr-2">
                    <p className="text-[9px] text-neutral-400 font-mono">PROPIETARIO DEL DRIVE:</p>
                    <p className="font-bold text-neutral-200 truncate">{driveUser.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDriveLogout}
                    disabled={isSyncingDrive}
                    className="text-[10px] text-red-400 bg-neutral-900 border border-neutral-800 hover:border-red-900/10 hover:bg-neutral-850 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    Salir
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSyncFromDrive()}
                    disabled={isSyncingDrive}
                    className="bg-neutral-800 hover:bg-neutral-750 border border-neutral-700/50 p-2.5 rounded-xl text-[11px] font-bold text-neutral-300 transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    title="Importar base de datos de la nube en la app local"
                  >
                    <CloudDownload className="h-4 w-4 text-amber-400" />
                    <span>Nube → Local</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSyncToDrive()}
                    disabled={isSyncingDrive}
                    className="bg-amber-400 hover:bg-amber-500 text-neutral-900 p-2.5 rounded-xl text-[11px] font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    title="Subir base de datos actual a Google Drive"
                  >
                    <CloudUpload className="h-4 w-4 fill-neutral-900" />
                    <span>Local → Nube</span>
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-neutral-800/40 pt-2 pb-0.5">
                  <label className="flex items-center space-x-2 text-[10.5px] text-neutral-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoSyncDrive}
                      onChange={(e) => setAutoSyncDrive(e.target.checked)}
                      className="accent-amber-400 rounded h-3.5 w-3.5 focus:ring-0 cursor-pointer bg-neutral-850 border-neutral-700"
                    />
                    <span>Auto-resguardar al modificar ⚡</span>
                  </label>
                  
                  {isSyncingDrive && (
                    <RefreshCw className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                  )}
                </div>

                <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500 bg-neutral-950/20 p-1.5 px-2 rounded-lg">
                  <span>Último respaldo:</span>
                  <span className="text-amber-400/90 font-bold">{lastDriveSyncTime || "Pendiente"}</span>
                </div>
              </div>
            )}

            {driveSyncMessage && (
              <p className="text-[10px] text-neutral-400 italic text-center font-mono py-0.5 animate-pulse">
                ⚡ {driveSyncMessage}
              </p>
            )}
          </div>

          {activeTab === "ingresos" && (
            <IngresosTab
              ingresos={ingresos}
              onAddIngreso={handleAddIngreso}
              onDeleteIngreso={handleDeleteIngreso}
              onClearIngresos={() => {
                if (confirm("⚠️ ¿Estás seguro de que deseas limpiar TODOS los registros de ingresos de este mes? Esta acción no se puede deshacer de forma directa.")) {
                  setIngresos([]);
                  alert("🧹 Registros de ingresos limpiados con éxito. Listo para comenzar el mes.");
                }
              }}
            />
          )}

          {activeTab === "gastos" && (
            <GastosTab
              gastos={gastos}
              onAddGasto={handleAddGasto}
              onDeleteGasto={handleDeleteGasto}
              onClearGastos={() => {
                if (confirm("⚠️ ¿Estás seguro de que deseas vaciar TODOS los registros de egresos/gastos de este mes? Te sugerimos haber exportado a Excel previamente.")) {
                  setGastos([]);
                  alert("🧹 Registros de gastos operativos blanqueados con éxito.");
                }
              }}
            />
          )}

          {activeTab === "flujo" && (
            <FlujoCajaTab
              ingresos={ingresos}
              gastos={gastos}
              presupuestos={presupuestos}
            />
          )}

          {activeTab === "presupuestos" && (
            <PresupuestosTab
              presupuestos={presupuestos}
              onAddPresupuesto={handleAddPresupuesto}
              onUpdatePresupuestoEstado={handleUpdatePresupuestoEstado}
              onTriggerAlerta={pushManualAlerta}
              onClearPresupuestos={() => {
                if (confirm("⚠️ ¿Estás seguro de vaciar el listado de presupuestos? Se perderán las referencias de las cotizaciones activas de este periodo.")) {
                  setPresupuestos([]);
                  alert("🧹 Listado de presupuestos reiniciado con éxito.");
                }
              }}
            />
          )}
        </main>

        {/* SECURITY & RULES FOOTER */}
        <p className="text-[10px] text-neutral-500 font-mono text-center p-3 opacity-60 bg-neutral-900/10 border-t border-neutral-900">
          🚧 Volts • Control de Servicios Eléctricos Habilitados.
        </p>

        {/* PERSISTENT FLOATING BOTTOM NAV BAR */}
        <nav className="fixed bottom-0 max-w-md w-full bg-neutral-900/90 backdrop-blur border-t border-neutral-800 z-40 px-4 py-2 flex justify-between items-center h-16 shadow-xl">
          {/* Tab 1: Incomes */}
          <button
            onClick={() => {
              setActiveTab("ingresos");
              setShowNotifications(false);
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 transition ${
              activeTab === "ingresos" ? "text-amber-400 font-bold" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Zap className={`h-4.5 w-4.5 ${activeTab === "ingresos" ? "fill-amber-400/20" : ""}`} />
            <span className="text-[10.5px] mt-1 tracking-tight">Ingresos</span>
          </button>

          {/* Tab 2: Expenses */}
          <button
            onClick={() => {
              setActiveTab("gastos");
              setShowNotifications(false);
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 transition ${
              activeTab === "gastos" ? "text-amber-400 font-bold" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <DollarSign className="h-4.5 w-4.5" />
            <span className="text-[10.5px] mt-1 tracking-tight">Gastos</span>
          </button>

          {/* Tab 3: Cash Flow / Summary */}
          <button
            onClick={() => {
              setActiveTab("flujo");
              setShowNotifications(false);
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 transition ${
              activeTab === "flujo" ? "text-amber-400 font-bold" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <BarChart3 className="h-4.5 w-4.5" />
            <span className="text-[10.5px] mt-1 tracking-tight">Flujo Caja</span>
          </button>

          {/* Tab 4: Quotes / PDF */}
          <button
            onClick={() => {
              setActiveTab("presupuestos");
              setShowNotifications(false);
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 transition ${
              activeTab === "presupuestos" ? "text-amber-400 font-bold" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <FileText className="h-4.5 w-4.5" />
            <span className="text-[10.5px] mt-1 tracking-tight">Presupuesto</span>
          </button>
        </nav>
      </div>

      {/* WHATSAPP REMINDER DIALOG / DRAWER OVERLAY */}
      {whatsappReminder && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm flex items-center justify-center z-55 px-4">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 p-5 rounded-2xl shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="font-sans font-bold text-xs text-amber-400 flex items-center space-x-1">
                <MessageSquare className="h-4.5 w-4.5 text-emerald-400" />
                <span>Simular Reclamo de Pago (WhatsApp)</span>
              </span>
              <button
                onClick={() => setWhatsappReminder(null)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-[10.5px] text-neutral-400">
                <strong>Contacto del Cliente:</strong> {whatsappReminder.phone}
              </div>
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-300 font-sans text-xs select-all whitespace-pre-line leading-relaxed">
                {whatsappReminder.text}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(whatsappReminder.text);
                  alert("🎉 ¡Copiaste el mensaje de cobro! Podés pegarlo en el chat de WhatsApp de tu cliente.");
                }}
                className="flex-1 bg-amber-400 hover:bg-amber-500 text-neutral-900 font-bold py-2 rounded-xl text-xs transition flex items-center justify-center space-x-1"
              >
                <Copy className="h-4.5 w-4.5" />
                <span>Copiar Mensaje</span>
              </button>

              <button
                onClick={() => {
                  const query = encodeURIComponent(whatsappReminder.text);
                  window.open(`https://api.whatsapp.com/send?text=${query}`, "_blank");
                  setWhatsappReminder(null);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold px-4 py-2 rounded-xl text-xs transition flex items-center justify-center space-x-1"
              >
                <span>Enviar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
