import React from 'react';

export type Role = 'user' | 'model';

export type ContentType = 'text' | 'quiz' | 'flashcards' | 'image' | 'practice' | 'note-correction' | 'cheatsheet';

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  contentType?: ContentType;
  contentData?: any; // JSON data for quizzes, flashcards, or cheatsheets
  image?: string; // Base64 string
  timestamp: number;
}

export enum TeachingMode {
  DEFAULT = "Bro Mode",
  CHILD = "Child Mode",
  FUN = "Fun Mode",
  STRICT_MOM = "Strict Mom",
  SENIOR = "Senior Mentor",
  LATE_NIGHT = "2AM Therapy",
  DEEP_THINK = "Deep Think"
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

export interface LearningEvent {
  id: string;
  topic: string;
  timestamp: number;
  type: 'quiz' | 'flashcards' | 'practice' | 'chat';
  score?: number; // 0-100
  mastery?: 'low' | 'medium' | 'high';
}

export interface NoteCorrectionData {
  title: string;
  analysis: {
    point: string;
    correction: string;
  }[];
  correctedNotes: string;
  diagramUrl?: string;
}

export interface MasteryItem {
  id: string;
  topic: string;
  level: number; // 0-100
  status: 'danger' | 'warning' | 'mastered';
}