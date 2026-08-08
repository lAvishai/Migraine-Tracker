import React from "react";
import { MigraineLog, DEFAULT_TRIGGERS, DEFAULT_SYMPTOMS } from "../types";
import { TrendingUp, Calendar, AlertCircle, Clock, Zap, Activity } from "lucide-react";

interface AnalyticsPanelProps {
  logs: MigraineLog[];
}

export default function AnalyticsPanel({ logs }: AnalyticsPanelProps) {
  if (logs.length === 0) {
    return (
      <div className="bg-warm-card border border-warm-border rounded-2xl p-8 text-center">
        <Activity size={40} className="text-warm-muted mx-auto mb-3 opacity-60" />
        <h3 className="text-lg font-bold text-warm-text">אין עדיין מספיק נתונים</h3>
        <p className="text-sm text-warm-muted mt-1 max-w-sm mx-auto">
          התחל לדווח על התקפים כדי לקבל סטטיסטיקות, גרפים חזותיים וניתוחי עומק על המיגרנות שלך.
        </p>
      </div>
    );
  }

  // Calculate stats
  const totalAttacks = logs.length;
  
  const completedLogs = logs.filter(l => l.endTime !== null);
  const averageDurationHrs = completedLogs.length > 0
    ? completedLogs.reduce((sum, log) => {
        const start = new Date(log.startTime).getTime();
        const end = new Date(log.endTime!).getTime();
        return sum + (end - start);
      }, 0) / completedLogs.length / (1000 * 60 * 60)
    : 0;

  const averageIntensity = logs.reduce((sum, log) => sum + log.intensity, 0) / totalAttacks;

  // Triggers aggregation
  const triggerCounts: { [key: string]: number } = {};
  logs.forEach(log => {
    log.triggers.forEach(t => {
      triggerCounts[t] = (triggerCounts[t] || 0) + 1;
    });
  });

  const sortedTriggers = Object.entries(triggerCounts)
    .map(([id, count]) => {
      const def = DEFAULT_TRIGGERS.find(t => t.id === id);
      return {
        id,
        count,
        label: def?.label || id,
        icon: def?.icon || "⚡",
        percentage: Math.round((count / totalAttacks) * 100)
      };
    })
    .sort((a, b) => b.count - a.count);

  // Symptoms aggregation
  const symptomCounts: { [key: string]: number } = {};
  logs.forEach(log => {
    log.symptoms.forEach(s => {
      symptomCounts[s] = (symptomCounts[s] || 0) + 1;
    });
  });

  const sortedSymptoms = Object.entries(symptomCounts)
    .map(([id, count]) => {
      const def = DEFAULT_SYMPTOMS.find(s => s.id === id);
      return {
        id,
        count,
        label: def?.label || id,
        icon: def?.icon || "💫",
        percentage: Math.round((count / totalAttacks) * 100)
      };
    })
    .sort((a, b) => b.count - a.count);

  // Pain distribution over time (last 7 logs)
  const last7Logs = [...logs]
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(-7);

  // Generate SVG Chart dimensions
  const chartHeight = 140;
  const chartWidth = 500;
  const padding = 25;

  // Map logs to coordinates
  const points = last7Logs.map((log, index) => {
    const x = padding + (index * (chartWidth - padding * 2)) / Math.max(1, last7Logs.length - 1);
    // Intensity 10 is at top, 1 is at bottom
    const y = chartHeight - padding - ((log.intensity - 1) * (chartHeight - padding * 2)) / 9;
    const d = new Date(log.startTime);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;
    return { x, y, intensity: log.intensity, date: formattedDate };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  // Area path for gradient under the line
  const areaPath = points.length > 0 
    ? `${linePath} L${points[points.length - 1].x},${chartHeight - padding} L${points[0].x},${chartHeight - padding} Z`
    : "";

  return (
    <div className="space-y-6">
      {/* Overview Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-warm-card border border-warm-border p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-warm-muted mb-2">
            <Calendar size={16} className="text-sunset" />
            <span className="text-xs font-medium">סה"כ דיווחים</span>
          </div>
          <div className="text-2xl font-bold text-warm-text">{totalAttacks}</div>
          <div className="text-[10px] text-warm-muted mt-1">מתחילת המעקב</div>
        </div>

        <div className="bg-warm-card border border-warm-border p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-warm-muted mb-2">
            <AlertCircle size={16} className="text-orange-400" />
            <span className="text-xs font-medium">עוצמה ממוצעת</span>
          </div>
          <div className="text-2xl font-bold text-warm-text">
            {averageIntensity.toFixed(1)} <span className="text-xs text-warm-muted">/10</span>
          </div>
          <div className="text-[10px] text-warm-muted mt-1">רמת כאב ממוצעת</div>
        </div>

        <div className="bg-warm-card border border-warm-border p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-warm-muted mb-2">
            <Clock size={16} className="text-sage" />
            <span className="text-xs font-medium">משך התקף ממוצע</span>
          </div>
          <div className="text-2xl font-bold text-warm-text">
            {averageDurationHrs > 0 ? `${averageDurationHrs.toFixed(1)}` : "--"}
            <span className="text-xs text-warm-muted"> {averageDurationHrs > 0 ? "שעות" : ""}</span>
          </div>
          <div className="text-[10px] text-warm-muted mt-1">מתוך התקפים שהסתיימו</div>
        </div>

        <div className="bg-warm-card border border-warm-border p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-warm-muted mb-2">
            <Zap size={16} className="text-amber-400" />
            <span className="text-xs font-medium">טריגר נפוץ ביותר</span>
          </div>
          <div className="text-lg font-bold text-warm-text truncate">
            {sortedTriggers[0] ? `${sortedTriggers[0].icon} ${sortedTriggers[0].label}` : "אין נתונים"}
          </div>
          <div className="text-[10px] text-warm-muted mt-1">הופיע ב-{sortedTriggers[0]?.percentage || 0}% מההתקפים</div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Chart (SVG) */}
        <div className="bg-warm-card border border-warm-border p-5 rounded-2xl lg:col-span-2">
          <h3 className="text-sm font-bold text-warm-text mb-4 flex items-center gap-1.5">
            <TrendingUp size={16} className="text-sunset" />
            מגמת עוצמת הכאב (7 ההתקפים האחרונים)
          </h3>

          <div className="relative w-full overflow-hidden flex justify-center py-2">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              className="w-full max-w-[550px] overflow-visible"
              style={{ direction: "ltr" }}
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e28a5f" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#e28a5f" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[1, 5, 10].map((level) => {
                const y = chartHeight - padding - ((level - 1) * (chartHeight - padding * 2)) / 9;
                return (
                  <g key={level} opacity="0.15">
                    <line 
                      x1={padding} 
                      y1={y} 
                      x2={chartWidth - padding} 
                      y2={y} 
                      stroke="#a69b93" 
                      strokeWidth="1" 
                      strokeDasharray="4 4" 
                    />
                    <text 
                      x={padding - 8} 
                      y={y + 3} 
                      fill="#a69b93" 
                      fontSize="9" 
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      {level}
                    </text>
                  </g>
                );
              })}

              {/* Gradient Area under line */}
              {areaPath && (
                <path d={areaPath} fill="url(#chartGradient)" />
              )}

              {/* The Line */}
              {linePath && (
                <path 
                  d={linePath} 
                  fill="none" 
                  stroke="#e28a5f" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              )}

              {/* Point Circles and value labels */}
              {points.map((p, i) => (
                <g key={i} className="group cursor-pointer">
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r="5" 
                    fill="#161413" 
                    stroke="#e28a5f" 
                    strokeWidth="3" 
                  />
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r="9" 
                    fill="#e28a5f" 
                    opacity="0" 
                    className="hover:opacity-25 transition-opacity" 
                  />
                  {/* Pain level label */}
                  <text 
                    x={p.x} 
                    y={p.y - 12} 
                    fill="#e7dfd9" 
                    fontSize="10" 
                    fontWeight="bold" 
                    textAnchor="middle"
                  >
                    {p.intensity}
                  </text>
                  {/* Date label at bottom */}
                  <text 
                    x={p.x} 
                    y={chartHeight - 6} 
                    fill="#a69b93" 
                    fontSize="9" 
                    textAnchor="middle"
                  >
                    {p.date}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Triggers Breakdown */}
        <div className="bg-warm-card border border-warm-border p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-warm-text mb-4 flex items-center gap-1.5">
            <Zap size={16} className="text-amber-400" />
            גורמים מעוררים שכיחים (טריגרים)
          </h3>

          <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
            {sortedTriggers.length === 0 ? (
              <div className="text-xs text-warm-muted text-center py-6">טרם זוהו טריגרים ברשומות שלך.</div>
            ) : (
              sortedTriggers.slice(0, 4).map((t) => (
                <div key={t.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-warm-text font-medium flex items-center gap-1.5">
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </span>
                    <span className="text-warm-muted">{t.count} פעמים ({t.percentage}%)</span>
                  </div>
                  <div className="w-full bg-warm-dark h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${t.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Symptoms Breakdown */}
        <div className="bg-warm-card border border-warm-border p-5 rounded-2xl lg:col-span-1">
          <h3 className="text-sm font-bold text-warm-text mb-4 flex items-center gap-1.5">
            <Activity size={16} className="text-sunset" />
            תסמינים נפוצים ביותר
          </h3>

          <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
            {sortedSymptoms.length === 0 ? (
              <div className="text-xs text-warm-muted text-center py-6">טרם זוהו תסמינים ברשומות שלך.</div>
            ) : (
              sortedSymptoms.slice(0, 4).map((s) => (
                <div key={s.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-warm-text font-medium flex items-center gap-1.5">
                      <span>{s.icon}</span>
                      <span>{s.label}</span>
                    </span>
                    <span className="text-warm-muted">{s.count} פעמים ({s.percentage}%)</span>
                  </div>
                  <div className="w-full bg-warm-dark h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-sunset h-full rounded-full transition-all duration-500" 
                      style={{ width: `${s.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
