import os
import json
from dotenv import load_dotenv
import libsql_client

load_dotenv()

TURSO_DATABASE_URL = os.getenv("TURSO_DATABASE_URL")
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN")

# 이솝 시나리오 데이터
aesop_scenarios = [
    {
        "id": "fable_lesson",
        "title": "Learn a Fable",
        "titleKo": "우화 배우기",
        "description": "Aesop teaches you one of his famous fables and its moral lesson.",
        "descriptionKo": "이솝이 유명한 우화와 그 교훈을 가르쳐줍니다.",
        "difficulty": "easy",
        "estimatedTime": "5-10분",
        "objectives": [
            "Listen to a complete fable",
            "Understand the moral of the story",
            "Ask questions about the characters"
        ],
        "initialMessage": "Welcome, young learner! I am Aesop, and I have many tales to share. Would you like to hear about the Tortoise and the Hare, or perhaps the Fox and the Grapes? Choose one, and I shall tell you the story!",
        "systemPromptAddition": "In this scenario, you will tell one of your famous fables in full, then explain its moral. Guide the student to understand the lesson. Keep the story simple but engaging.",
        "successCriteria": {
            "minMessages": 4,
            "keyTopics": ["moral", "lesson", "story", "tortoise", "hare", "fox", "grapes"]
        },
        "badge": {
            "icon": "📖",
            "name": "Fable Learner",
            "nameKo": "우화 학습자"
        }
    },
    {
        "id": "create_fable",
        "title": "Create Your Own Fable",
        "titleKo": "나만의 우화 만들기",
        "description": "Work with Aesop to create your own short fable with a moral.",
        "descriptionKo": "이솝과 함께 교훈이 담긴 나만의 짧은 우화를 만들어봅니다.",
        "difficulty": "medium",
        "estimatedTime": "10-15분",
        "objectives": [
            "Choose animal characters",
            "Create a simple plot",
            "Define a moral lesson"
        ],
        "initialMessage": "Ah, you wish to become a storyteller yourself! Wonderful! Let us create a fable together. First, tell me - what two animals shall be in your story? Perhaps a clever one and a foolish one?",
        "systemPromptAddition": "Help the student create their own simple fable. Guide them step by step: 1) Choose animals, 2) Create a simple conflict, 3) Decide the ending, 4) Define the moral. Be encouraging and helpful.",
        "successCriteria": {
            "minMessages": 6,
            "keyTopics": ["animal", "story", "moral", "character", "ending", "lesson"]
        },
        "badge": {
            "icon": "✍️",
            "name": "Fable Creator",
            "nameKo": "우화 창작자"
        }
    }
]

# 벤자민 프랭클린 시나리오
franklin_scenarios = [
    {
        "id": "daily_virtues",
        "title": "13 Virtues Practice",
        "titleKo": "13가지 덕목 실천",
        "description": "Franklin teaches you about his famous 13 virtues for self-improvement.",
        "descriptionKo": "프랭클린이 자기계발을 위한 유명한 13가지 덕목을 가르쳐줍니다.",
        "difficulty": "medium",
        "estimatedTime": "5-10분",
        "objectives": [
            "Learn about Franklin's 13 virtues",
            "Understand practical self-improvement",
            "Set a personal goal"
        ],
        "initialMessage": "Good day! I spent much of my life trying to arrive at moral perfection through 13 virtues. Would you like to hear about them? I can share how I practiced them daily, and perhaps you can choose one to focus on yourself!",
        "systemPromptAddition": "Explain your 13 virtues system: Temperance, Silence, Order, Resolution, Frugality, Industry, Sincerity, Justice, Moderation, Cleanliness, Tranquility, Chastity, Humility. Help the student choose one to practice.",
        "successCriteria": {
            "minMessages": 4,
            "keyTopics": ["virtue", "practice", "improve", "temperance", "industry", "goal"]
        },
        "badge": {
            "icon": "📋",
            "name": "Virtue Seeker",
            "nameKo": "덕목 탐구자"
        }
    }
]

# 링컨 시나리오
lincoln_scenarios = [
    {
        "id": "gettysburg_speech",
        "title": "Gettysburg Address Study",
        "titleKo": "게티즈버그 연설 학습",
        "description": "Lincoln explains the meaning behind his famous Gettysburg Address.",
        "descriptionKo": "링컨이 유명한 게티즈버그 연설의 의미를 설명합니다.",
        "difficulty": "advanced",
        "estimatedTime": "10-15분",
        "objectives": [
            "Understand the historical context",
            "Learn key phrases from the speech",
            "Discuss the meaning of democracy"
        ],
        "initialMessage": "Four score and seven years ago... Do you know these words? They are from my address at Gettysburg. It was a short speech, but it carried the weight of our nation's ideals. Shall I explain what it means?",
        "systemPromptAddition": "Explain the Gettysburg Address phrase by phrase. Discuss its historical context (Civil War), key concepts (democracy, equality, sacrifice), and why it remains important today. Keep explanations clear for language learners.",
        "successCriteria": {
            "minMessages": 5,
            "keyTopics": ["people", "democracy", "freedom", "nation", "equal", "liberty"]
        },
        "badge": {
            "icon": "🎤",
            "name": "Speech Scholar",
            "nameKo": "연설 학자"
        }
    }
]

def update_hero_scenarios(client, hero_id, scenarios):
    """영웅의 시나리오 데이터 업데이트"""
    scenarios_json = json.dumps(scenarios)
    try:
        client.execute(
            "UPDATE heroes SET scenarios = ? WHERE id = ?",
            [scenarios_json, hero_id]
        )
        print(f"[OK] {hero_id} scenarios added ({len(scenarios)})")
    except Exception as e:
        print(f"[ERROR] {hero_id}: {e}")

if __name__ == "__main__":
    if TURSO_DATABASE_URL and TURSO_AUTH_TOKEN:
        print(f"Connecting to Turso: {TURSO_DATABASE_URL}")
        client = libsql_client.create_client_sync(
            url=TURSO_DATABASE_URL,
            auth_token=TURSO_AUTH_TOKEN
        )

        try:
            # Add scenarios column if not exists
            try:
                client.execute("ALTER TABLE heroes ADD COLUMN scenarios TEXT")
                print("scenarios column added")
            except:
                print("scenarios column already exists")

            # Add scenarios to each hero
            update_hero_scenarios(client, "aesop", aesop_scenarios)
            update_hero_scenarios(client, "franklin", franklin_scenarios)
            update_hero_scenarios(client, "lincoln", lincoln_scenarios)

            print("\nScenarios data seeding completed!")

        finally:
            client.close()
    else:
        print("Turso credentials not found. Using local SQLite...")
        import sqlite3
        conn = sqlite3.connect("data/classics.db")
        cursor = conn.cursor()

        # 시나리오 컬럼 추가
        try:
            cursor.execute("ALTER TABLE heroes ADD COLUMN scenarios TEXT")
            print("scenarios 컬럼 추가됨")
        except:
            print("scenarios 컬럼이 이미 존재함")

        # 각 영웅에게 시나리오 추가
        for hero_id, scenarios in [
            ("aesop", aesop_scenarios),
            ("franklin", franklin_scenarios),
            ("lincoln", lincoln_scenarios)
        ]:
            scenarios_json = json.dumps(scenarios)
            cursor.execute(
                "UPDATE heroes SET scenarios = ? WHERE id = ?",
                (scenarios_json, hero_id)
            )
            print(f"✓ {hero_id} 시나리오 추가 완료 ({len(scenarios)}개)")

        conn.commit()
        conn.close()
        print("\n시나리오 데이터 추가 완료!")
