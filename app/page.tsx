"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [urduSummary, setUrduSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSummarize = async () => {
  if (!url) return;
  setLoading(true);
  setError("");
  setSummary("");
  setUrduSummary("");

  try {
    const res = await fetch("/api/summarise", {
      method: "POST",
      body: JSON.stringify({ url }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Backend error:", data);
      setError(data.error || "Server error — check console");
      setLoading(false);
      return;
    }

    setSummary(data.summary);
    setUrduSummary(data.urdu);
  } catch (err) {
    const error = err as Error;
    console.error("Network/JS error:", error.message || error);
    console.error("Network/JS error:", err);
    setError(err.message || "Network error");
  } finally {
    setLoading(false);
  }
};

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-zinc-800">
            📰 Blog Summariser
          </h1>
          <p className="text-zinc-600 text-base">
            Enter a blog URL to get a short summary in English and Urdu.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            type="url"
            placeholder="https://example.com/blog"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button onClick={handleSummarize} disabled={loading}>
            {loading ? "Summarizing..." : "Summarize"}
          </Button>
        </div>

        {error && (
          <p className="text-red-600 text-sm text-center font-medium">
            {error}
          </p>
        )}

        {(summary || urduSummary) && (
          <Card className="bg-white border border-zinc-200 shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-zinc-800 mb-2">
                  📘 English Summary
                </h2>
                <Textarea
                  value={summary}
                  readOnly
                  className="h-36 resize-none text-sm bg-zinc-50"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-zinc-800 mb-2">
                  🇵🇰 Urdu Translation
                </h2>
                <Textarea
                  value={urduSummary}
                  readOnly
                  className="h-36 resize-none text-sm font-[Noto Nastaliq Urdu] bg-zinc-50"
                />
                <p className="text-xs text-zinc-500 italic mt-1">
                  Note: Urdu translation uses a basic static dictionary. Untranslated words are shown in [brackets].
                </p>

              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
