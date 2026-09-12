import React, { useState, useEffect } from "react";
import { MigraineLog } from "../types";
import { Brain, Sparkles, AlertTriangle, Copy, Check, Loader2, RefreshCw } from "lucide-react";

interface AiInsightsProps {
  logs: MigraineLog[];
}

const SOOTHING_MESSAGES = [
  "מנתח את דפוסי המיגרנה שלך...",
  "בודק קשרים בין גורמים מעוררים להתקפים...",
  "מכין תובנות מותאמות אישית להקלה...",
  "מנסח סיכום מקצועי עבור הרופא/ה שלך...",
  "זוכר לשתות כוס מים עכשיו? 💧",
  "קח נשימה עמוקה, שחרר את הכתפיים... 🧘"
];

export default function AiInsights({ logs }: AiInsightsProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // Rotate loading messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % SOOTHING_MESSAGES.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const runAnalysis = async () => {
    if (logs.length === 0) return;
    setLoading(true);
    setError("");
    setAnalysis("");
    setLoadingMessageIndex(0);

    try {
      const baseUrl = import.meta.env.BASE_URL || "/";
      const apiEndpoint = `${baseUrl.replace(/\/$/, "")}/api/gemini/analyze`;
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ logs }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "שגיאה בניתוח הנתונים.");
      }

      setAnalysis(data.analysis);
      // Save analysis to localstorage for caching
      localStorage.setItem("migraine_ai_analysis", data.analysis);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "לא ניתן היה ליצור קשר עם השרת. ודא שמפתח ה-API מוגדר.");
    } finally {
      setLoading(false);
    }
  };

  // Load cached analysis on mount
  useEffect(() => {
    const cached = localStorage.getItem("migraine_ai_analysis");
    if (cached) {
      setAnalysis(cached);
    }
  }, []);

  const handleCopy = () => {
    if (!analysis) return;
    navigator.clipboard.writeText(analysis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Basic Markdown Renderer to avoid library dependencies and ensure 100% reliability
  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, index) => {
      const trimmed = line.trim();

      // Headers
      if (trimmed.startsWith("###")) {
        return (
          <h4 key={index} className="text-base font-bold text-sunset mt-4 mb-2">
            {trimmed.replace("###", "").trim()}
          </h4>
        );
      }
      if (trimmed.startsWith("##") || trimmed.startsWith("#")) {
        return (
          <h3 key={index} className="text-lg font-bold text-warm-text border-b border-warm-border pb-2 mt-6 mb-3 flex items-center gap-2">
            <span>{trimmed.replace(/#+/g, "").trim()}</span>
          </h3>
        );
      }

      // Bullet points
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const content = trimmed.slice(1).trim();
        return (
          <ul key={index} className="list-disc list-inside mr-4 my-1.5 text-sm leading-relaxed text-warm-text/90">
            <li className="marker:text-sunset">{parseBoldText(content)}</li>
          </ul>
        );
      }

      // Empty line
      if (!trimmed) {
        return <div key={index} className="h-2" />;
      }

      // Standard paragraph
      return (
        <p key={index} className="text-sm leading-relaxed text-warm-text/90 my-2">
          {parseBoldText(trimmed)}
        </p>
      );
    });
  };

  // Helper to parse **bold** text inside markdown lines
  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-bold text-sunset">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="bg-warm-card border border-warm-border rounded-2xl p-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-warm-border">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sunset/10 text-sunset rounded-xl border border-sunset/20">
            <Brain size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-warm-text flex items-center gap-1.5">
              עוזר מיגרנה אישי - AI
            </h2>
            <p className="text-xs text-warm-muted mt-0.5">
              ניתוח בינה מלאכותית של יומן ההתקפים שלך לזיהוי דפוסים וטריגרים סמויים
            </p>
          </div>
        </div>

        {logs.length > 0 && !loading && (
          <button
            onClick={runAnalysis}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sunset text-warm-dark hover:bg-sunset-hover transition-colors flex items-center gap-2 self-start md:self-auto shadow-md"
          >
            {analysis ? <RefreshCw size={14} /> : <Sparkles size={14} />}
            {analysis ? "עדכון ניתוח הנתונים" : "נתח את המיגרנות שלי"}
          </button>
        )}
      </div>

      {/* Content area */}
      {logs.length === 0 ? (
        <div className="text-center py-8">
          <Brain size={40} className="text-warm-muted mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-warm-text">אין עדיין רשומות לניתוח</h3>
          <p className="text-xs text-warm-muted mt-1 max-w-sm mx-auto">
            כשתדווח על התקפי המיגרנה שלך, הבינה המלאכותית תוכל לקרוא את היומן ולזהות מגמות בריאותיות, טריגרים פוטנציאליים ודוח רופא מסודר.
          </p>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-16 h-16 rounded-full border-2 border-sunset/20 pulse-glow" />
            <Loader2 className="animate-spin text-sunset" size={36} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-warm-text animate-pulse">
              {SOOTHING_MESSAGES[loadingMessageIndex]}
            </h3>
            <p className="text-[11px] text-warm-muted">זה עשוי לקחת כמה שניות, אנא המתן בנחת</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={18} />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-red-400">לא הצלחנו לייצר ניתוח נתונים</h4>
            <p className="text-xs text-warm-muted leading-relaxed">{error}</p>
            <button
              onClick={runAnalysis}
              className="text-xs font-bold text-sunset hover:underline mt-2 flex items-center gap-1"
            >
              נסה שוב
            </button>
          </div>
        </div>
      ) : analysis ? (
        <div className="space-y-6">
          {/* Tool actions on report */}
          <div className="flex justify-between items-center bg-warm-dark/50 px-4 py-2 rounded-xl border border-warm-border">
            <span className="text-[11px] text-warm-muted flex items-center gap-1">
              ✨ עודכן לאחרונה על סמך {logs.length} התקפים מדווחים
            </span>
            <button
              onClick={handleCopy}
              className="text-xs text-warm-muted hover:text-sunset transition-colors flex items-center gap-1.5 py-1 px-2 rounded hover:bg-warm-border"
            >
              {copied ? <Check size={14} className="text-sage" /> : <Copy size={14} />}
              {copied ? "הועתק!" : "העתק ניתוח מלא"}
            </button>
          </div>

          {/* Rendered report */}
          <div className="bg-warm-dark/20 p-5 rounded-2xl border border-warm-border/60 text-right overflow-hidden">
            {renderMarkdown(analysis)}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-warm-dark/30 rounded-2xl border border-warm-border/40 border-dashed">
          <Brain size={44} className="text-sunset/50 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-warm-text">מוכן לנתח את המיגרנה שלך?</h3>
          <p className="text-xs text-warm-muted mt-1 max-w-sm mx-auto mb-5 leading-relaxed">
            לחץ על הכפתור כדי לקבל דוח בריאותי חכם הכולל זיהוי גורמים מעוררים, המלצות לשיפור סגנון החיים וסיכום מרוכז מוכן עבור הרופא המטפל.
          </p>
          <button
            onClick={runAnalysis}
            className="px-6 py-3 rounded-xl text-xs font-bold bg-sunset text-warm-dark hover:bg-sunset-hover transition-all shadow-md inline-flex items-center gap-2"
          >
            <Sparkles size={14} />
            ניתוח נתונים ראשוני
          </button>
        </div>
      )}
    </div>
  );
}
