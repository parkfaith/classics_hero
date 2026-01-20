import { useState, useCallback } from 'react';

export const useAIChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // API 키는 localStorage에 저장
  const getApiKey = () => {
    return localStorage.getItem('openai_api_key') || '';
  };

  const setApiKey = (key) => {
    localStorage.setItem('openai_api_key', key);
  };

  const chat = useCallback(async (userMessage, context = '') => {
    const apiKey = getApiKey();

    if (!apiKey) {
      setError('API 키가 설정되지 않았습니다. 설정에서 OpenAI API 키를 입력해주세요.');
      return null;
    }

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

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
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
        throw new Error(errorData.error?.message || 'API 요청 실패');
      }

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data.choices[0].message.content,
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
    removeLastMessage,
    getApiKey,
    setApiKey
  };
};
