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

/**
 * Represents an image the user uploaded for analysis.
 */
type UploadedImage = {
  /** Unique id */
  id: string;
  /** The original File object from the dropzone/input */
  file: File;
  /** A base64 data URL used both for visual preview and as the payload sent to the analyzer. */
  preview: string;
};

export default function Page() {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Composer state
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Handle dropped images
  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setGlobalError(null);
      try {
        const remaining = Math.max(0, 4 - uploadedImages.length);
        const files = acceptedFiles.slice(0, remaining);
        if (acceptedFiles.length > remaining) {
          const msg = 'You can upload up to 4 images.';
          setGlobalError(msg);
        }

        const newUploadedImages: UploadedImage[] = [];
        for (const file of files) {
          const preview = await readFileAsDataUrl(file);
          newUploadedImages.push({ id: crypto.randomUUID(), file, preview });
        }

        setUploadedImages(prev => [...prev, ...newUploadedImages]);
      } catch {
        setGlobalError('Failed to process uploaded images.');
      }
    },
    [uploadedImages.length]
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

  /**
   * Determine if the composer is in a submittable state.
   */
  const canSubmit = useMemo(() => {
    return question.trim().length > 0 && uploadedImages.length > 0 && !submitting;
  }, [question, uploadedImages.length, submitting]);

  /**
   * Trigger the image analysis workflow.
   */
  const analyzeImages = async () => {
    // Clear previous errors
    setGlobalError(null);
    if (!canSubmit) return;

    // Get the uploaded images
    const images = uploadedImages.map(i => i.preview);

    // Get the question
    const q = question.trim();

    try {
      // Start submission
      setSubmitting(true);

      // Add a user message and an assistant message
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

      // Analyze images via a server action
      const analysisResponse = await analyzeImagesAction({
        question: q,
        images,
      });

      // Update the assistant message with results
      setMessages(prev =>
        prev.map(m => {
          if (m.role === 'assistant' && m.pending && m.createdAt === createdAt) {
            const results: ImageAnalysisResult[] = images.map((img, idx) => {
              const r = analysisResponse.results.find(x => x.index === idx);

              if (r?.ok) {
                return {
                  index: idx,
                  ok: true,
                  text: r.text,
                  image: img,
                };
              }

              return {
                index: idx,
                ok: false,
                error: r?.error ?? 'Unexpected server error',
                image: img,
              };
            });
            return { ...m, pending: false, results };
          }
          return m;
        })
      );

      // Clear composer for the next question
      setUploadedImages([]);
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
  };

  /**
   * Removes a single uploaded image from the composer by its id.
   *
   * @param id - The id of the UploadItem to remove
   */
  const removeItem = (id: string) => {
    setUploadedImages(prev => prev.filter(i => i.id !== id));
  };

  /**
   * Clears all uploaded images from the composer and resets any global error.
   */
  const clearAll = () => {
    setUploadedImages([]);
    setGlobalError(null);
  };

  /**
   * Handles Enter-to-submit behavior for the question input.
   * Prevents default newline insertion when Enter is pressed without Shift and
   * triggers analysis if the form is in a submittable state.
   *
   * @param e - The keyboard event from the question input
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSubmit) void analyzeImages();
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      {/* Chat area */}
      <main className="mx-auto max-w-3xl w-full h-[calc(100vh-64px)] p-4 flex flex-col">
        {/* Messages */}
        <MessagesList messages={messages} />

        {/* Global error */}
        {globalError && (
          <div className="px-4 sm:px-6 pb-2">
            <p className="text-xs text-red-600" role="alert">
              {globalError}
            </p>
          </div>
        )}

        {/* Composer */}
        <div
          {...getRootProps()}
          className={cn(
            'sticky bottom-0 px-4 sm:px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-2 border-dashed rounded-xl transition-all',
            isDragActive
              ? 'border-blue-600 ring-4 ring-blue-500/40 bg-blue-50/60'
              : 'border-border bg-background/95'
          )}
        >
          {uploadedImages.length > 0 && (
            <div className="my-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {uploadedImages.map(item => (
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
          {/* Dropzone */}
          <input {...getInputProps()} />

          {/* Composer inputs */}
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
              onClick={analyzeImages}
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
            {uploadedImages.length > 0 && (
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
