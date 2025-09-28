// Centralized chat-related types

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
  image: string; // data url of the image for the message context
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

