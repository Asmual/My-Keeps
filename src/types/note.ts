export type NoteColorId =
  | 'default'
  | 'coral'
  | 'peach'
  | 'sand'
  | 'mint'
  | 'sage'
  | 'fog'
  | 'storm'
  | 'dusk'
  | 'blossom'
  | 'clay';

export interface NoteColorConfig {
  id: NoteColorId;
  name: string;
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
  dotColor: string;
}

export interface CheckItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: NoteColorId;
  isPinned: boolean;
  isImportant?: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  labels: string[];
  checklist?: CheckItem[];
  noteType?: 'text' | 'checklist' | 'image' | 'voice';
  images?: string[];
  audioUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'grid' | 'list';

export type NavTab = 'notes' | 'checklists' | 'archive' | 'trash';
