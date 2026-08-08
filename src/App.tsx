import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { MigraineLog, DEFAULT_SYMPTOMS, DEFAULT_TRIGGERS, DEFAULT_REMEDIES } from "./types";
import MigraineForm from "./components/MigraineForm";
import AnalyticsPanel from "./components/AnalyticsPanel";
import AiInsights from "./components/AiInsights";
import GoogleDriveHeader from "./components/GoogleDriveHeader";
import { initAuth, googleSignIn, logout } from "./lib/firebase";
import { 
  findOrCreateDriveFile, 
  syncLogsToDrive, 
  restoreLogsFromDrive, 
  DriveSyncStatus 
} from "./lib/googleDriveSync";
import { 
  Plus, 
  Calendar, 
  TrendingUp, 
  Brain, 
  AlertCircle, 
  Clock, 
  MapPin, 
  Activity, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  CheckCircle,
  Sparkles
} from "lucide-react";

export default function App() {
  const [logs, setLogs] = useState<MigraineLog[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<MigraineLog | null>(null);
  const [activeTab, setActiveTab] = useState<"history" | "analytics" | "ai">("history");

  // Google Auth & Drive Sync state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [driveSyncStatus, setDriveSyncStatus] = useState<DriveSyncStatus>({
    lastSynced: null,
    fileUrl: null,
    fileId: null,
    isSyncing: false,
    error: null,
  });

  // Live tracker for ongoing attack duration
  const [activeAttackDuration, setActiveAttackDuration] = useState<string>("");

  // Initialize Auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (u, token) => {
        setUser(u);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const performDriveSync = async (targetLogs: MigraineLog[], tokenToUse: string, forceFileId?: string) => {
    setDriveSyncStatus((prev) => ({ ...prev, isSyncing: true, error: null }));
    try {
      let fileId = forceFileId || driveSyncStatus.fileId;
      let fileUrl = driveSyncStatus.fileUrl;

      if (!fileId) {
        const fileInfo = await findOrCreateDriveFile(tokenToUse);
        fileId = fileInfo.id;
        fileUrl = fileInfo.webViewLink || null;
      }

      await syncLogsToDrive(tokenToUse, fileId, targetLogs);

      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");

      setDriveSyncStatus({
        lastSynced: `${day}/${month}/${year} ${hours}:${minutes}`,
        fileUrl: fileUrl,
        fileId: fileId,
        isSyncing: false,
        error: null,
      });
    } catch (err: any) {
      console.error("Google Drive sync error:", err);
      setDriveSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        error: err.message || "שגיאה בסנכרון ל-Google Drive",
      }));
    }
  };

  // Sync to Google Drive when user is logged in and logs change
  useEffect(() => {
    if (user && accessToken) {
      performDriveSync(logs, accessToken);
    }
  }, [user, accessToken, logs]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        await performDriveSync(logs, result.accessToken);
      }
    } catch (err: any) {
      console.error("Drive Login failed:", err);
      setDriveSyncStatus((prev) => ({
        ...prev,
        error: err?.message || "התחברות לגוגל נכשלה. אנא נסה שנית.",
      }));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setDriveSyncStatus({
      lastSynced: null,
      fileUrl: null,
      fileId: null,
      isSyncing: false,
      error: null,
    });
  };

  const handleManualDriveSync = () => {
    if (user && accessToken) {
      performDriveSync(logs, accessToken);
    } else {
      handleGoogleLogin();
    }
  };

  const handleRestoreFromDrive = async () => {
    if (!user || !accessToken) return;
    setDriveSyncStatus((prev) => ({ ...prev, isSyncing: true, error: null }));
    try {
      let fileId = driveSyncStatus.fileId;
      if (!fileId) {
        const fileInfo = await findOrCreateDriveFile(accessToken);
        fileId = fileInfo.id;
      }
      const restoredLogs = await restoreLogsFromDrive(accessToken, fileId);
      if (restoredLogs && restoredLogs.length > 0) {
        saveLogsToStorage(restoredLogs);
        alert(`שוחזרו בהצלחה ${restoredLogs.length} רשומות מ-Google Drive!`);
      } else {
        alert("לא נמצאו רשומות בקובץ הגיבוי ב-Google Drive.");
      }
      setDriveSyncStatus((prev) => ({ ...prev, isSyncing: false }));
    } catch (err: any) {
      console.error("Restore error:", err);
      setDriveSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        error: err.message || "שגיאה בשחזור הנתונים מ-Google Drive",
      }));
    }
  };

  // Load logs on mount
  useEffect(() => {
    const saved = localStorage.getItem("migraine_logs");
    if (saved) {
      try {
        setLogs(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse migraine logs:", e);
      }
    }
  }, []);

  // Save logs to local storage
  const saveLogsToStorage = (newLogs: MigraineLog[]) => {
    setLogs(newLogs);
    localStorage.setItem("migraine_logs", JSON.stringify(newLogs));
  };

  // Check for active ongoing attacks and update the duration timer
  const activeAttack = logs.find(log => log.endTime === null);

  useEffect(() => {
    if (!activeAttack) {
      setActiveAttackDuration("");
      return;
    }

    const updateDuration = () => {
      const start = new Date(activeAttack.startTime).getTime();
      const now = new Date().getTime();
      const diffMs = now - start;

      if (diffMs < 0) {
        setActiveAttackDuration("התחיל כעת");
        return;
      }

      const diffMins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;

      if (hours === 0) {
        setActiveAttackDuration(`${mins} דקות`);
      } else {
        setActiveAttackDuration(`${hours} שעות ו-${mins} דקות`);
      }
    };

    updateDuration();
    const interval = setInterval(updateDuration, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [activeAttack, logs]);

  const handleSaveLog = (formLog: Omit<MigraineLog, "id"> & { id?: string }) => {
    let updatedLogs: MigraineLog[];

    if (formLog.id) {
      // Edit existing
      updatedLogs = logs.map(l => l.id === formLog.id ? (formLog as MigraineLog) : l);
    } else {
      // Add new
      const newLog: MigraineLog = {
        ...formLog,
        id: Math.random().toString(36).substring(2, 9),
      };
      updatedLogs = [newLog, ...logs];
    }

    // Sort by start date-time descending
    updatedLogs.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    saveLogsToStorage(updatedLogs);
    setIsFormOpen(false);
    setEditingLog(null);
  };

  const handleDeleteLog = (id: string) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק רשומה זו?")) {
      const updated = logs.filter(l => l.id !== id);
      saveLogsToStorage(updated);
    }
  };

  const handleEditLog = (log: MigraineLog) => {
    setEditingLog(log);
    setIsFormOpen(true);
  };

  // Translate Pain Location IDs to Hebrew Labels
  const getLocationLabel = (id: string) => {
    switch (id) {
      case "right": return "צד ימין";
      case "left": return "צד שמאל";
      case "forehead": return "מצח";
      case "occipital": return "עורף";
      case "diffuse": return "כל הראש";
      default: return id;
    }
  };

  // Format date helper
  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  };

  // Helper to get duration text of completed attack
  const getCompletedDuration = (start: string, end: string) => {
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    if (diffMs <= 0) return "פחות מדקה";
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hours === 0) {
      return `${mins} דקות`;
    }
    if (mins === 0) {
      return `${hours} שעות`;
    }
    return `${hours} שעות ו-${mins} דקות`;
  };

  return (
    <div id="app-root" className="min-h-screen bg-warm-dark text-warm-text pb-16">
      {/* Upper Navigation Bar */}
      <header className="border-b border-warm-border/60 bg-warm-card/80 backdrop-blur-md sticky top-0 z-40 px-4 py-4 md:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sunset/15 border border-sunset/30 flex items-center justify-center text-sunset shadow-inner">
              <Activity size={20} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-warm-text flex items-center gap-2">
                מעקב מיגרנה
                {activeAttack && (
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </h1>
              <p className="text-[10px] text-warm-muted">יומן הבריאות וזיהוי הטריגרים האישי שלך</p>
            </div>
          </div>

          <button
            id="add-attack-header-btn"
            onClick={() => {
              setEditingLog(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 bg-sunset hover:bg-sunset-hover text-warm-dark font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
          >
            <Plus size={14} />
            דיווח על התקף
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {/* Google Drive Integration Header */}
        <GoogleDriveHeader
          user={user}
          syncStatus={driveSyncStatus}
          isLoggingIn={isLoggingIn}
          onLogin={handleGoogleLogin}
          onLogout={handleGoogleLogout}
          onSyncNow={handleManualDriveSync}
          onRestore={handleRestoreFromDrive}
        />

        {/* Active Attack Notification Banner */}
        {activeAttack && (
          <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-red-500/20 text-red-400 rounded-xl mt-0.5 shrink-0 pulse-glow">
                <AlertCircle size={20} />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-red-400">יש לך התקף פעיל כעת</h4>
                <p className="text-xs text-warm-muted">
                  התחיל ב-{formatDate(activeAttack.startTime)} בשעה {formatTime(activeAttack.startTime)} (כבר {activeAttackDuration})
                </p>
                <p className="text-[11px] text-warm-muted mt-1 leading-relaxed">
                  הכאב ממוקד ב<strong className="text-warm-text">{getLocationLabel(activeAttack.location)}</strong>, עוצמה <strong className="text-warm-text">{activeAttack.intensity}/10</strong>. זכור לנוח בחדר חשוך ושקט.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => handleEditLog(activeAttack)}
              className="px-4 py-2.5 bg-red-500 text-white hover:bg-red-600 rounded-xl text-xs font-bold transition-all shadow-lg self-start md:self-auto flex items-center gap-1"
            >
              <CheckCircle size={14} />
              לסיום ועדכון התקף
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex bg-warm-card/60 p-1 rounded-xl border border-warm-border/60">
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "history"
                ? "bg-warm-border text-warm-text shadow-sm"
                : "text-warm-muted hover:text-warm-text"
            }`}
          >
            <Calendar size={14} />
            יומן התקפים
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex-1 py-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "analytics"
                ? "bg-warm-border text-warm-text shadow-sm"
                : "text-warm-muted hover:text-warm-text"
            }`}
          >
            <TrendingUp size={14} />
            גרפים וסטטיסטיקה
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex-1 py-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "ai"
                ? "bg-warm-border text-warm-text shadow-sm"
                : "text-warm-muted hover:text-warm-text"
            }`}
          >
            <Brain size={14} />
            ניתוח חכם AI
            {logs.length > 0 && <span className="px-1.5 py-0.5 text-[8px] bg-sunset/20 text-sunset border border-sunset/30 rounded-full font-bold">חדש</span>}
          </button>
        </div>

        {/* Tab content */}
        <div className="transition-all duration-200">
          {activeTab === "history" && (
            <div className="space-y-4">
              {logs.length === 0 ? (
                /* Empty state */
                <div className="bg-warm-card border border-warm-border rounded-2xl p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-warm-border/40 rounded-full flex items-center justify-center mx-auto text-warm-muted">
                    <Calendar size={28} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-warm-text">יומן המיגרנות שלך ריק</h3>
                    <p className="text-xs text-warm-muted max-w-sm mx-auto leading-relaxed">
                      כאן תוכל לראות את כל היסטוריית הדיווחים שלך. תיעוד התקפים בזמן אמת יעזור לזהות מגמות ולשתף מידע מדויק עם הרופא/ה שלך.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingLog(null);
                      setIsFormOpen(true);
                    }}
                    className="px-5 py-3 bg-sunset hover:bg-sunset-hover text-warm-dark font-bold text-xs rounded-xl transition-all shadow-md inline-flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    דיווח על התקף ראשון
                  </button>
                </div>
              ) : (
                /* Logs list */
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <h3 className="text-xs font-bold text-warm-muted">רשימת ההתקפים האחרונים ({logs.length})</h3>
                  </div>

                  {logs.map((log) => {
                    const painColor = 
                      log.intensity <= 3 
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
                        : log.intensity <= 6 
                        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        : log.intensity <= 8
                        ? "text-orange-400 bg-orange-500/10 border-orange-500/20"
                        : "text-red-400 bg-red-500/10 border-red-500/20";

                    return (
                      <div 
                        key={log.id} 
                        className={`bg-warm-card border rounded-2xl p-5 hover:border-warm-muted/60 transition-all ${
                          log.endTime === null ? "border-red-500/30 ring-1 ring-red-500/20" : "border-warm-border"
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex justify-between items-start gap-4 pb-3 border-b border-warm-border/40">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-warm-text">{formatDate(log.startTime)}</span>
                              {log.endTime === null && (
                                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-[9px] font-bold pulse-glow">
                                  פעיל כעת
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-warm-muted mt-1 flex items-center gap-1">
                              <Clock size={12} className="text-warm-muted" />
                              <span>{formatTime(log.startTime)}</span>
                              {log.endTime ? (
                                <>
                                  <span>←</span>
                                  <span>{formatTime(log.endTime)}</span>
                                  <span className="text-warm-muted/70">({getCompletedDuration(log.startTime, log.endTime)})</span>
                                </>
                              ) : (
                                <span className="text-red-400">(מתמשך...)</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${painColor}`}>
                              כאב {log.intensity}
                            </span>
                            
                            {/* Card Menu actions */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEditLog(log)}
                                className="p-1.5 hover:bg-warm-dark rounded text-warm-muted hover:text-warm-text transition-colors"
                                title="ערוך רשומה"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteLog(log.id)}
                                className="p-1.5 hover:bg-warm-dark rounded text-warm-muted hover:text-red-400 transition-colors"
                                title="מחק רשומה"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Card Content body */}
                        <div className="pt-3 space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1.5 text-warm-text/90">
                              <span className="text-warm-muted shrink-0">📍 מיקום כאב:</span>
                              <span className="font-medium bg-warm-dark/50 px-2 py-0.5 rounded border border-warm-border/40 text-[11px]">
                                {getLocationLabel(log.location)}
                              </span>
                            </div>

                            {log.symptoms.length > 0 && (
                              <div className="flex items-start gap-1.5 text-warm-text/90">
                                <span className="text-warm-muted shrink-0">💫 תסמינים:</span>
                                <div className="flex flex-wrap gap-1">
                                  {log.symptoms.map(s => {
                                    const def = DEFAULT_SYMPTOMS.find(x => x.id === s);
                                    return (
                                      <span key={s} className="bg-warm-dark/40 border border-warm-border px-1.5 py-0.5 rounded text-[10px] text-warm-text">
                                        {def ? `${def.icon} ${def.label}` : s}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {log.triggers.length > 0 && (
                              <div className="flex items-start gap-1.5 text-warm-text/90 md:col-span-2">
                                <span className="text-warm-muted shrink-0">⚡ טריגרים:</span>
                                <div className="flex flex-wrap gap-1">
                                  {log.triggers.map(t => {
                                    const def = DEFAULT_TRIGGERS.find(x => x.id === t);
                                    return (
                                      <span key={t} className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded text-[10px]">
                                        {def ? `${def.icon} ${def.label}` : t}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {log.remedies.length > 0 && (
                              <div className="flex items-start gap-1.5 text-warm-text/90 md:col-span-2">
                                <span className="text-warm-muted shrink-0">💊 טיפולים:</span>
                                <div className="flex flex-wrap gap-1">
                                  {log.remedies.map(r => {
                                    const def = DEFAULT_REMEDIES.find(x => x.id === r);
                                    return (
                                      <span key={r} className="bg-sage/15 border border-sage/20 text-sage px-1.5 py-0.5 rounded text-[10px]">
                                        {def ? def.label : r}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {log.notes && (
                            <div className="bg-warm-dark/30 p-2.5 rounded-lg border border-warm-border/40 text-xs text-warm-muted italic mt-1 leading-relaxed">
                              "{log.notes}"
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "analytics" && (
            <AnalyticsPanel logs={logs} />
          )}

          {activeTab === "ai" && (
            <AiInsights logs={logs} />
          )}
        </div>
      </main>

      {/* Floating Plus button on mobile */}
      <div className="fixed bottom-6 left-6 z-30 md:hidden">
        <button
          onClick={() => {
            setEditingLog(null);
            setIsFormOpen(true);
          }}
          className="w-14 h-14 rounded-full bg-sunset text-warm-dark flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Form Dialog modal */}
      {isFormOpen && (
        <MigraineForm
          onSave={handleSaveLog}
          onClose={() => {
            setIsFormOpen(false);
            setEditingLog(null);
          }}
          initialLog={editingLog}
        />
      )}
    </div>
  );
}
