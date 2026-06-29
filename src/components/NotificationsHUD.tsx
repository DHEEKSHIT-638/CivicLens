import { useState } from "react";

interface Notification {
  id: string;
  report_id: string;
  sector_id: string;
  title: string;
  message: string;
  type: string;
  status: string;
  created_at: string;
}

interface NotificationsHUDProps {
  notifications: Notification[];
  onTriggerSimulation: () => void;
  isSimulatingForecast: boolean;
}

export function NotificationsHUD({ 
  notifications, 
  onTriggerSimulation,
  isSimulatingForecast
}: NotificationsHUDProps) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadAlerts = notifications.filter(n => n.status === "unread");

  return (
    <div className="w-full flex flex-col gap-2 z-20 relative select-none">
      {/* Top Banner Ticker */}
      <div className="bg-surface-container-lowest px-5 py-3 border border-outline-variant rounded-xl flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-error/10 border border-error/20 flex items-center justify-center text-error">
            <span className="material-symbols-outlined text-[20px] flex items-center justify-center">warning</span>
          </div>
          
          <div className="min-w-0 flex flex-col text-left">
            <span className="text-[10px] font-mono text-error font-bold uppercase tracking-wider">
              AI Predictive Decay Telemetry
            </span>
            <div className="text-xs text-on-surface truncate pr-4 font-heading font-medium mt-0.5">
              {unreadAlerts.length > 0 ? (
                <span>{unreadAlerts[0].message}</span>
              ) : (
                <span className="text-outline font-mono text-[11px]">
                  All sectors stable. Weather forecast normal. No active warning triggers.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onTriggerSimulation}
            disabled={isSimulatingForecast}
            className="bg-secondary text-on-secondary py-2 px-4 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSimulatingForecast ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                Simulating...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">rainy</span>
                Simulate Monsoon
              </>
            )}
          </button>

          {unreadAlerts.length > 0 && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-xs text-outline hover:text-on-surface p-1.5 bg-surface-container border border-outline-variant rounded-lg cursor-pointer flex items-center justify-center"
            >
              <span className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${isOpen ? "transform rotate-180" : ""}`}>
                expand_more
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable alerts panel list */}
      {isOpen && unreadAlerts.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-surface-container-lowest border border-outline-variant max-h-60 overflow-y-auto p-3 flex flex-col gap-2 z-50 shadow-lg rounded-xl scrollbar-thin">
          <div className="flex items-center justify-between text-[10px] font-mono text-outline px-1 border-b border-outline-variant/30 pb-1.5">
            <span>Forecast Alert Inbox ({unreadAlerts.length})</span>
            <span className="text-error font-bold">Monsoon Season active</span>
          </div>

          {unreadAlerts.map((alert) => (
            <div 
              key={alert.id}
              className="bg-surface-container border border-error/10 hover:border-error/20 p-3 rounded-lg flex items-start gap-2.5 transition-all text-left"
            >
              <span className="material-symbols-outlined text-[16px] text-error flex-shrink-0 mt-0.5">warning</span>
              <div className="flex-1 text-xs">
                <div className="font-semibold text-on-surface font-heading">{alert.title}</div>
                <div className="text-on-surface-variant mt-1 leading-relaxed font-mono text-[11px]">{alert.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

