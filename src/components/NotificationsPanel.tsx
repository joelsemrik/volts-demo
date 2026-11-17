import React from "react";
import { SistemaNotificacion } from "../types";
import { Bell, AlertTriangle, CheckCircle, Send, X, Clock } from "lucide-react";

interface NotificationsPanelProps {
  notificaciones: SistemaNotificacion[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onSendReminder: (notif: SistemaNotificacion) => void;
}

export default function NotificationsPanel({
  notificaciones,
  onMarkAsRead,
  onClearAll,
  onSendReminder,
}: NotificationsPanelProps) {
  const unreadCount = notificaciones.filter((n) => !n.leido).length;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-800">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Bell className="h-5 w-5 text-amber-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[9px] h-4 w-4 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <h3 className="font-sans font-semibold text-sm text-neutral-100">
            Alertas de Cobro & Vencimientos
          </h3>
        </div>
        {notificaciones.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-neutral-400 hover:text-amber-400 transition"
          >
            Limpiar todo
          </button>
        )}
      </div>

      {notificaciones.length === 0 ? (
        <div className="text-center py-6 text-neutral-500 font-mono text-xs">
          🚫 No hay alertas de pagos pendientes.
        </div>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {notificaciones.map((notif) => (
            <div
              key={notif.id}
              className={`p-3 rounded-xl border transition ${
                notif.leido
                  ? "bg-neutral-900/50 border-neutral-850 opacity-60"
                  : "bg-neutral-800/80 border-amber-500/30 shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                  {notif.tipo === "Vencido" ? (
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-neutral-100">
                      {notif.clienteNombre}
                    </h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {notif.tipo === "Vencido"
                        ? `⚠️ Presupuesto vencido hace ${notif.diasVencidos} días`
                        : `⏳ Vence el ${notif.fechaVencimiento}`}
                    </p>
                    <p className="text-[12px] font-mono font-semibold text-amber-400 mt-1">
                      Monto: ${notif.monto.toLocaleString("es-AR")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {!notif.leido && (
                    <button
                      onClick={() => onMarkAsRead(notif.id)}
                      className="p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-amber-400 transition"
                      title="Marcar como leído"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onSendReminder(notif)}
                    className="p-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 rounded text-xs flex items-center space-x-1 px-2 transition border border-amber-500/20"
                    title="Cobrar por WhatsApp"
                  >
                    <Send className="h-3 w-3" />
                    <span className="text-[10px]">Reclamar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Electrical Tip Banner */}
      <div className="mt-4 p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start space-x-2">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5 animate-bounce" />
        <span className="text-[10.5px] text-amber-300 font-sans leading-tight">
          <strong>Consejo Eléctrico de Seguridad:</strong> Antes de intervenir un tablero, verifica la ausencia de tensión utilizando un tester calibrado. ¡Regla de oro N°3!
        </span>
      </div>
    </div>
  );
}
