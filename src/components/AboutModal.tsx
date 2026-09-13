import React, { useEffect } from "react";
import { Activity, X, Shield, Sparkles, HardDrive, Info } from "lucide-react";
import { APP_VERSION } from "../types";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div 
        className="bg-warm-card border border-warm-border/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-right relative animate-in zoom-in-95 duration-200"
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
        <div className="flex flex-col items-center text-center space-y-3 pb-5 border-b border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-sunset/15 border border-sunset/40 flex items-center justify-center text-sunset shadow-lg shadow-sunset/10">
            <Activity size={32} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-warm-text tracking-tight">
              מעקב מיגרנה
            </h2>
            <p className="text-xs text-warm-muted mt-0.5">Migraine Tracker</p>
          </div>

          {/* Version Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sunset/15 border border-sunset/30 text-sunset text-xs font-semibold">
            <Info size={13} />
            <span>גרסה {APP_VERSION}</span>
          </div>
        </div>

        {/* Description & Features */}
        <div className="py-5 space-y-3.5 text-xs text-warm-text/90 leading-relaxed">
          <p className="text-warm-muted text-center">
            אפליקציה מתקדמת וידידותית למעקב אישי אחר התקפי מיגרנה, מיפוי חזותי של מוקדי הכאב וזיהוי דפוסים וטריגרים.
          </p>

          <div className="space-y-2.5 pt-2">
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
        <div className="pt-2 flex items-center justify-between border-t border-white/10 text-[11px] text-warm-muted">
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
