import pkg from '../package.json';

export const APP_VERSION = pkg.version;

export interface MigraineLog {
  id: string;
  startTime: string; // ISO date-time string
  endTime: string | null; // ISO date-time string, null if still active
  intensity: number; // 1-10 scale
  location: string; // Left, Right, Forehead, Back, Whole Head
  symptoms: string[];
  triggers: string[];
  remedies: string[];
  notes: string;
}

export const PAIN_LOCATIONS = [
  { id: "right", label: "צד ימין", description: "רקות, מעל עין ימין" },
  { id: "left", label: "צד שמאל", description: "רקות, מעל עין שמאל" },
  { id: "forehead", label: "מצח", description: "קדמת הראש, בין העיניים" },
  { id: "occipital", label: "עורף", description: "בסיס הגולגולת, צוואר אחורי" },
  { id: "diffuse", label: "כל הראש", description: "כאב מפושט או לוחץ מכל הצדדים" }
];

export const DEFAULT_SYMPTOMS = [
  { id: "aura", label: "אאורה / הפרעות ראייה", icon: "✨" },
  { id: "photophobia", label: "רגישות קשה לאור", icon: "💡" },
  { id: "phonophobia", label: "רגישות לרעש", icon: "🔊" },
  { id: "nausea", label: "בחילות / הקאות", icon: "🤢" },
  { id: "dizziness", label: "סחרחורת / חוסר יציבות", icon: "🌀" },
  { id: "fatigue", label: "עייפות קיצונית", icon: "🥱" },
  { id: "speech", label: "קושי בדיבור / בריכוז", icon: "💬" },
  { id: "numbness", label: "נימול בידיים / בפנים", icon: "⚡" }
];

export const DEFAULT_TRIGGERS = [
  { id: "stress", label: "לחץ / מתח נפשי", icon: "🧘" },
  { id: "sleep", label: "חוסר שינה / שינה לא סדירה", icon: "😴" },
  { id: "weather", label: "שינוי מזג אוויר / לחץ ברומטרי", icon: "☁️" },
  { id: "screen", label: "זמן מסך ממושך", icon: "💻" },
  { id: "dehydration", label: "חוסר שתיית מים", icon: "💧" },
  { id: "caffeine", label: "קפאין (עודף או גמילה)", icon: "☕" },
  { id: "alcohol", label: "אלכוהול (יין אדום וכו')", icon: "🍷" },
  { id: "food", label: "דילוג על ארוחות / מזונות מסוימים", icon: "🍎" },
  { id: "hormonal", label: "שינויים הורמונליים", icon: "🧬" }
];

export const DEFAULT_REMEDIES = [
  { id: "triptans", label: "תרופות מרשם (טריפטנים וכו')", type: "med" },
  { id: "painkillers", label: "משככי כאבים ללא מרשם (אקמול, נורופן)", type: "med" },
  { id: "dark_room", label: "מנוחה בחדר חשוך ושקט", type: "lifestyle" },
  { id: "cold_pack", label: "קומפרס קר על הראש/הצוואר", type: "lifestyle" },
  { id: "sleep", label: "שינה / תנומה עמוקה", type: "lifestyle" },
  { id: "water", label: "שתייה מרובה של מים", type: "lifestyle" },
  { id: "essential_oils", label: "שמן מנטה / עיסוי רקות", type: "lifestyle" },
  { id: "caffeine_dose", label: "כוס קפה קטן (להצרת כלי דם)", type: "lifestyle" }
];
