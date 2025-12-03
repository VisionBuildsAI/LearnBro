export type Role = 'user' | 'model';

export type ContentType = 'text' | 'quiz' | 'flashcards' | 'image' | 'practice';

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  contentType?: ContentType;
  contentData?: any; // JSON data for quizzes or flashcards
  image?: string; // Base64 string
  timestamp: number;
}

export enum TeachingMode {
  DEFAULT = "Best Friend",
  ELI5 = "Explain Like I'm 5",
  COMEDIAN = "Comedian",
  STRICT_MOM = "Strict Mom",
  SENIOR = "Senior Mentor",
  LATE_NIGHT = "2AM Therapy Talks"
}

export interface Attachment {
  mimeType: string;
  data: string; // Base64
}

export interface QuickAction {
  label: string;
  prompt: string;
  icon: React.ReactNode;
}