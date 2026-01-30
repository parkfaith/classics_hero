-- 시나리오 전체 재구성 (5분 이내)
-- Turso SQL Editor에서 실행

-- ============================================
-- 1. Aesop (Easy) - 우화 학습
-- ============================================
UPDATE heroes SET scenarios = '[
  {
    "id": "quick_fable",
    "title": "Learn a Fable",
    "titleKo": "우화 배우기",
    "description": "Listen to one of Aesop famous fables and learn its moral.",
    "descriptionKo": "이솝의 유명한 우화 하나를 듣고 교훈을 배워보세요.",
    "difficulty": "easy",
    "estimatedTime": "3분",
    "objectives": ["Listen to fable", "Learn the moral"],
    "initialMessage": "Hello! I am Aesop. I will tell you a short fable. Which do you prefer: The Tortoise and the Hare, or The Fox and the Grapes?",
    "systemPromptAddition": "Tell ONE fable in 2-3 sentences. Then explain the moral in 1 sentence. Answer 1-2 questions briefly. Keep total time under 3 minutes. Be very concise.",
    "successCriteria": {"minMessages": 4, "keyTopics": ["moral", "story"]},
    "badge": {"icon": "book", "name": "Fable Learner", "nameKo": "우화 학습자"}
  },
  {
    "id": "guess_moral",
    "title": "Guess the Moral",
    "titleKo": "교훈 맞추기",
    "description": "Listen to a fable and guess what the moral lesson is.",
    "descriptionKo": "우화를 듣고 어떤 교훈이 담겨있는지 맞춰보세요.",
    "difficulty": "easy",
    "estimatedTime": "4분",
    "objectives": ["Listen carefully", "Guess the lesson"],
    "initialMessage": "I will tell you a fable, but I will NOT tell you the moral. You must guess it! Ready?",
    "systemPromptAddition": "Tell a fable in 2-3 sentences. Do NOT say the moral. Let student guess. Give hints if needed. Confirm if correct. Keep under 4 minutes total.",
    "successCriteria": {"minMessages": 5, "keyTopics": ["guess", "moral"]},
    "badge": {"icon": "brain", "name": "Moral Detective", "nameKo": "교훈 탐정"}
  }
]' WHERE id = 'aesop';

-- ============================================
-- 2. Brothers Grimm (Easy) - 동화
-- ============================================
UPDATE heroes SET scenarios = '[
  {
    "id": "fairy_tale",
    "title": "Quick Fairy Tale",
    "titleKo": "짧은 동화",
    "description": "Enjoy a short fairy tale from the Brothers Grimm.",
    "descriptionKo": "그림 형제의 짧은 동화를 즐겨보세요.",
    "difficulty": "easy",
    "estimatedTime": "3분",
    "objectives": ["Listen to story", "Learn new words"],
    "initialMessage": "We have a wonderful tale for you today! Would you like to hear about Hansel and Gretel, or Little Red Riding Hood?",
    "systemPromptAddition": "Tell a very short version of the fairy tale in 3-4 sentences. Explain 1-2 key words. Answer 1 question. Keep under 3 minutes.",
    "successCriteria": {"minMessages": 4, "keyTopics": ["story", "character"]},
    "badge": {"icon": "castle", "name": "Tale Listener", "nameKo": "동화 청취자"}
  }
]' WHERE id = 'grimm';

-- ============================================
-- 3. O. Henry (Medium) - 단편 이야기
-- ============================================
UPDATE heroes SET scenarios = '[
  {
    "id": "twist_story",
    "title": "Story with a Twist",
    "titleKo": "반전이 있는 이야기",
    "description": "Listen to a short story with an unexpected ending.",
    "descriptionKo": "예상치 못한 결말이 있는 짧은 이야기를 들어보세요.",
    "difficulty": "medium",
    "estimatedTime": "4분",
    "objectives": ["Follow the story", "Enjoy the twist"],
    "initialMessage": "Welcome! I love stories with surprise endings. Let me tell you a very short one. It is about a young couple and Christmas gifts. Ready?",
    "systemPromptAddition": "Tell The Gift of the Magi in 4-5 sentences. Build up to twist ending. Explain why it is ironic in 1-2 sentences. Answer 1 question. Keep under 4 minutes.",
    "successCriteria": {"minMessages": 5, "keyTopics": ["gift", "irony", "love"]},
    "badge": {"icon": "gift", "name": "Twist Master", "nameKo": "반전 마스터"}
  }
]' WHERE id = 'ohenry';

