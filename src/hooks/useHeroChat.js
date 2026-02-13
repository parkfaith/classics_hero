import { useState, useCallback } from 'react';
import { API_BASE } from '../api/index.js';

export const useHeroChat = (hero, scenario = null) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 시스템 프롬프트 보강 - 시나리오가 있으면 시나리오 지시 추가
  const basePrompt = hero.conversationStyle.systemPrompt;
  const scenarioAddition = scenario ? `\n\n${scenario.systemPromptAddition}` : '';
  const enhancedSystemPrompt = `${basePrompt}${scenarioAddition}

IMPORTANT GUIDELINES:
- STRICTLY keep responses to 1-2 sentences (MAX 30 words). Never exceed this limit.
- Write short, simple sentences. Split long thoughts into separate turns.
- Be conversational and friendly, allowing small talk
- If the user greets you casually or makes small talk, respond naturally and warmly
- Ask ONE follow-up question to encourage dialogue
- Use simple, clear English appropriate for language learners
- Stay in character but be approachable

GRAMMAR FEEDBACK (Important!):
- If the user makes a grammar or usage error, gently correct it BRIEFLY
- Use format: "(Tip: '[wrong]' → '[correct]')"
- Only correct 1 error per response to avoid overwhelming the learner
- If the sentence is correct, occasionally praise briefly (e.g. "Great English!")`;

  // 초기 인사 메시지 생성
  const initializeChat = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 시나리오가 있으면 initialMessage 사용, 없으면 AI 생성
      if (scenario && scenario.initialMessage) {
        const scenarioMessage = {
          id: `msg_${Date.now()}`,
          role: 'hero',
          content: scenario.initialMessage,
          timestamp: Date.now()
        };
        setMessages([scenarioMessage]);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/openai/chat`, {
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
  }, [hero, scenario, enhancedSystemPrompt]);

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

      const response = await fetch(`${API_BASE}/openai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationMessages,
          temperature: 0.85,
          max_tokens: 60
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

  // 대화 종료 요청 - 영웅이 자연스럽게 작별 인사
  const endConversation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const recentMessages = messages.slice(-4);
      const conversationMessages = [
        {
          role: 'system',
          content: `${enhancedSystemPrompt}

The user wants to end the conversation. Give a warm, brief farewell (1-2 sentences) that:
- Thanks them for the conversation
- Encourages them to come back
- Stays in character
- Does NOT ask any follow-up questions
- Ends the conversation naturally`
        },
        ...recentMessages.map(msg => ({
          role: msg.role === 'hero' ? 'assistant' : 'user',
          content: msg.content
        })),
        {
          role: 'user',
          content: 'I need to go now. Goodbye!'
        }
      ];

      const response = await fetch(`${API_BASE}/openai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationMessages,
          temperature: 0.7,
          max_tokens: 60
        })
      });

      if (!response.ok) {
        throw new Error('API 요청 실패');
      }

      const data = await response.json();

      const farewellMessage = {
        id: `msg_${Date.now()}_farewell`,
        role: 'hero',
        content: data.content,
        timestamp: Date.now(),
        isFarewell: true
      };

      setMessages(prev => [...prev, farewellMessage]);
      return true; // 종료 성공
    } catch (err) {
      console.error('대화 종료 실패:', err);
      // 폴백 작별 인사
      const fallbackFarewell = {
        id: `msg_${Date.now()}_farewell`,
        role: 'hero',
        content: `It was wonderful talking with you! Take care, and I hope to see you again soon. Farewell!`,
        timestamp: Date.now(),
        isFarewell: true
      };
      setMessages(prev => [...prev, fallbackFarewell]);
      return true;
    } finally {
      setIsLoading(false);
    }
  }, [messages, enhancedSystemPrompt]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    initializeChat,
    resetChat,
    endConversation
  };
};
