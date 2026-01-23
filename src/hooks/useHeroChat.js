import { useState, useCallback } from 'react';

export const useHeroChat = (hero) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 시스템 프롬프트 보강 - 짧은 답변, 스몰토크 허용
  const enhancedSystemPrompt = `${hero.conversationStyle.systemPrompt}

IMPORTANT GUIDELINES:
- Keep responses SHORT and CONCISE (2-3 sentences max, under 50 words)
- Be conversational and friendly, allowing small talk
- If the user greets you casually or makes small talk, respond naturally and warmly
- Ask follow-up questions to encourage dialogue
- Use simple, clear English appropriate for language learners
- Stay in character but be approachable`;

  // 초기 인사 메시지 생성
  const initializeChat = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: enhancedSystemPrompt
            },
            {
              role: 'user',
              content: 'Please greet me warmly in 1-2 short sentences.'
            }
          ],
          temperature: 0.8,
          max_tokens: 80
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'API 요청 실패');
      }

      const data = await response.json();
      const greeting = data.content;

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
      // 대화 히스토리 준비 (최근 6개 메시지만 유지)
      const recentMessages = messages.slice(-6);
      const conversationMessages = [
        {
          role: 'system',
          content: enhancedSystemPrompt
        },
        ...recentMessages.map(msg => ({
          role: msg.role === 'hero' ? 'assistant' : 'user',
          content: msg.content
        })),
        {
          role: 'user',
          content: userMessage
        }
      ];

      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationMessages,
          temperature: 0.85,
          max_tokens: 100
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'API 요청 실패');
      }

      const data = await response.json();
      const heroResponse = data.content;

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