-- ============================================
-- 4. Benjamin Franklin (Medium) - 실용 지혜
-- ============================================
UPDATE heroes SET scenarios = '[
  {
    "id": "one_virtue",
    "title": "Learn One Virtue",
    "titleKo": "하나의 덕목",
    "description": "Franklin teaches you one practical virtue to practice today.",
    "descriptionKo": "프랭클린이 오늘 실천할 수 있는 하나의 덕목을 가르쳐줍니다.",
    "difficulty": "medium",
    "estimatedTime": "4분",
    "objectives": ["Learn virtue", "Get practice tip"],
    "initialMessage": "Good day! I practiced 13 virtues in my life. Today I will teach you just ONE. Shall we focus on Industry, Sincerity, or Order?",
    "systemPromptAddition": "Explain the chosen virtue in 2 sentences. Give 1-2 practical tips. Answer 1 question. Keep under 4 minutes. Be practical and brief.",
    "successCriteria": {"minMessages": 5, "keyTopics": ["virtue", "practice"]},
    "badge": {"icon": "star", "name": "Virtue Student", "nameKo": "덕목 학생"}
  },
  {
    "id": "proverb",
    "title": "Learn a Proverb",
    "titleKo": "격언 배우기",
    "description": "Understand one of Franklin famous proverbs.",
    "descriptionKo": "프랭클린의 유명한 격언 하나를 이해해보세요.",
    "difficulty": "medium",
    "estimatedTime": "3분",
    "objectives": ["Understand proverb", "Use in life"],
    "initialMessage": "I am famous for my sayings! Let me teach you one: Early to bed and early to rise makes a man healthy, wealthy, and wise. Do you know what it means?",
    "systemPromptAddition": "Explain the proverb meaning in 2 sentences. Give 1 example. Answer 1 question. Keep under 3 minutes. Be clear and simple.",
    "successCriteria": {"minMessages": 4, "keyTopics": ["proverb", "meaning"]},
    "badge": {"icon": "pen", "name": "Wisdom Seeker", "nameKo": "지혜 탐구자"}
  }
]' WHERE id = 'franklin';

-- ============================================
-- 5. Marcus Aurelius (Advanced) - 스토아 철학
-- ============================================
UPDATE heroes SET scenarios = '[
  {
    "id": "stoic_idea",
    "title": "One Stoic Idea",
    "titleKo": "하나의 스토아 개념",
    "description": "Learn one key idea from Stoic philosophy.",
    "descriptionKo": "스토아 철학의 핵심 개념 하나를 배워보세요.",
    "difficulty": "advanced",
    "estimatedTime": "4분",
    "objectives": ["Understand concept", "Apply to life"],
    "initialMessage": "Greetings. I will share one Stoic principle with you. Shall we discuss Control, Virtue, or Acceptance?",
    "systemPromptAddition": "Explain the Stoic concept in 2-3 clear sentences. Give 1 modern example. Answer 1-2 questions. Keep under 4 minutes. Use accessible language.",
    "successCriteria": {"minMessages": 5, "keyTopics": ["stoic", "control", "wisdom"]},
    "badge": {"icon": "scroll", "name": "Philosophy Student", "nameKo": "철학 학생"}
  }
]' WHERE id = 'aurelius';

-- ============================================
-- 6. Abraham Lincoln (Advanced) - 연설과 리더십
-- ============================================
UPDATE heroes SET scenarios = '[
  {
    "id": "speech_phrase",
    "title": "Famous Speech Phrase",
    "titleKo": "유명한 연설 구절",
    "description": "Learn one famous phrase from Lincoln speeches.",
    "descriptionKo": "링컨 연설의 유명한 구절 하나를 배워보세요.",
    "difficulty": "advanced",
    "estimatedTime": "5분",
    "objectives": ["Learn phrase", "Understand meaning"],
    "initialMessage": "Four score and seven years ago... Do you know these words? Let me explain this famous phrase from my Gettysburg Address.",
    "systemPromptAddition": "Explain what four score and seven years ago means. Tell why this speech matters in 2-3 sentences. Answer 1-2 questions. Keep under 5 minutes.",
    "successCriteria": {"minMessages": 6, "keyTopics": ["speech", "democracy", "freedom"]},
    "badge": {"icon": "flag", "name": "Speech Scholar", "nameKo": "연설 학자"}
  },
  {
    "id": "leadership",
    "title": "Leadership Lesson",
    "titleKo": "리더십 교훈",
    "description": "Learn one leadership principle from Lincoln life.",
    "descriptionKo": "링컨의 삶에서 리더십 원칙 하나를 배워보세요.",
    "difficulty": "advanced",
    "estimatedTime": "4분",
    "objectives": ["Learn principle", "Apply lesson"],
    "initialMessage": "I faced many challenges as president. Let me share one lesson I learned about leadership. Shall we discuss Perseverance, Empathy, or Humility?",
    "systemPromptAddition": "Explain the chosen leadership principle with 1 brief story from your life (2-3 sentences). Give 1 modern application. Answer 1 question. Keep under 4 minutes.",
    "successCriteria": {"minMessages": 5, "keyTopics": ["leadership", "challenge"]},
    "badge": {"icon": "medal", "name": "Leadership Student", "nameKo": "리더십 학생"}
  }
]' WHERE id = 'lincoln';

-- ============================================
-- 완료 확인
-- ============================================
SELECT id, name_ko,
       CASE
         WHEN scenarios IS NOT NULL AND LENGTH(scenarios) > 10 THEN 'Updated'
         ELSE 'Not Updated'
       END as status
FROM heroes;
