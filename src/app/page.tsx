'use client';

import { analyzeImagesAction } from '@/app/actions/analyzeImagesAction';
import { Header } from '@/components/Header';
import { ChatMessage, ImageAnalysisResult, MessagesList } from '@/components/MessagesList';
import { isErrorWithMessage } from '@/lib/errors';
import { readFileAsDataUrl } from '@/lib/files';
import { cn } from '@/lib/utils';
import { ImageDown, Send, Trash } from 'lucide-react';
import { KeyboardEvent, useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';

export type UploadItem = {
  id: string;
  file: File;
  preview: string;
};

export default function ChatPageClient() {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Composer state
  const [items, setItems] = useState<UploadItem[]>([]);
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Handle dropped images
  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setGlobalError(null);
      try {
        const remaining = Math.max(0, 4 - items.length);
        const files = acceptedFiles.slice(0, remaining);
        if (acceptedFiles.length > remaining) {
          const msg = 'You can upload up to 4 images.';
          setGlobalError(msg);
        }

        const newItems: UploadItem[] = [];
        for (const file of files) {
          const preview = await readFileAsDataUrl(file);
          newItems.push({ id: crypto.randomUUID(), file, preview });
        }

        setItems(prev => [...prev, ...newItems]);
      } catch {
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
    onDrop: handleDrop,
    accept: { 'image/*': [] },
    maxFiles: 4,
    multiple: true,
    noClick: true,
    noKeyboard: true,
    noDragEventsBubbling: true,
  });

  // Submission
  const canSubmit = useMemo(() => {
    return question.trim().length > 0 && items.length > 0 && !submitting;
  }, [question, items.length, submitting]);

  // Use the provided Server Action directly (no custom hook)

  // Handlers
  async function handleAnalyze() {
    setGlobalError(null);
    if (!canSubmit) return;

    const images = items.map(i => i.preview);
    const q = question.trim();

    try {
      setSubmitting(true);

      // Add a user message
      const userId = crypto.randomUUID();
      const assistantId = crypto.randomUUID();
      const createdAt = Date.now();

      setMessages(prev => [
        ...prev,
        {
          id: userId,
          role: 'user',
          question: q,
          images,
          createdAt,
        },
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

      // Call Server Action directly
      const analysisResponse = await analyzeImagesAction({
        question: q,
        images,
      });

      // Update assistant message with real results
      setMessages(prev =>
        prev.map(m => {
          if (m.role === 'assistant' && m.pending && m.createdAt === createdAt) {
            const results: ImageAnalysisResult[] = images.map((img, idx) => {
              const r = analysisResponse.find(x => x.index === idx);
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
      const message = isErrorWithMessage(err) ? err.message : 'Unexpected client error';
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
      <main className="mx-auto max-w-3xl w-full h-[calc(100vh-64px)] p-4 flex flex-col">
        <MessagesList messages={messages} />

        {/* Global error outside dropzone */}
        {globalError && (
          <div className="px-4 sm:px-6 pb-2">
            <p className="text-xs text-red-600" role="alert">
              {globalError}
            </p>
          </div>
        )}

        {/* Composer (sticky bottom) */}
        <div
          {...getRootProps()}
          className={cn(
            'sticky bottom-0 px-4 sm:px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-2 border-dashed rounded-xl transition-all',
            isDragActive
              ? 'border-blue-600 ring-4 ring-blue-500/40 bg-blue-50/60'
              : 'border-border bg-background/95'
          )}
        >
          {items.length > 0 && (
            <div className="my-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {items.map(item => (
                <div key={item.id} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.preview}
                    alt="preview"
                    className="h-24 w-full object-cover rounded-md border"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="absolute top-1 right-1 text-[10px] px-2 py-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <input {...getInputProps()} />

          {/* Composer row: upload + input + ask + clear */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openFileDialog}
              className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border hover:bg-accent"
              aria-label="Upload images"
            >
              <ImageDown className="h-4 w-4" />
              Upload images
            </button>
            <input
              type="text"
              className="flex-1 px-3 py-2 rounded-md border text-sm"
              placeholder="Ask a question about the images..."
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Question input"
            />
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!canSubmit}
              className={cn(
                'inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border bg-blue-600 text-white disabled:opacity-50',
                canSubmit ? 'hover:bg-blue-700' : ''
              )}
              aria-label="Submit question"
            >
              <Send className="h-4 w-4" />
              Ask
            </button>
            {items.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border hover:bg-accent"
                aria-label="Clear all images"
              >
                <Trash className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
