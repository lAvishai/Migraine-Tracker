import React, { useState } from "react";
import { User } from "firebase/auth";
import { ExternalLink, RefreshCw, LogOut, CheckCircle2, AlertCircle, HardDrive, Download, Globe } from "lucide-react";
import { DriveSyncStatus } from "../lib/googleDriveSync";

interface GoogleDriveHeaderProps {
  user: User | null;
  syncStatus: DriveSyncStatus;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onSyncNow: () => void;
  onRestore: () => void;
}

export default function GoogleDriveHeader({
  user,
  syncStatus,
  isLoggingIn,
  onLogin,
  onLogout,
  onSyncNow,
  onRestore,
}: GoogleDriveHeaderProps) {
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const isInIframe = typeof window !== "undefined" && window.self !== window.top;

  const handleOpenNewTab = () => {
    window.open(window.location.href, "_blank");
  };

  const handleConfirmRestore = () => {
    setShowRestoreConfirm(false);
    onRestore();
  };

  return (
    <div className="bg-warm-card border border-warm-border rounded-2xl p-4 mb-6 transition-all shadow-sm">
      {!user ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-right">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <HardDrive className="text-blue-500" size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-warm-text">גיבוי וסנכרון ל-Google Drive</h3>
                <p className="text-xs text-warm-muted mt-0.5">
                  שמור את הנתונים שלך כקובץ JSON אישי ב-Google Drive לגיבוי אוטומטי וגישה מכל מקום
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={onLogin}
                disabled={isLoggingIn}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2.5 bg-white hover:bg-gray-50 text-gray-700 font-medium px-4 py-2.5 rounded-xl border border-gray-300 shadow-xs transition-all text-sm cursor-pointer disabled:opacity-50"
              >
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>{isLoggingIn ? "מתחבר..." : "התחברות עם Google"}</span>
              </button>

              {isInIframe && (
                <button
                  onClick={handleOpenNewTab}
                  className="inline-flex items-center gap-1.5 text-xs text-warm-muted hover:text-warm-text bg-warm-dark hover:bg-warm-border/50 border border-warm-border px-3 py-2.5 rounded-xl transition-all cursor-pointer"
                  title="פתח בלשונית חדשה להתחברות קלה ללא חסימת חלונות קופצים"
                >
                  <Globe size={14} />
                  <span className="hidden sm:inline">פתח בלשונית חדשה</span>
                </button>
              )}
            </div>
          </div>

          {syncStatus.error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start gap-2 text-xs text-red-400 text-right">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
              <div className="flex-1">
                <p className="font-medium">{syncStatus.error}</p>
                <p className="text-[11px] opacity-80 mt-1">
                  טיפ: אם הופיעה שגיאת חלון קופץ בדפדפן, לחץ על הכפתור "פתח בלשונית חדשה" למעלה והתחבר משם.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status info */}
          <div className="flex items-center gap-3 w-full md:w-auto text-right">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "משתמש"}
                className="w-10 h-10 rounded-xl border border-warm-border shrink-0 object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <HardDrive className="text-blue-500" size={20} />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-warm-text">
                  {user.displayName || user.email}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                  <CheckCircle2 size={12} /> מחובר ל-Google Drive
                </span>
              </div>
              <p className="text-xs text-warm-muted mt-0.5">
                {syncStatus.isSyncing
                  ? "מסנכרן כעת ל-Google Drive..."
                  : syncStatus.lastSynced
                  ? `סונכרן לאחרונה: ${syncStatus.lastSynced}`
                  : "טרם בוצע סנכרון ראשוני"}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={onSyncNow}
              disabled={syncStatus.isSyncing}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={syncStatus.isSyncing ? "animate-spin" : ""} />
              <span>{syncStatus.isSyncing ? "מסנכרן..." : "סנכרן כעת"}</span>
            </button>

            <button
              onClick={() => setShowRestoreConfirm(true)}
              disabled={syncStatus.isSyncing}
              className="inline-flex items-center gap-1.5 bg-warm-dark hover:bg-warm-border/50 text-warm-text font-medium border border-warm-border px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
              title="טען נתונים מקובץ הגיבוי ב-Google Drive"
            >
              <Download size={14} />
              <span>שחזר מדרייב</span>
            </button>

            {syncStatus.fileUrl && (
              <a
                href={syncStatus.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-warm-muted hover:text-warm-text bg-warm-dark hover:bg-warm-border/50 border border-warm-border px-3 py-2 rounded-xl transition-all"
                title="הצג קובץ ב-Google Drive"
              >
                <ExternalLink size={14} />
                <span className="hidden sm:inline">הצג ב-Drive</span>
              </a>
            )}

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-xl transition-all cursor-pointer"
              title="התנתק"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Restore confirmation modal */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-warm-card border border-warm-border rounded-2xl p-6 max-w-md w-full shadow-xl text-right">
            <h3 className="text-base font-bold text-warm-text mb-2">שחזור נתונים מ-Google Drive</h3>
            <p className="text-sm text-warm-muted mb-6 leading-relaxed">
              פעולה זו תוריד את קובץ הגיבוי מ-Google Drive ותחליף/תעדכן את היומן המקומי. האם להמשיך?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRestoreConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-warm-muted hover:text-warm-text border border-warm-border cursor-pointer"
              >
                ביטול
              </button>
              <button
                onClick={handleConfirmRestore}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                אישור ושחזור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
