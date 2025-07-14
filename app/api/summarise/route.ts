import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { JSDOM } from "jsdom";
import { createClient } from "@supabase/supabase-js";
import { MongoClient } from "mongodb";

// ====== SETUP ======
// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// MongoDB client
const mongoClient = new MongoClient(process.env.MONGODB_URI!);
const mongoDB = mongoClient.db("blog_data");
const blogCollection = mongoDB.collection("blogs");

// Urdu dictionary (manual static translation)
const urduDict: Record<string, string> = {
  "this": "یہ",
  "is": "ہے",
  "a": "ایک",
  "blog": "بلاگ",
  "about": "کے بارے میں",
  "summary": "خلاصہ",
  "introduction": "تعارف",
  "to": "تک",
  "react": "ری ایکٹ",
  "hooks": "ہکس",
  "you": "آپ",
  "can": "سکتے ہیں",
  "use": "استعمال کریں",
  "function": "فنکشن",
  "functions": "افعال",
  "state": "حالت",
  "component": "جزو",
  "components": "اجزاء",
  "manage": "انتظام کریں",
  "data": "ڈیٹا",
  "without": "بغیر",
  "class": "کلاس",
  "based": "پر مبنی",
  "code": "کوڈ",
  "easier": "آسان تر",
  "reuse": "دوبارہ استعمال",
  "logic": "منطق",
  "share": "بانٹیں",
  "between": "کے درمیان",
  "different": "مختلف",
  "applications": "ایپلیکیشنز",
  "intuitive": "بدیہی",
  "powerful": "طاقتور",
  "simplify": "آسان بنائیں",
  "development": "ترقی",
  "javascript": "جاوا اسکرپٹ",
  "web": "ویب",
  "interface": "انٹرفیس",
  "interactive": "انٹرایکٹو",
  "content": "مواد",
  "create": "بنائیں",
  "page": "صفحہ",
  "user": "صارف",
  "modern": "جدید",
  "and": "اور",
  "for": "کے لیے",
  "with": "کے ساتھ"
};


// ====== Utility: Static summary ======
function generateSummary(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const sentences = cleaned.split(/(?<=[.?!])\s+/);
  return sentences.slice(0, 3).join(" ");
}

// ====== Utility: Dictionary-based translation ======
function translateToUrdu(text: string): string {
  return text
    .split(" ")
    .map(word => {
      const cleaned = word.toLowerCase().replace(/[^a-z]/gi, "");
      return urduDict[cleaned] || word;
    })
    .join(" ");
}

// ====== Main Handler ======
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || !url.startsWith("http")) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // 1. Scrape blog HTML
    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
        Accept: "text/html",
      },
    });

    // 2. Extract main content
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const mainContent = doc.querySelector("article") || doc.querySelector("main") || doc.body;
    const fullText = mainContent.textContent?.replace(/\s+/g, " ").trim() || "";

    if (!fullText || fullText.length < 50) {
      return NextResponse.json({ error: "Blog content is too short." }, { status: 400 });
    }

    // 3. Generate summaries
    const summary = generateSummary(fullText);
    const urdu = translateToUrdu(summary);

    // 4. Save to Supabase
    await supabase.from("summaries").insert([{ url, summary, urdu }]);

    // 5. Save to MongoDB
    await blogCollection.insertOne({ url, fullText, createdAt: new Date() });

    return NextResponse.json({ summary, urdu });
  } catch (err) {
    console.error("❌ ERROR:", err);
    return NextResponse.json({ error: "Failed to summarize the blog." }, { status: 500 });
  }
}
