import { useState, useCallback } from 'react';

export const useHeroChat = (hero) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 초기 인사 메시지 생성
  const initializeChat = useCallback(async () => {
    const apiKey = localStorage.getItem('openai_api_key');

    if (!apiKey) {
      setError('OpenAI API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: hero.conversationStyle.systemPrompt
            },
            {
              role: 'user',
              content: 'Please greet me and introduce yourself briefly.'
            }
          ],
          temperature: 0.8,
          max_tokens: 200
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API 요청 실패');
      }

      const data = await response.json();
      const greeting = data.choices[0].message.content;

      const greetingMessage = {
        id: `msg_${Date.now()}`,
        role: 'hero',
        content: greeting,
        timestamp: Date.now()
      };

      setMessages([greetingMessage]);
    } catch (err) {
      console.error('초기 인사 메시지 생성 실패:', err);
      setError(err.message);

      // Fallback 인사 메시지
      const fallbackGreeting = {
        id: `msg_${Date.now()}`,
        role: 'hero',
        content: `Hello! I am ${hero.name}. It's a pleasure to meet you. What would you like to discuss today?`,
        timestamp: Date.now()
      };
      setMessages([fallbackGreeting]);
    } finally {
      setIsLoading(false);
    }
  }, [hero]);

  // 메시지 전송
  const sendMessage = useCallback(async (userMessage) => {
    const apiKey = localStorage.getItem('openai_api_key');

    if (!apiKey) {
      setError('OpenAI API 키가 설정되지 않았습니다.');
      return;
    }

    // 사용자 메시지 추가
    const newUserMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // 대화 히스토리 준비
      const conversationMessages = [
        {
          role: 'system',
          content: hero.conversationStyle.systemPrompt
        },
        ...messages.map(msg => ({
          role: msg.role === 'hero' ? 'assistant' : 'user',
          content: msg.content
        })),
        {
          role: 'user',
          content: userMessage
        }
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: conversationMessages,
          temperature: 0.8,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API 요청 실패');
      }

      const data = await response.json();
      const heroResponse = data.choices[0].message.content;

      // 영웅 응답 추가
      const heroMessage = {
        id: `msg_${Date.now()}_hero`,
        role: 'hero',
        content: heroResponse,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, heroMessage]);
    } catch (err) {
      console.error('메시지 전송 실패:', err);
      setError(err.message);

      // 에러 메시지 표시
      const errorMessage = {
        id: `msg_${Date.now()}_error`,
        role: 'hero',
        content: `I apologize, but I'm having trouble responding right now. Please try again. (Error: ${err.message})`,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [hero, messages]);

  // 대화 초기화
  const resetChat = useCallback(() => {
    setMessages([]);
    setError(null);
    initializeChat();
  }, [initializeChat]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    initializeChat,
    resetChat
  };
};
