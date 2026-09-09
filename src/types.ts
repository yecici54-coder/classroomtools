export interface Student {
  id: string;
  name: string;
  gender?: 'M' | 'F' | 'other';
  number?: string | number;
}

export type PickerMode = 'allow-repeat' | 'no-repeat';

export type PickerSpeed = 'fast' | 'normal' | 'suspense';

export interface PickHistoryItem {
  id: string;
  student: Student;
  timestamp: Date;
  roundNumber: number;
}

export type GroupingMode = 'by-size' | 'by-count';

export type NamingTheme = 'numbered' | 'colors' | 'animals' | 'letters';

export interface Group {
  id: string;
  name: string;
  color: string;
  badgeBg: string;
  borderColor: string;
  textColor: string;
  members: Student[];
  leaderId?: string;
}

export type ActiveTab = 'picker' | 'groups' | 'roster';
