import React, { useState, useEffect } from "react";
import { 
  Activity, 
  X, 
  Shield, 
  Sparkles, 
  HardDrive, 
  Info, 
  Smartphone, 
  CheckCircle2, 
  Share, 
  PlusSquare,
  ArrowDown
} from "lucide-react";
import { APP_VERSION } from "../types";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Global reference for PWA install event
let deferredInstallPrompt: any = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
  });
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const [isStandalone, setIsStandalone] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect if running in standalone PWA mode
    const standaloneMode = 
      window.matchMedia("(display-mode: standalone)").matches || 
      (window.navigator as any).standalone === true;
    setIsStandalone(standaloneMode);

    // Detect iOS
    const iosDevice = /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIos(iosDevice);

    // Check if install prompt is ready
    if (deferredInstallPrompt) {
      setCanPrompt(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      setCanPrompt(true);
    };

    const handleAppInstalled = () => {
      setInstallSuccess(true);
      setIsStandalone(true);
      setCanPrompt(false);
      deferredInstallPrompt = null;
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isOpen]);

  const handleInstallClick = async () => {
    if (isStandalone) return;

    if (deferredInstallPrompt) {
      try {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === "accepted") {
          setInstallSuccess(true);
          setCanPrompt(false);
          deferredInstallPrompt = null;
        }
      } catch (err) {
        console.error("Install prompt error:", err);
      }
    } else {
      // Toggle manual instructions
      setShowInstructions((prev) => !prev);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div 
        className="bg-warm-card border border-warm-border/80 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl text-right relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-warm-muted hover:text-warm-text hover:bg-white/5 transition-all cursor-pointer"
          title="סגור"
        >
          <X size={18} />
        </button>

        {/* Header with App Logo & Title */}
        <div className="flex flex-col items-center text-center space-y-2.5 pb-4 border-b border-white/10">
          <div className="w-14 h-14 rounded-2xl bg-sunset/15 border border-sunset/40 flex items-center justify-center text-sunset shadow-lg shadow-sunset/10">
            <Activity size={28} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-warm-text tracking-tight">
              מעקב מיגרנה
            </h2>
            <p className="text-xs text-warm-muted mt-0.5">Migraine Tracker</p>
          </div>

          {/* Version Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-sunset/15 border border-sunset/30 text-sunset text-xs font-semibold">
            <Info size={12} />
            <span>גרסה {APP_VERSION}</span>
          </div>
        </div>

        {/* Add to Home Screen Action Section */}
        <div className="py-4 border-b border-white/10 space-y-3">
          {isStandalone || installSuccess ? (
            <div className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-semibold">
              <CheckCircle2 size={16} />
              <span>האפליקציה מותקנת ופועלת ממסך הבית</span>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-sunset hover:bg-sunset-hover active:scale-95 text-warm-dark font-bold text-xs rounded-2xl transition-all shadow-md cursor-pointer"
              >
                <Smartphone size={16} />
                <span>הוסף את האפליקציה למסך הבית</span>
              </button>

              {/* Instructions Guide (for iOS or browsers without direct prompt) */}
              {showInstructions && (
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl text-[11px] text-warm-text/90 space-y-2 animate-in fade-in duration-150">
                  {isIos ? (
                    <div className="space-y-1.5">
                      <p className="font-bold text-sunset flex items-center gap-1">
                        <Share size={13} />
                        <span>הוראות התקנה באייפון / אייפד (Safari):</span>
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-warm-muted pr-1">
                        <li>לחץ על כפתור השיתוף בתחתית המסך <strong>(Share / ⎋)</strong>.</li>
                        <li>גלול בתפריט ובחר ב-<strong>"הוסף למסך הבית" (Add to Home Screen)</strong> <PlusSquare size={12} className="inline mr-0.5" />.</li>
                        <li>אשר בלחיצה על <strong>"הוסף" (Add)</strong> בפינה העליונה.</li>
                      </ol>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="font-bold text-sunset flex items-center gap-1">
                        <ArrowDown size={13} />
                        <span>הוראות התקנה בדפדפן:</span>
                      </p>
                      <p className="text-warm-muted leading-relaxed">
                        לחץ על תפריט הדפדפן <strong>(3 נקודות ⋮)</strong> או על סמל ההתקנה בשורת הכתובת, ובחר ב-<strong>"התקן אפליקציה"</strong> או <strong>"הוסף למסך הבית"</strong>.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description & Features */}
        <div className="py-4 space-y-3 text-xs text-warm-text/90 leading-relaxed">
          <p className="text-warm-muted text-center text-[11px]">
            אפליקציה מתקדמת וידידותית למעקב אישי אחר התקפי מיגרנה, מיפוי חזותי של מוקדי הכאב וזיהוי דפוסים וטריגרים.
          </p>

          <div className="space-y-2 pt-1">
            <div className="flex items-start gap-2.5 bg-white/5 p-2.5 rounded-xl border border-white/5">
              <Shield size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-warm-text">פרטיות מלאה: </span>
                <span className="text-warm-muted">כל הנתונים נשמרים במכשירך בלבד ובקובץ הגיבוי האישי שלך ב-Google Drive.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-white/5 p-2.5 rounded-xl border border-white/5">
              <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-warm-text">ניתוח חכם AI: </span>
                <span className="text-warm-muted">זיהוי טריגרים מרכזיים והפקת סיכום רפואי מרוכז לנוירולוג או רופא משפחה.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-white/5 p-2.5 rounded-xl border border-white/5">
              <HardDrive size={16} className="text-sky-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-warm-text">גיבוי ענן ישיר: </span>
                <span className="text-warm-muted">סנכרון מאובטח מול Google Drive המאפשר שחזור קל בכל עת.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 flex items-center justify-between border-t border-white/10 text-[11px] text-warm-muted">
          <span>v{APP_VERSION}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 active:scale-95 text-warm-text rounded-xl font-medium transition-all cursor-pointer"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
}
