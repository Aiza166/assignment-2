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
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setSummary(data.summary);
      setUrduSummary(data.urdu);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-center text-zinc-800">
          Blog Summariser
        </h1>
        <p className="text-center text-zinc-600 text-base">
          Paste a blog URL to generate a short summary in English and Urdu.
        </p>

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
          <p className="text-red-600 text-sm text-center font-medium">{error}</p>
        )}

        {(summary || urduSummary) && (
          <Card className="bg-zinc-50 border border-zinc-200 shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-zinc-800 mb-2">
                  English Summary
                </h2>
                <Textarea
                  value={summary}
                  readOnly
                  className="h-32 resize-none text-sm"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-zinc-800 mb-2">
                  Urdu Translation
                </h2>
                <Textarea
                  value={urduSummary}
                  readOnly
                  className="h-32 resize-none text-sm font-urdu"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
