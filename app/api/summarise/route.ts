import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { JSDOM } from "jsdom";
import { supabase } from "@/lib/supabase";
import { connectToMongo } from "@/lib/mongo";
import mongoose from "mongoose";

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

// MongoDB schema
const BlogSchema = new mongoose.Schema({
  url: String,
  fullText: String,
  createdAt: { type: Date, default: Date.now }
});
const Blog = mongoose.models.Blog || mongoose.model("Blog", BlogSchema);

// Generate summary from full text
function generateSummary(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const sentences = cleaned.split(/(?<=[.?!])\s+/);
  return sentences.slice(0, 3).join(" ");
}

// Urdu translation using static dictionary
function translateToUrdu(text: string): string {
  return text
    .split(" ")
    .map(word => {
      const cleaned = word.toLowerCase().replace(/[^a-z]/gi, "");
      return urduDict[cleaned] || word;
    })
    .join(" ");
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || !url.startsWith("http")) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Fetch blog page HTML
    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
        Accept: "text/html",
      },
    });

    // Extract visible blog content
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const main = doc.querySelector("article") || doc.querySelector("main") || doc.body;
    const fullText = main.textContent?.replace(/\s+/g, " ").trim() || "";

    if (!fullText || fullText.length < 50) {
      return NextResponse.json({ error: "Blog content too short." }, { status: 400 });
    }

    // Generate summaries
    const summary = generateSummary(fullText);
    const urdu = translateToUrdu(summary);

    // Save to Supabase
    await supabase.from("summaries").insert([{ url, summary, urdu }]);

    // Save full content to MongoDB
    await connectToMongo();
    await Blog.create({ url, fullText });

    return NextResponse.json({ summary, urdu });
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ error: "Failed to summarize blog." }, { status: 500 });
  }
}
