export enum ConversationStatus {
  Idle = 'idle',
  Connecting = 'connecting',
  Listening = 'listening',
  Error = 'error'
}

export interface TranscriptEntry {
  role: 'user' | 'tutor';
  text: string;
  timestamp: number;
}
