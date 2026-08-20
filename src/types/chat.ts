export interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  createdAt: number;
}

export interface MessagesResponse {
  messages: ChatMessage[];
  isKvConfigured: boolean;
}
