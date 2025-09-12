import {PlayerId} from '../Types';

export interface ChatMessage {
  id: string;
  playerId: PlayerId;
  playerName: string;
  message: string;
  timestamp: number;
}

export interface ChatData {
  messages: ChatMessage[];
  lastMessageId: string;
}