import { useState, useCallback } from 'react';
import { API_BASE } from '../api/index.js';

export const useAIChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const chat = useCallback(async (userMessage, context = '') => {
    setIsLoading(true);
    setError(null);

    // 사용자 메시지 추가
    const userMsg = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);

    try {
      const systemPrompt = context
        ? `You are a helpful English literature tutor. You're discussing the following text: "${context}". Help the student understand the text, answer questions about it, and practice English conversation. Always respond in a friendly and educational manner.`
        : 'You are a helpful English literature tutor. Help students understand classic English literature and practice English conversation.';

      const response = await fetch(`${API_BASE}/openai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'API 요청 실패');
      }

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data.content,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
      return assistantMessage.content;

    } catch (err) {
      console.error('AI Chat Error:', err);
      setError(err.message);
      setIsLoading(false);
      return null;
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const removeLastMessage = useCallback(() => {
    setMessages(prev => prev.slice(0, -1));
  }, []);

  return {
    messages,
    chat,
    isLoading,
    error,
    clearMessages,
    removeLastMessage
  };
};
