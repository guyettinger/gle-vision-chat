'use client';

import { KeyboardEvent, useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Header from '@/components/Header';
import MessagesList from '@/components/MessagesList';
import { readFileAsDataUrl } from '@/lib/files';
import { useWindowDropzone } from '@/hooks/useWindowDropzone';
import { useAnalysis } from '@/hooks/useAnalysis';
import { isErrorWithMessage } from '@/lib/errors';

export type UploadItem = {
  id: string;
  file: File;
  preview: string;
};

export type AssistantResult = {
  index: number;
  ok: boolean;
  text?: string;
  error?: string;
  image: string;
};

export type ChatMessage =
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

  // Handle dropped images
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

  // Dropzone
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    open: openFileDialog,
  } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 4,
    multiple: true,
    noClick: true,
    noKeyboard: true,
    noDragEventsBubbling: true,
  });

  // Window Dropzone
  useWindowDropzone({ onDrop });

  // Submission
  const canSubmit = useMemo(() => {
    return question.trim().length > 0 && items.length > 0 && !submitting;
  }, [question, items.length, submitting]);

  // chat
  const analysis = useAnalysis();

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
      const analysisResponse = await analysis.mutateAsync({
        question: q,
        images,
      });

      // Update assistant message with real results
      setMessages(prev =>
        prev.map(m => {
          if (
            m.role === 'assistant' &&
            m.pending &&
            m.createdAt === createdAt
          ) {
            const results: AssistantResult[] = images.map((img, idx) => {
              const r = analysisResponse.results.find(x => x.index === idx);
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
    } catch (err: unknown) {
      const message = isErrorWithMessage(err)
        ? err.message
        : 'Unexpected client error';
      console.error('Unexpected client error:', err);
      setGlobalError(message);

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
                error: message,
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

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSubmit) void handleAnalyze();
    }
  }

  return (
    <div className="min-h-screen">
      <Header />

      {/* Chat area */}
      <main className="mx-auto max-w-3xl w-full h-[calc(100vh-64px)] flex flex-col">
        <MessagesList messages={messages} />

        {/* Composer (sticky bottom) */}
        <div
          {...getRootProps()}
          className={`border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6 py-3 sticky bottom-0`}
        >
          <input {...getInputProps()} />

          {globalError && (
            <p className="text-xs text-red-600 mb-2" role="alert">
              {globalError}
            </p>
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
          <div
            className={`flex items-center gap-2 ${isDragActive ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}
          >
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
        </div>
      </main>
    </div>
  );
}
