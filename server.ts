import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded GoogleGenAI helper
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("מפתח ה-API של Gemini חסר במערכת (GEMINI_API_KEY). אנא הגדר אותו בהגדרות.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// AI Analysis Endpoint
app.post("/api/gemini/analyze", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { logs } = req.body;

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      res.status(400).json({ error: "לא נמצאו רשומות מיגרנה לניתוח." });
      return;
    }

    const ai = getGenAI();

    // Prepare a clean text representation of the logs for the model
    const logsSummary = logs.map((log: any, index: number) => {
      const start = new Date(log.startTime).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
      const end = log.endTime ? new Date(log.endTime).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" }) : "עדיין פעיל";
      return `
התקף #${index + 1}:
- זמן התחלה: ${start}
- זמן סיום: ${end}
- עוצמת כאב (1-10): ${log.intensity}
- מיקום הכאב: ${log.location || "לא צוין"}
- תסמינים: ${log.symptoms?.join(", ") || "אין תסמינים מיוחדים"}
- טריגרים (גורמים מעוררים): ${log.triggers?.join(", ") || "לא זוהו טריגרים"}
- טיפולים/תרופות שהועילו: ${log.remedies?.join(", ") || "לא נרשמו טיפולים"}
- הערות אישיות: ${log.notes || "אין"}
      `;
    }).join("\n---\n");

    const prompt = `
נתח את יומן התקפי המיגרנה הבא של המשתמש.
ענה בעברית רהוטה, אמפתית ומקצועית מאוד. המנע משימוש בג'יבריש או ניסוחים מסורבלים.
חלק את התשובה בצורה ברורה ומאורגנת עם כותרות מסודרות ב-Markdown (עם אמוג'ים מתאימים למבט קריא ומרגיע).
המשתמש סובל ממיגרנות, לכן כתוב בגובה העיניים, בטון מרגיע, תומך ומלא הבנה.

הנה יומן ההתקפים:
${logsSummary}

אנא כלול בניתוח שלך את החלקים הבאים:
1. 📊 **ניתוח דפוסים כללי**: תדירות, משך זמן ממוצע ועוצמה ממוצעת.
2. ⚡ **זיהוי טריגרים מרכזיים**: קשרים בין גורמים מעוררים (כמו שינה, לחץ וכו') לבין התפרצות ההתקפים ועוצמתם.
3. 🩺 **תסמינים נפוצים**: אילו תסמינים מלווים את רוב ההתקפים (למשל אאורה, בחילות, רגישות לאור).
4. 💡 **המלצות מעשיות ואישיות**: רעיונות לשיפור סגנון החיים או שיטות הקלה ספציפיות על בסיס הנתונים (כמו מה שהוכח כעוזר או המלצות רפואיות כלליות מתאימות).
5. 📝 **דו"ח מרוכז לרופא/ה**: סיכום קצר, תמציתי ומקצועי בנקודות שהמשתמש יוכל להעתיק ולהציג לרופא המשפחה או לנוירולוג שלו בביקור הבא.

הערה חשובה: בסוף הניתוח, הוסף דיסקליימר קטן ומכובד המבהיר כי הניתוח מבוסס על בינה מלאכותית ואינו מחליף ייעוץ רפואי מקצועי.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    res.json({ analysis: response.text });
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    res.status(500).json({ error: error.message || "אירעה שגיאה בניתוח הנתונים על ידי הבינה המלאכותית." });
  }
});

// Setup Vite Dev Server / Static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
