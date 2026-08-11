import React, { useState, useRef, useEffect } from "react";
import { User } from "firebase/auth";
import { 
  RefreshCw, 
  Download, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Cloud, 
  ExternalLink, 
  ChevronDown, 
  User as UserIcon,
  Globe
} from "lucide-react";
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
  const [isOpen, setIsOpen] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isInIframe = typeof window !== "undefined" && window.self !== window.top;

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleOpenNewTab = () => {
    window.open(window.location.href, "_blank");
  };

  const handleConfirmRestore = () => {
    setShowRestoreConfirm(false);
    setIsOpen(false);
    onRestore();
  };

  // Logged out state - show Google Connect button in top-left
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onLogin}
          disabled={isLoggingIn}
          className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 active:scale-95 text-warm-text font-medium text-xs px-3.5 py-2 rounded-xl border border-white/10 transition-all shadow-sm cursor-pointer disabled:opacity-50"
          title="התחבר עם Google לגיבוי אוטומטי ב-Drive"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>{isLoggingIn ? "מתחבר..." : "התחברות Google"}</span>
        </button>

        {isInIframe && (
          <button
            onClick={handleOpenNewTab}
            className="p-2 text-warm-muted hover:text-warm-text hover:bg-white/5 rounded-xl border border-white/10 transition-colors"
            title="פתח בלשונית חדשה להתחברות קלה ללא חסימת פופאפ"
          >
            <Globe size={15} />
          </button>
        )}
      </div>
    );
  }

  // Logged in state - User Avatar + Menu Dropdown in top-left
  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button Trigger */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 transition-all focus:outline-none cursor-pointer"
        title={user.displayName || user.email || "תפריט משתמש"}
      >
        <div className="relative shrink-0">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || "משתמש"}
              className="w-8 h-8 rounded-full object-cover border border-sunset/40"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-sunset/20 text-sunset flex items-center justify-center font-bold text-sm border border-sunset/40">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon size={16} />}
            </div>
          )}

          {/* Sync Status Live Indicator Dot */}
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center">
            {syncStatus.isSyncing ? (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sunset opacity-75"></span>
            ) : null}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                syncStatus.error
                  ? "bg-rose-500"
                  : syncStatus.isSyncing
                  ? "bg-sunset"
                  : "bg-emerald-500"
              }`}
            />
          </span>
        </div>

        <span className="text-xs font-semibold text-warm-text max-w-[90px] sm:max-w-[130px] truncate hidden sm:inline">
          {user.displayName || user.email?.split("@")[0]}
        </span>

        <ChevronDown size={14} className={`text-warm-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* User Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 rounded-2xl bg-warm-card border border-white/15 shadow-2xl p-4 z-50 text-warm-text animate-in fade-in zoom-in-95 duration-150">
          {/* Header - User Info */}
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "משתמש"}
                className="w-10 h-10 rounded-full object-cover border border-sunset/40 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-sunset/20 text-sunset flex items-center justify-center font-bold text-lg border border-sunset/40 shrink-0">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon size={20} />}
              </div>
            )}
            <div className="overflow-hidden text-right flex-1">
              <h4 className="font-bold text-sm text-warm-text truncate">{user.displayName || "משתמש מחובר"}</h4>
              <p className="text-[11px] text-warm-muted truncate dir-ltr text-right">{user.email}</p>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium mt-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <Cloud size={10} /> מחובר ל-Google Drive
              </span>
            </div>
          </div>

          {/* Sync Status Section */}
          <div className="py-3 border-b border-white/10 space-y-2.5 text-right">
            <div className="flex items-center justify-between text-xs">
              <span className="text-warm-muted">סטטוס סנכרון:</span>
              {syncStatus.isSyncing ? (
                <span className="text-sunset flex items-center gap-1 font-medium">
                  <RefreshCw size={12} className="animate-spin" /> מסנכרן כעת...
                </span>
              ) : syncStatus.error ? (
                <span className="text-rose-400 flex items-center gap-1 font-medium" title={syncStatus.error}>
                  <AlertCircle size={12} /> שגיאת סנכרון
                </span>
              ) : syncStatus.lastSynced ? (
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 size={12} /> מעודכן ({syncStatus.lastSynced})
                </span>
              ) : (
                <span className="text-warm-muted">טרם בוצע סנכרון</span>
              )}
            </div>

            {/* Error detail if any */}
            {syncStatus.error && (
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300">
                {syncStatus.error}
              </div>
            )}

            {/* Sync / Restore Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  onSyncNow();
                }}
                disabled={syncStatus.isSyncing}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-white/5 hover:bg-white/10 text-warm-text rounded-xl border border-white/10 text-xs font-medium transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                title="סנכרן כעת ל-Google Drive"
              >
                <RefreshCw size={13} className={syncStatus.isSyncing ? "animate-spin" : ""} />
                <span>סנכרן כעת</span>
              </button>

              <button
                onClick={() => setShowRestoreConfirm(true)}
                disabled={syncStatus.isSyncing}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-white/5 hover:bg-white/10 text-warm-text rounded-xl border border-white/10 text-xs font-medium transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                title="שחזר גיבוי מ-Google Drive"
              >
                <Download size={13} />
                <span>שחזר גיבוי</span>
              </button>
            </div>

            {/* View File in Google Drive Link */}
            {syncStatus.fileUrl && (
              <a
                href={syncStatus.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-[11px] text-sunset hover:underline pt-1 font-medium"
              >
                <span>הצג קובץ גיבוי ב-Drive</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>

          {/* Logout Action */}
          <div className="pt-2">
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors text-xs font-medium cursor-pointer"
            >
              <span>התנתק מחשבון Google</span>
              <LogOut size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Restore confirmation modal */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-warm-card border border-warm-border rounded-2xl p-6 max-w-md w-full shadow-2xl text-right animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-warm-text mb-2">שחזור נתונים מ-Google Drive</h3>
            <p className="text-sm text-warm-muted mb-6 leading-relaxed">
              פעולה זו תוריד את קובץ הגיבוי מ-Google Drive ותעדכן את הנתונים המקומיים שלך. האם להמשיך?
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
                className="px-4 py-2 rounded-xl text-xs font-medium bg-sunset hover:bg-sunset-hover text-warm-dark font-bold cursor-pointer transition-all"
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
