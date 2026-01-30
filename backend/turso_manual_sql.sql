-- Turso SQL Editor에서 직접 실행할 SQL
-- classics-hero 데이터베이스 Overview에서 SQL Editor 찾기

-- ============================================
-- 1. chapter_vocabulary 테이블 마이그레이션
-- ============================================

-- 기존 테이블 삭제
DROP TABLE IF EXISTS chapter_vocabulary;

-- 새 테이블 생성 (chapter_id를 INTEGER로)
CREATE TABLE chapter_vocabulary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id INTEGER NOT NULL,
    word TEXT NOT NULL,
    definition TEXT NOT NULL,
    example TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chapter_id, word),
    FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);

-- ============================================
-- 2. 시나리오 업데이트 (3-8분으로 단축)
-- ============================================

-- Aesop 시나리오 업데이트
UPDATE heroes SET scenarios = '[
    {
        "id": "fable_lesson",
        "title": "Learn a Fable",
        "titleKo": "우화 배우기",
        "description": "Aesop teaches you one of his famous fables and its moral lesson.",
        "descriptionKo": "이솝이 유명한 우화와 그 교훈을 가르쳐줍니다.",
        "difficulty": "easy",
        "estimatedTime": "3-5분",
        "objectives": ["Listen to a fable", "Learn the moral"],
        "initialMessage": "Welcome, young learner! I am Aesop, and I have many tales to share. Would you like to hear about the Tortoise and the Hare, or perhaps the Fox and the Grapes? Choose one, and I shall tell you the story!",
        "systemPromptAddition": "Tell one fable concisely (in 2-3 short paragraphs), then explain its moral in 1-2 sentences. Answer 1-2 student questions briefly. Keep it under 5 minutes total - be concise and focused.",
        "successCriteria": {"minMessages": 6, "keyTopics": ["moral", "lesson", "story"]},
        "badge": {"icon": "📖", "name": "Fable Learner", "nameKo": "우화 학습자"}
    },
    {
        "id": "create_fable",
        "title": "Create Your Own Fable",
        "titleKo": "나만의 우화 만들기",
        "description": "Work with Aesop to create your own short fable with a moral.",
        "descriptionKo": "이솝과 함께 교훈이 담긴 나만의 짧은 우화를 만들어봅니다.",
        "difficulty": "medium",
        "estimatedTime": "4-7분",
        "objectives": ["Pick 2 animals", "Make simple story", "Add moral"],
        "initialMessage": "Ah, you wish to become a storyteller yourself! Wonderful! Let us create a fable together. First, tell me - what two animals shall be in your story? Perhaps a clever one and a foolish one?",
        "systemPromptAddition": "Quick fable creation in 3 steps: 1) Student picks 2 animals, 2) You suggest a simple 2-sentence conflict, 3) Student adds ending and moral. Keep it brief and fun - aim for 5-7 minutes total. Don'\''t overthink, just create!",
        "successCriteria": {"minMessages": 8, "keyTopics": ["animal", "story", "moral"]},
        "badge": {"icon": "✍️", "name": "Fable Creator", "nameKo": "우화 창작자"}
    }
]' WHERE id = 'aesop';

-- Franklin 시나리오 업데이트
UPDATE heroes SET scenarios = '[
    {
        "id": "daily_virtues",
        "title": "13 Virtues Practice",
        "titleKo": "13가지 덕목 실천",
        "description": "Franklin teaches you about his famous 13 virtues for self-improvement.",
        "descriptionKo": "프랭클린이 자기계발을 위한 유명한 13가지 덕목을 가르쳐줍니다.",
        "difficulty": "medium",
        "estimatedTime": "4-7분",
        "objectives": ["Learn 3-4 key virtues", "Pick one to practice"],
        "initialMessage": "Good day! I spent much of my life trying to arrive at moral perfection through 13 virtues. Would you like to hear about them? I can share how I practiced them daily, and perhaps you can choose one to focus on yourself!",
        "systemPromptAddition": "Briefly introduce your 13 virtues concept, then focus on 3-4 most practical ones: Temperance, Industry, Sincerity, Order. Let student pick one and give 1-2 quick tips. Keep under 7 minutes - be practical, not exhaustive.",
        "successCriteria": {"minMessages": 8, "keyTopics": ["virtue", "practice", "improve"]},
        "badge": {"icon": "📋", "name": "Virtue Seeker", "nameKo": "덕목 탐구자"}
    }
]' WHERE id = 'franklin';

-- Lincoln 시나리오 업데이트
UPDATE heroes SET scenarios = '[
    {
        "id": "gettysburg_speech",
        "title": "Gettysburg Address Study",
        "titleKo": "게티즈버그 연설 학습",
        "description": "Lincoln explains the meaning behind his famous Gettysburg Address.",
        "descriptionKo": "링컨이 유명한 게티즈버그 연설의 의미를 설명합니다.",
        "difficulty": "advanced",
        "estimatedTime": "5-8분",
        "objectives": ["Learn 2-3 key phrases", "Understand main message"],
        "initialMessage": "Four score and seven years ago... Do you know these words? They are from my address at Gettysburg. It was a short speech, but it carried the weight of our nation'\''s ideals. Shall I explain what it means?",
        "systemPromptAddition": "Focus on 2-3 most famous phrases: '\''Four score and seven years ago'\'', '\''all men are created equal'\'', '\''government of the people, by the people, for the people'\''. Quick context (Civil War), main idea (democracy, equality), why it matters. Concise explanations - target 8 minutes max.",
        "successCriteria": {"minMessages": 10, "keyTopics": ["people", "democracy", "freedom"]},
        "badge": {"icon": "🎤", "name": "Speech Scholar", "nameKo": "연설 학자"}
    }
]' WHERE id = 'lincoln';

-- 완료 확인
SELECT id, name_ko,
       CASE WHEN scenarios IS NOT NULL THEN 'Updated' ELSE 'Not Updated' END as status
FROM heroes
WHERE id IN ('aesop', 'franklin', 'lincoln');
