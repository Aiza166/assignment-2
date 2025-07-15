import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export async function extractMainText(html: string): Promise<string> {
  const dom = new JSDOM(html);
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  return article?.textContent || "";
}
