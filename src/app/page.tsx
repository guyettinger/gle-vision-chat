'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import ThemeToggle from '@/components/theme-toggle';

// Types for the current (unsent) attachments in the composer
type UploadItem = {
  id: string;
  file: File;
  preview: string;
};

// Types for chat history
type AssistantResult = {
  index: number;
  ok: boolean;
  text?: string;
  error?: string;
  image: string; // data url of the image for the message context
};

type ChatMessage =
  | {
      id: string;
      role: 'user';
      question: string;
      images: string[];
      createdAt: number;
    }
  | {
      id: string;
      role: 'assistant';
      results: AssistantResult[];
      createdAt: number;
      pending?: boolean;
    };

export default function Home() {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Composer state
  const [items, setItems] = useState<UploadItem[]>([]);
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Dropzone
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setGlobalError(null);
      try {
        const remaining = Math.max(0, 4 - items.length);
        const files = acceptedFiles.slice(0, remaining);
        if (acceptedFiles.length > remaining) {
          const msg = 'You can upload up to 4 images.';
          console.warn(msg);
          setGlobalError(msg);
        }

        const readFileAsDataUrl = (file: File) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = e => reject(e);
            reader.readAsDataURL(file);
          });

        const newItems: UploadItem[] = [];
        for (const file of files) {
          const preview = await readFileAsDataUrl(file);
          newItems.push({ id: crypto.randomUUID(), file, preview });
        }

        setItems(prev => [...prev, ...newItems]);
      } catch (err) {
        console.error('Error processing dropped files:', err);
        setGlobalError('Failed to process uploaded images.');
      }
    },
    [items.length]
  );

  const { getRootProps, getInputProps, isDragActive, open: openFileDialog } =
    useDropzone({
      onDrop,
      accept: { 'image/*': [] },
      maxFiles: 4,
      multiple: true,
      noClick: true,
      noKeyboard: true,
    });

  // Derived
  const canSubmit = useMemo(() => {
    return question.trim().length > 0 && items.length > 0 && !submitting;
  }, [question, items.length, submitting]);

  type BatchResult = {
    results: { index: number; ok: boolean; text?: string; error?: string }[];
  };

  // Mutation using fetch to the API (already set up server-side)
  const analyzeMutation = useMutation({
    mutationFn: async (payload: {
      question: string;
      images: string[];
    }): Promise<BatchResult> => {
      const res = await fetch('/api/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      let data: any = undefined;
      try {
        data = await res.json();
      } catch {
        // ignore json parse error; will be handled by !res.ok branch
      }
      if (!res.ok) {
        const msg = data?.error || `Request failed with status ${res.status}`;
        throw new Error(msg);
      }
      return data as BatchResult;
    },
  });

  // Handlers
  async function handleAnalyze() {
    setGlobalError(null);
    if (!canSubmit) return;

    const images = items.map(i => i.preview);
    const q = question.trim();

    try {
      setSubmitting(true);

      // Add user message
      const userId = crypto.randomUUID();
      const assistantId = crypto.randomUUID();
      const createdAt = Date.now();

      setMessages(prev => [
        ...prev,
        { id: userId, role: 'user', question: q, images, createdAt },
        {
          id: assistantId,
          role: 'assistant',
          createdAt,
          pending: true,
          results: images.map((img, idx) => ({
            index: idx,
            ok: true,
            text: 'Analyzing...',
            image: img,
          })),
        },
      ]);

      // Call API
      const data = await analyzeMutation.mutateAsync({
        question: q,
        images,
      });

      // Update assistant message with real results
      setMessages(prev =>
        prev.map(m => {
          if (m.role === 'assistant' && m.pending && m.createdAt === createdAt) {
            const results: AssistantResult[] = images.map((img, idx) => {
              const r = data.results.find(x => x.index === idx);
              return {
                index: idx,
                ok: !!r?.ok,
                text: r?.text,
                error: r?.error,
                image: img,
              };
            });
            return { ...m, pending: false, results };
          }
          return m;
        })
      );

      // Clear composer for next question
      setItems([]);
      setQuestion('');
    } catch (err: any) {
      console.error('Unexpected client error:', err);
      setGlobalError(err?.message || 'Unexpected error.');

      // Mark assistant message as error for this request if exists
      setMessages(prev =>
        prev.map(m => {
          if (m.role === 'assistant' && m.pending) {
            return {
              ...m,
              pending: false,
              results: m.results.map(r => ({
                ...r,
                ok: false,
                text: undefined,
                error: err?.message || 'Unexpected error',
              })),
            };
          }
          return m;
        })
      );
    } finally {
      setSubmitting(false);
    }
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function clearAll() {
    setItems([]);
    setGlobalError(null);
  }

  // Auto-scroll to bottom when messages change
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSubmit) void handleAnalyze();
    }
  }

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-4 flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <Image src="/next.svg" alt="Logo" width={120} height={30} className="dark:invert" />
            <span className="text-xl font-semibold">Batch Image QA (GPT-4 Vision)</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Chat area */}
      <main className="mx-auto max-w-3xl w-full h-[calc(100vh-64px)] flex flex-col">
        {/* Messages list */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground pt-16">
              <p>Drop up to 4 product images and ask a question. I will analyze each image and reply per-image.</p>
            </div>
          )}

          {messages.map(msg => {
            if (msg.role === 'user') {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl border bg-blue-600 text-white px-4 py-3 shadow">
                    <p className="whitespace-pre-wrap text-sm">{msg.question}</p>
                    {msg.images.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {msg.images.map((img, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={img} alt={`user-img-${i}`} className="h-20 w-full object-cover rounded-md border border-white/20" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            }
            // assistant
            return (
              <div key={msg.id} className="flex justify-start">
                <div className="max-w-[90%] rounded-2xl border bg-muted px-4 py-3 shadow w-full">
                  <div className="space-y-3">
                    {msg.results.map((res, i) => (
                      <div key={i} className="flex items-start gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={res.image} alt={`result-${i}`} className="w-16 h-16 rounded-md object-cover border" />
                        <div className="flex-1">
                          {msg.pending ? (
                            <p className="text-sm text-muted-foreground">Analyzing...</p>
                          ) : res.ok ? (
                            <p className="text-sm whitespace-pre-wrap">{res.text}</p>
                          ) : (
                            <p className="text-sm text-red-600" role="alert">{res.error || 'Error'}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Composer (sticky bottom) */}
        <div
          {...getRootProps()}
          className={`border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6 py-3 sticky bottom-0`}
        >
          <input {...getInputProps()} />

          {globalError && (
            <p className="text-xs text-red-600 mb-2" role="alert">{globalError}</p>
          )}

          {/* Selected thumbnails */}
          {items.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {items.map((item, idx) => (
                <div key={item.id} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.preview}
                    alt={`thumb-${idx}`}
                    className="h-14 w-14 object-cover rounded-md border"
                  />
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      removeItem(item.id);
                    }}
                    className="absolute -top-1 -right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded"
                    aria-label="Remove image"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input row */}
          <div className={`flex items-center gap-2 ${isDragActive ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                openFileDialog();
              }}
              className="px-3 py-2 rounded-md border text-sm"
              disabled={submitting || items.length >= 4}
            >
              Add images
            </button>
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your images..."
              className="flex-1 rounded-md border px-3 py-2 bg-background text-sm"
              disabled={submitting}
            />
            <button
              onClick={handleAnalyze}
              disabled={!canSubmit}
              className={`px-4 py-2 rounded-md text-white text-sm ${canSubmit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
            >
              {submitting ? 'Analyzing...' : 'Send'}
            </button>
            {items.length > 0 && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  clearAll();
                }}
                className="px-3 py-2 rounded-md border text-sm"
                disabled={submitting}
              >
                Clear
              </button>
            )}
          </div>

          <p className="mt-2 text-[11px] text-muted-foreground">
            Tip: You can drag & drop up to 4 images onto this area. Press Enter to send.
          </p>
        </div>
      </main>
    </div>
  );
}
