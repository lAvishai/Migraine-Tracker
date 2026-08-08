import React, { useState, useEffect } from "react";
import { MigraineLog, PAIN_LOCATIONS, DEFAULT_SYMPTOMS, DEFAULT_TRIGGERS, DEFAULT_REMEDIES } from "../types";
import { X, Clock, HelpCircle, AlertCircle, Save, Calendar } from "lucide-react";

interface MigraineFormProps {
  onSave: (log: Omit<MigraineLog, "id"> & { id?: string }) => void;
  onClose: () => void;
  initialLog?: MigraineLog | null;
}

export default function MigraineForm({ onSave, onClose, initialLog }: MigraineFormProps) {
  const [startDate, setStartDate] = useState(""); // "dd/mm/yyyy"
  const [startTime, setStartTime] = useState(""); // "hh:mm"
  const [endDate, setEndDate] = useState(""); // "dd/mm/yyyy"
  const [endTime, setEndTime] = useState(""); // "hh:mm"
  const [isOngoing, setIsOngoing] = useState(true);
  const [intensity, setIntensity] = useState<number>(5);
  const [location, setLocation] = useState<string>("forehead");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [selectedRemedies, setSelectedRemedies] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  // Helper to format date parts from Date object
  const formatDateParts = (d: Date) => {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return {
      date: `${day}/${month}/${year}`,
      time: `${hours}:${minutes}`
    };
  };

  // Initialize form if editing
  useEffect(() => {
    if (initialLog) {
      const startParts = formatDateParts(new Date(initialLog.startTime));
      setStartDate(startParts.date);
      setStartTime(startParts.time);

      if (initialLog.endTime) {
        const endParts = formatDateParts(new Date(initialLog.endTime));
        setEndDate(endParts.date);
        setEndTime(endParts.time);
        setIsOngoing(false);
      } else {
        setEndDate("");
        setEndTime("");
        setIsOngoing(true);
      }

      setIntensity(initialLog.intensity);
      setLocation(initialLog.location);
      setSelectedSymptoms(initialLog.symptoms);
      setSelectedTriggers(initialLog.triggers);
      setSelectedRemedies(initialLog.remedies);
      setNotes(initialLog.notes);
    } else {
      // Set current local time as default start time
      const nowParts = formatDateParts(new Date());
      setStartDate(nowParts.date);
      setStartTime(nowParts.time);
      setIsOngoing(true);
    }
  }, [initialLog]);

  // Check validity of date dd/mm/yyyy
  const isValidDate = (dateStr: string) => {
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateStr.match(dateRegex);
    if (!match) return false;
    const [, d, m, y] = match;
    const day = Number(d);
    const month = Number(m);
    const year = Number(y);

    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > 2100) return false;

    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  // Check validity of time hh:mm
  const isValidTime = (timeStr: string) => {
    const timeRegex = /^(\d{2}):(\d{2})$/;
    const match = timeStr.match(timeRegex);
    if (!match) return false;
    const [, h, m] = match;
    const hrs = Number(h);
    const mins = Number(m);
    return hrs >= 0 && hrs < 24 && mins >= 0 && mins < 60;
  };

  // Convert "dd/mm/yyyy" -> "yyyy-mm-dd" for HTML5 date picker
  const ddmmyyyyToYyyymmdd = (ddmmyyyy: string): string => {
    if (!ddmmyyyy) return "";
    const match = ddmmyyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return "";
    const [, d, m, y] = match;
    return `${y}-${m}-${d}`;
  };

  // Convert "yyyy-mm-dd" -> "dd/mm/yyyy"
  const yyyymmddToDdmmyyyy = (yyyymmdd: string): string => {
    if (!yyyymmdd) return "";
    const parts = yyyymmdd.split("-");
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${d}/${m}/${y}`;
    }
    return "";
  };

  // Convert custom date & time back to ISO string
  const parseDateTimeToISO = (dateStr: string, timeStr: string) => {
    if (!isValidDate(dateStr) || !isValidTime(timeStr)) return null;
    const [, d, m, y] = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)!;
    const [, h, min] = timeStr.match(/^(\d{2}):(\d{2})$/)!;
    const date = new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min));
    return date.toISOString();
  };

  // Format typing input to dd/mm/yyyy
  const handleDateChange = (val: string, setter: (v: string) => void) => {
    setFormError("");
    let filtered = val.replace(/[^0-9/]/g, "");
    let cleaned = filtered.replace(/\//g, "");
    let formatted = "";
    if (cleaned.length > 0) {
      formatted += cleaned.slice(0, 2);
    }
    if (cleaned.length > 2) {
      formatted += "/" + cleaned.slice(2, 4);
    }
    if (cleaned.length > 4) {
      formatted += "/" + cleaned.slice(4, 8);
    }
    setter(formatted);
  };

  // Format typing input to hh:mm
  const handleTimeChange = (val: string, setter: (v: string) => void) => {
    setFormError("");
    let filtered = val.replace(/[^0-9:]/g, "");
    let cleaned = filtered.replace(/:/g, "");
    let formatted = "";
    if (cleaned.length > 0) {
      formatted += cleaned.slice(0, 2);
    }
    if (cleaned.length > 2) {
      formatted += ":" + cleaned.slice(2, 4);
    }
    setter(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidDate(startDate)) {
      setFormError("תאריך תחילת ההתקף אינו תקין. השתמש בפורמט dd/mm/yyyy");
      return;
    }
    if (!isValidTime(startTime)) {
      setFormError("שעת תחילת ההתקף אינה תקינה. השתמש בפורמט hh:mm");
      return;
    }

    const startISO = parseDateTimeToISO(startDate, startTime);
    if (!startISO) {
      setFormError("שגיאה בפענוח תאריך ההתחלה.");
      return;
    }

    let endISO: string | null = null;
    if (!isOngoing) {
      if (!isValidDate(endDate)) {
        setFormError("תאריך סיום ההתקף אינו תקין. השתמש בפורמט dd/mm/yyyy");
        return;
      }
      if (!isValidTime(endTime)) {
        setFormError("שעת סיום ההתקף אינה תקינה. השתמש בפורמט hh:mm");
        return;
      }

      endISO = parseDateTimeToISO(endDate, endTime);
      if (!endISO) {
        setFormError("שגיאה בפענוח תאריך הסיום.");
        return;
      }

      if (new Date(endISO).getTime() < new Date(startISO).getTime()) {
        setFormError("זמן סיום ההתקף אינו יכול להיות לפני זמן תחילתו.");
        return;
      }
    }

    setFormError("");
    onSave({
      ...(initialLog ? { id: initialLog.id } : {}),
      startTime: startISO,
      endTime: endISO,
      intensity,
      location,
      symptoms: selectedSymptoms,
      triggers: selectedTriggers,
      remedies: selectedRemedies,
      notes,
    });
  };

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleTrigger = (id: string) => {
    setSelectedTriggers((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleRemedy = (id: string) => {
    setSelectedRemedies((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Get face emoji based on intensity
  const getIntensityEmoji = (val: number) => {
    if (val <= 3) return "😌";
    if (val <= 6) return "😐";
    if (val <= 8) return "😣";
    return "🌋";
  };

  const getIntensityColor = (val: number) => {
    if (val <= 3) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (val <= 6) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    if (val <= 8) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div 
        id="migraine-form-container"
        className="bg-warm-card border border-warm-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-warm-border sticky top-0 bg-warm-card z-10">
          <div>
            <h2 id="form-title" className="text-xl font-bold text-warm-text">
              {initialLog ? "עריכת דיווח התקף" : "דיווח על התקף חדש"}
            </h2>
            <p className="text-xs text-warm-muted mt-1">מלא את הפרטים למעקב מדויק וניתוח דפוסים</p>
          </div>
          <button 
            id="close-form-btn"
            onClick={onClose} 
            className="p-2 hover:bg-warm-border rounded-lg text-warm-muted hover:text-warm-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8 flex-1">
          {/* Times */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-text mb-2 flex items-center gap-1.5">
                <Calendar size={16} className="text-sunset" />
                זמן תחילת ההתקף (תאריכון ושעה)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="date"
                    required
                    value={ddmmyyyyToYyyymmdd(startDate)}
                    onChange={(e) => {
                      if (e.target.value) {
                        setStartDate(yyyymmddToDdmmyyyy(e.target.value));
                        setFormError("");
                      }
                    }}
                    className={`w-full bg-warm-dark border rounded-xl px-3 py-3 text-warm-text focus:outline-none focus:border-sunset transition-colors text-sm text-center font-mono cursor-pointer [color-scheme:dark] ${
                      startDate && !isValidDate(startDate) ? "border-red-500/50 text-red-400" : "border-warm-border"
                    }`}
                  />
                  <span className="text-[10px] text-warm-muted block mt-1 text-center">📅 בחירת תאריך מלוח השנה</span>
                </div>
                <div>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      setFormError("");
                    }}
                    className={`w-full bg-warm-dark border rounded-xl px-3 py-3 text-warm-text focus:outline-none focus:border-sunset transition-colors text-sm text-center font-mono cursor-pointer [color-scheme:dark] ${
                      startTime && !isValidTime(startTime) ? "border-red-500/50 text-red-400" : "border-warm-border"
                    }`}
                  />
                  <span className="text-[10px] text-warm-muted block mt-1 text-center">⏰ שעה : דקות</span>
                </div>
              </div>
              {startDate && startTime && isValidDate(startDate) && isValidTime(startTime) && (
                <p className="text-[11px] text-sunset mt-2.5 px-1 font-medium text-center bg-sunset/5 py-1.5 rounded-lg border border-sunset/10">
                  📅 תחילת התקף: {startDate} בשעה {startTime}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-text mb-2 flex items-center gap-1.5">
                <Clock size={16} className="text-sage" />
                מצב ההתקף כעת
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsOngoing(true)}
                  className={`py-3 px-4 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                    isOngoing
                      ? "bg-sunset/20 border-sunset text-sunset font-semibold"
                      : "bg-warm-dark border-warm-border text-warm-muted hover:border-warm-muted"
                  }`}
                >
                  🔴 עדיין פעיל
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOngoing(false);
                    if (!endDate) {
                      setEndDate(startDate || formatDateParts(new Date()).date);
                    }
                    if (!endTime) {
                      setEndTime(formatDateParts(new Date()).time);
                    }
                  }}
                  className={`py-3 px-4 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                    !isOngoing
                      ? "bg-sage/20 border-sage text-sage font-semibold"
                      : "bg-warm-dark border-warm-border text-warm-muted hover:border-warm-muted"
                  }`}
                >
                  ✅ הסתיים
                </button>
              </div>
            </div>

            {!isOngoing && (
              <div className="md:col-span-2 animate-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-medium text-warm-text mb-2 flex items-center gap-1.5">
                  <Calendar size={16} className="text-sage" />
                  זמן סיום ההתקף (תאריכון ושעה)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="date"
                      required={!isOngoing}
                      value={ddmmyyyyToYyyymmdd(endDate)}
                      onChange={(e) => {
                        if (e.target.value) {
                          setEndDate(yyyymmddToDdmmyyyy(e.target.value));
                          setFormError("");
                        }
                      }}
                      className={`w-full bg-warm-dark border rounded-xl px-3 py-3 text-warm-text focus:outline-none focus:border-sunset transition-colors text-sm text-center font-mono cursor-pointer [color-scheme:dark] ${
                        endDate && !isValidDate(endDate) ? "border-red-500/50 text-red-400" : "border-warm-border"
                      }`}
                    />
                    <span className="text-[10px] text-warm-muted block mt-1 text-center">📅 בחירת תאריך מלוח השנה</span>
                  </div>
                  <div>
                    <input
                      type="time"
                      required={!isOngoing}
                      value={endTime}
                      onChange={(e) => {
                        setEndTime(e.target.value);
                        setFormError("");
                      }}
                      className={`w-full bg-warm-dark border rounded-xl px-3 py-3 text-warm-text focus:outline-none focus:border-sunset transition-colors text-sm text-center font-mono cursor-pointer [color-scheme:dark] ${
                        endTime && !isValidTime(endTime) ? "border-red-500/50 text-red-400" : "border-warm-border"
                      }`}
                    />
                    <span className="text-[10px] text-warm-muted block mt-1 text-center">⏰ שעה : דקות</span>
                  </div>
                </div>
                {endDate && endTime && isValidDate(endDate) && isValidTime(endTime) && (
                  <p className="text-[11px] text-sage mt-2.5 px-1 font-medium text-center bg-sage/5 py-1.5 rounded-lg border border-sage/10">
                    📅 סיום התקף: {endDate} בשעה {endTime}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Intensity Slider / Selector */}
          <div className="bg-warm-dark/50 p-5 rounded-2xl border border-warm-border">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-medium text-warm-text flex items-center gap-1.5">
                <AlertCircle size={16} className="text-sunset" />
                רמת עוצמת הכאב
              </label>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getIntensityColor(intensity)}`}>
                רמה {intensity}/10 {getIntensityEmoji(intensity)}
              </span>
            </div>

            <div className="grid grid-cols-10 gap-1 md:gap-2">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => {
                const isActive = intensity === val;
                let activeBg = "bg-sunset";
                if (val <= 3) activeBg = "bg-emerald-500 text-black";
                else if (val <= 6) activeBg = "bg-amber-500 text-black";
                else if (val <= 8) activeBg = "bg-orange-500 text-white";
                else activeBg = "bg-red-500 text-white";

                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setIntensity(val)}
                    className={`h-11 rounded-lg text-sm font-bold border transition-all duration-150 ${
                      isActive
                        ? `${activeBg} border-transparent scale-105 shadow-md`
                        : "bg-warm-dark border-warm-border text-warm-muted hover:border-warm-muted"
                    }`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>

            {/* Scale Description Helper */}
            <div className="flex justify-between text-[10px] text-warm-muted mt-3 px-1">
              <span>קל מאוד (נסבל)</span>
              <span>בינוני (מפריע לתפקוד)</span>
              <span>קשה ביותר (מנטרל לגמרי)</span>
            </div>
          </div>

          {/* Location Picker (Interactive visual representation) */}
          <div>
            <label className="block text-sm font-medium text-warm-text mb-3">
              📍 מיקום הכאב העיקרי
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Left Column: Visual head diagram */}
              <div className="flex justify-center bg-warm-dark p-6 rounded-2xl border border-warm-border h-[220px] relative overflow-hidden">
                {/* SVG Head diagram with highlighted parts */}
                <svg viewBox="0 0 100 120" className="h-full w-auto text-warm-muted">
                  {/* Head outline */}
                  <path
                    d="M50,15 C30,15 25,35 25,55 C25,70 28,80 32,90 C36,100 42,108 50,108 C58,108 64,100 68,90 C72,80 75,70 75,55 C75,35 70,15 50,15 Z"
                    fill="none"
                    stroke="#322e2a"
                    strokeWidth="2"
                  />
                  {/* Neck */}
                  <path d="M38,100 L35,115 L65,115 L62,100" fill="none" stroke="#322e2a" strokeWidth="2" />
                  
                  {/* Ears */}
                  <path d="M25,50 C21,50 21,60 25,62" fill="none" stroke="#322e2a" strokeWidth="2" />
                  <path d="M75,50 C79,50 79,60 75,62" fill="none" stroke="#322e2a" strokeWidth="2" />

                  {/* Highlights depending on selected location */}
                  {location === "right" && (
                    <path
                      d="M50,16 C57,16 74,32 74,55 C74,70 71,78 67,86 C63,94 57,100 50,104"
                      fill="#e28a5f"
                      fillOpacity="0.25"
                      stroke="#e28a5f"
                      strokeWidth="3"
                    />
                  )}
                  {location === "left" && (
                    <path
                      d="M50,16 C43,16 26,32 26,55 C26,70 29,78 33,86 C37,94 43,100 50,104"
                      fill="#e28a5f"
                      fillOpacity="0.25"
                      stroke="#e28a5f"
                      strokeWidth="3"
                    />
                  )}
                  {location === "forehead" && (
                    <ellipse cx="50" cy="35" rx="18" ry="12" fill="#e28a5f" fillOpacity="0.3" stroke="#e28a5f" strokeWidth="2" />
                  )}
                  {location === "occipital" && (
                    <path
                      d="M32,90 C36,100 42,108 50,108 C58,108 64,100 68,90 Z"
                      fill="#e28a5f"
                      fillOpacity="0.3"
                      stroke="#e28a5f"
                      strokeWidth="2"
                    />
                  )}
                  {location === "diffuse" && (
                    <path
                      d="M50,15 C30,15 25,35 25,55 C25,70 28,80 32,90 C36,100 42,108 50,108 C58,108 64,100 68,90 C72,80 75,70 75,55 C75,35 70,15 50,15 Z"
                      fill="#e28a5f"
                      fillOpacity="0.15"
                      stroke="#e28a5f"
                      strokeWidth="3"
                      strokeDasharray="4 2"
                    />
                  )}
                </svg>

                <div className="absolute bottom-3 text-[10px] text-warm-muted bg-warm-card px-2 py-1 rounded-md border border-warm-border">
                  המחשה חזותית של האזור הכואב
                </div>
              </div>

              {/* Right Column: Radio buttons list */}
              <div className="space-y-2">
                {PAIN_LOCATIONS.map((loc) => {
                  const isSelected = location === loc.id;
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setLocation(loc.id)}
                      className={`w-full text-right p-3 rounded-xl border text-sm transition-all flex justify-between items-center ${
                        isSelected
                          ? "bg-sunset/10 border-sunset text-warm-text shadow-sm"
                          : "bg-warm-dark border-warm-border text-warm-muted hover:border-warm-muted"
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-warm-text">{loc.label}</div>
                        <div className="text-[11px] text-warm-muted mt-0.5">{loc.description}</div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? "border-sunset" : "border-warm-border"
                      }`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-sunset animate-ping-once" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Symptoms Checklist */}
          <div>
            <label className="block text-sm font-medium text-warm-text mb-3">
              💫 תסמינים נלווים
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {DEFAULT_SYMPTOMS.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym.id);
                return (
                  <button
                    key={sym.id}
                    type="button"
                    onClick={() => toggleSymptom(sym.id)}
                    className={`p-3 rounded-xl border text-xs font-medium text-right transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? "bg-sunset/15 border-sunset text-warm-text font-semibold"
                        : "bg-warm-dark/60 border-warm-border text-warm-muted hover:border-warm-muted"
                    }`}
                  >
                    <span className="text-base">{sym.icon}</span>
                    <span className="truncate">{sym.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Triggers Checklist */}
          <div>
            <label className="block text-sm font-medium text-warm-text mb-3">
              ⚡ טריגרים פוטנציאליים (גורמים מעוררים)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {DEFAULT_TRIGGERS.map((trig) => {
                const isSelected = selectedTriggers.includes(trig.id);
                return (
                  <button
                    key={trig.id}
                    type="button"
                    onClick={() => toggleTrigger(trig.id)}
                    className={`p-3 rounded-xl border text-xs font-medium text-right transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? "bg-amber-500/15 border-amber-500 text-warm-text font-semibold"
                        : "bg-warm-dark/60 border-warm-border text-warm-muted hover:border-warm-muted"
                    }`}
                  >
                    <span className="text-base">{trig.icon}</span>
                    <span className="truncate">{trig.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Remedies Checklist */}
          <div>
            <label className="block text-sm font-medium text-warm-text mb-3">
              💊 טיפולים ואמצעי הקלה שנוסו
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_REMEDIES.map((rem) => {
                const isSelected = selectedRemedies.includes(rem.id);
                return (
                  <button
                    key={rem.id}
                    type="button"
                    onClick={() => toggleRemedy(rem.id)}
                    className={`p-3 rounded-xl border text-xs font-medium text-right transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-sage/15 border-sage text-warm-text font-semibold"
                        : "bg-warm-dark/60 border-warm-border text-warm-muted hover:border-warm-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{rem.type === "med" ? "💊" : "💆"}</span>
                      <span className="text-right leading-tight">{rem.label}</span>
                    </div>
                    {isSelected && <span className="text-sage text-sm font-bold">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-warm-text mb-2">
              📝 הערות אישיות נוספות
            </label>
            <textarea
              placeholder="כתוב כאן מה אכלת, הרגשת, או כל פרט נוסף שיכול לעזור בזיהוי דפוסים..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-warm-dark border border-warm-border rounded-xl px-4 py-3 text-warm-text placeholder:text-warm-muted/50 focus:outline-none focus:border-sunset transition-colors text-sm resize-none"
            />
          </div>

          {/* Action Buttons */}
          {formError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-xs text-red-400 font-medium flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-warm-border sticky bottom-0 bg-warm-card z-10 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl text-sm font-medium bg-warm-dark hover:bg-warm-border text-warm-muted hover:text-warm-text transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl text-sm font-medium bg-sunset text-warm-dark font-bold hover:bg-sunset-hover transition-all shadow-lg flex items-center gap-2"
            >
              <Save size={16} />
              שמירת דיווח
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
