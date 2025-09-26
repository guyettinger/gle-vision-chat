"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";

type UploadItem = {
  id: string;
  file: File;
  preview: string; // data URL
  status: "idle" | "uploading" | "done" | "error";
  answer?: string;
  error?: string;
};

export default function Home() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setGlobalError(null);
    try {
      const remaining = Math.max(0, 4 - items.length);
      const files = acceptedFiles.slice(0, remaining);
      if (acceptedFiles.length > remaining) {
        const msg = "You can upload up to 4 images.";
        console.warn(msg);
        setGlobalError(msg);
      }

      const readFileAsDataUrl = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(file);
        });

      const newItems: UploadItem[] = [];
      for (const file of files) {
        const preview = await readFileAsDataUrl(file);
        newItems.push({
          id: crypto.randomUUID(),
          file,
          preview,
          status: "idle",
        });
      }

      setItems((prev) => [...prev, ...newItems]);
    } catch (err) {
      console.error("Error processing dropped files:", err);
      setGlobalError("Failed to process uploaded images.");
    }
  }, [items.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 4,
    multiple: true,
  });

  const canSubmit = useMemo(() => {
    return question.trim().length > 0 && items.length > 0 && !submitting;
  }, [question, items.length, submitting]);

  async function handleAnalyze() {
    setGlobalError(null);
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      setItems((prev) => prev.map((it) => ({ ...it, status: "uploading", answer: undefined, error: undefined })));

      const res = await fetch("/api/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          images: items.map((i) => i.preview),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.error || `Request failed with status ${res.status}`;
        console.error("API error:", msg);
        setGlobalError(msg);
        setItems((prev) => prev.map((it) => ({ ...it, status: "error", error: msg })));
        return;
      }

      const data: { results: { index: number; ok: boolean; text?: string; error?: string }[] } = await res.json();

      setItems((prev) =>
        prev.map((it, idx) => {
          const r = data.results.find((x) => x.index === idx);
          if (!r) return { ...it, status: "error", error: "No response" };
          if (r.ok) return { ...it, status: "done", answer: r.text };
          return { ...it, status: "error", error: r.error || "Error" };
        })
      );
    } catch (err: any) {
      console.error("Unexpected client error:", err);
      setGlobalError(err?.message || "Unexpected error.");
      setItems((prev) => prev.map((it) => ({ ...it, status: "error", error: "Unexpected error" })));
    } finally {
      setSubmitting(false);
    }
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function clearAll() {
    setItems([]);
    setGlobalError(null);
  }

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <main className="mx-auto max-w-3xl w-full space-y-6">
        <div className="flex items-center gap-3">
          <Image src="/next.svg" alt="Logo" width={120} height={30} className="dark:invert" />
          <span className="text-xl font-semibold">Batch Image QA (GPT-4 Vision)</span>
        </div>

        <section>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
              isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 dark:border-gray-700"
            }`}
          >
            <input {...getInputProps()} />
            <p className="text-sm text-muted-foreground">
              Drag and drop up to 4 images here, or click to select.
            </p>
          </div>
          {globalError && (
            <p className="text-sm text-red-600 mt-2" role="alert">{globalError}</p>
          )}
          {items.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {items.map((item, idx) => (
                <div key={item.id} className="relative rounded-md overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.preview} alt={`upload-${idx}`} className="h-32 w-full object-cover" />
                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded"
                    aria-label="Remove image"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <label className="block text-sm font-medium">Your question</label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., Are there any visible defects or issues?"
            className="w-full rounded-md border px-3 py-2 bg-background"
          />
          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={!canSubmit}
              className={`px-4 py-2 rounded-md text-white ${canSubmit ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}
            >
              {submitting ? "Analyzing..." : "Analyze all images"}
            </button>
            {items.length > 0 && (
              <button onClick={clearAll} className="px-4 py-2 rounded-md border">Clear</button>
            )}
          </div>
        </section>

        {items.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Results</h2>
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="w-20 h-20 relative flex-shrink-0 overflow-hidden rounded-md border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.preview} alt={`preview-${idx}`} className="object-cover w-full h-full" />
                  </div>
                  <div className="flex-1">
                    <div className="rounded-lg p-3 border bg-muted">
                      {item.status === "uploading" && <p className="text-sm">Analyzing...</p>}
                      {item.status === "done" && (
                        <p className="text-sm whitespace-pre-wrap">{item.answer}</p>
                      )}
                      {item.status === "error" && (
                        <p className="text-sm text-red-600" role="alert">{item.error || "Error"}</p>
                      )}
                      {item.status === "idle" && (
                        <p className="text-sm text-muted-foreground">Ready to analyze.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="pt-8 text-xs text-muted-foreground">
          <p>
            This demo uses: React Dropzone, Vercel AI SDK (@ai-sdk/react & ai), OpenAI GPT-4 Vision (gpt-4o-mini).
          </p>
        </footer>
      </main>
    </div>
  );
}
