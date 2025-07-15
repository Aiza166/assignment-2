import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { supabase } from "@/lib/supabase";
import { connectToMongo } from "@/lib/mongo";
import mongoose from "mongoose";
import { extractMainText } from "@/lib/extractMainText"; 

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
  "with": "کے ساتھ",
  "layout": "ترتیب",
  "grid": "گرڈ",
  "flexbox": "فلیکس باکس",
  "browser": "براؤزر",
  "support": "مدد",
  "properties": "خصوصیات",
  "prefixing": "پیش نامہ",
  "example": "مثال",
  "guide": "رہنما",
  "image": "تصویر",
  "print": "پرنٹ",
  "information": "معلومات",
  "poster": "پوسٹر",
  "section": "حصہ"
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
    .map((word) => {
      const cleaned = word.toLowerCase().replace(/[^a-z]/gi, "");
      return urduDict[cleaned]
        ? urduDict[cleaned]
        : `[${word}]`; // show untranslated words in brackets
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
    let html = "";
    try {
    console.log("Fetching via ThingProxy:", url);
    const proxyUrl = `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`;
    const response = await axios.get(proxyUrl, {
        timeout: 10000,
    });

    html = response.data;
    } catch (err) {
    const error = err as Error;
    console.error("API Error:", error.message || error);
    console.error("Proxy axios.get failed:", err.message || err);
    return NextResponse.json({ error: "Failed to fetch blog HTML via proxy." }, { status: 500 });
    }

    // Extract visible blog content
    // const dom = new JSDOM(html, {
    //     resources: "usable",
    //     runScripts: "dangerously",
    //     pretendToBeVisual: false,
    //     includeNodeLocations: false,
    //     beforeParse(window) {
    //         // Disable style parsing to avoid CSS crash
    //         window.document.createElement = new Proxy(window.document.createElement, {
    //         apply(target, thisArg, argArray) {
    //             const el = Reflect.apply(target, thisArg, argArray);
    //             if (argArray[0].toLowerCase() === "style") {
    //             el.textContent = "";
    //             }
    //             return el;
    //         },
    //         });
    //     },
    // });

    // Extract clean article content using Readability
    const fullText = await extractMainText(html);
    console.log("Extracted blog text snippet:", fullText.slice(0, 200));

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
