'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/types/chat';

export default function MessagesList({ messages }: { messages: ChatMessage[] }) {
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div ref={listRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
      {messages.length === 0 && (
        <div className="text-center text-sm text-muted-foreground pt-16">
          <p>Drop up to 4 images and ask a question. I will analyze each image and reply per-image.</p>
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
  );
}
