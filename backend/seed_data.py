import json
from database import init_db, get_db, USE_TURSO

def clear_all_data(cursor):
    """기존 데이터 모두 삭제"""
    cursor.execute("DELETE FROM chapters")
    cursor.execute("DELETE FROM books")
    cursor.execute("DELETE FROM heroes")
    print("All existing data cleared")

def seed_heroes(cursor):
    """6명의 영웅 데이터 시딩 - 공개 도메인 저자들"""
    heroes = [
        # Beginner (2명)
        {
            "id": "aesop",
            "name": "Aesop",
            "name_ko": "이솝",
            "period": "620-564 BC",
            "nationality": "Ancient Greece",
            "nationality_ko": "고대 그리스",
            "occupation": json.dumps(["Storyteller", "Fabulist"]),
            "occupation_ko": json.dumps(["이야기꾼", "우화 작가"]),
            "avatar": "🦊",
            "difficulty": "easy",
            "summary": "Ancient Greek fabulist who created timeless moral tales using animal characters.",
            "summary_ko": "동물 캐릭터를 통해 시대를 초월한 도덕적 우화를 창작한 고대 그리스 우화 작가입니다.",
            "achievements": json.dumps(["Created over 600 fables", "Father of the fable genre", "Influenced Western literature for millennia"]),
            "quotes": json.dumps(["No act of kindness, no matter how small, is ever wasted.", "Slow and steady wins the race."]),
            "conversation_tone": "wise and simple",
            "conversation_personality": "A gentle storyteller who speaks in parables and often uses animal examples to illustrate points.",
            "system_prompt": "You are Aesop, the ancient Greek fabulist. Speak with wisdom but simplicity. Often use short stories or animal analogies to make your points. Your tone is gentle and instructive. Respond in English, keeping sentences relatively simple for language learners.",
            "recommended_topics": json.dumps([
                {"title": "Life Lessons", "titleKo": "인생의 교훈", "questions": ["What is the most important lesson from your fables?", "How can I be wiser?"]},
                {"title": "Animal Stories", "titleKo": "동물 이야기", "questions": ["Why do you use animals in your stories?", "Which animal teaches the best lessons?"]}
            ]),
            "tts_rate": 0.85,
            "tts_pitch": 1.0,
            "portrait_image": "/heroes/aesop.png",
            "scenarios": json.dumps([
                {
                    "id": "aesop_create_fable",
                    "title": "Create a Fable Together",
                    "titleKo": "우화 함께 만들기",
                    "description": "Work with Aesop to create your own moral tale",
                    "descriptionKo": "이솝과 함께 나만의 우화를 만들어보세요",
                    "difficulty": "easy",
                    "estimatedTime": "10분",
                    "objectives": ["Choose animal characters", "Create a simple story", "Find a moral lesson"],
                    "initialMessage": "Hello, my friend! Today, shall we create a fable together? Every good fable needs animals and a lesson. What animals do you like?",
                    "systemPromptAddition": "Guide the student to create a simple fable. Help them choose animals, create a short story, and find a moral lesson. Keep it simple and encouraging.",
                    "successCriteria": {"minMessages": 8, "keyTopics": ["animals", "story", "moral", "lesson"]},
                    "badge": {"icon": "🦊", "name": "Fable Creator", "nameKo": "우화 창작자"}
                },
                {
                    "id": "aesop_wisdom",
                    "title": "Learning Life Lessons",
                    "titleKo": "인생의 지혜 배우기",
                    "description": "Discuss life problems and learn wisdom from Aesop",
                    "descriptionKo": "인생의 고민을 나누고 이솝의 지혜를 배워보세요",
                    "difficulty": "easy",
                    "estimatedTime": "12분",
                    "objectives": ["Share a personal challenge", "Listen to a relevant fable", "Apply the lesson"],
                    "initialMessage": "Welcome! Do you have something troubling you? I have many stories that might help. What is on your mind?",
                    "systemPromptAddition": "Listen to the student's problem and share a relevant fable. Explain the moral and help them apply it to their situation.",
                    "successCriteria": {"minMessages": 10, "keyTopics": ["problem", "story", "wisdom", "advice"]},
                    "badge": {"icon": "💡", "name": "Wisdom Seeker", "nameKo": "지혜 탐구자"}
                }
            ])
        },
        {
            "id": "grimm",
            "name": "Brothers Grimm",
            "name_ko": "그림 형제",
            "period": "1785-1863",
            "nationality": "Germany",
            "nationality_ko": "독일",
            "occupation": json.dumps(["Folklorists", "Linguists", "Authors"]),
            "occupation_ko": json.dumps(["민속학자", "언어학자", "작가"]),
            "avatar": "🏰",
            "difficulty": "easy",
            "summary": "German brothers who collected and published famous fairy tales including Cinderella and Snow White.",
            "summary_ko": "신데렐라, 백설공주 등 유명한 동화를 수집하고 출판한 독일의 형제입니다.",
            "achievements": json.dumps(["Collected over 200 folk tales", "Created German Dictionary", "Preserved European folklore"]),
            "quotes": json.dumps(["All good things come in threes.", "Once upon a time..."]),
            "conversation_tone": "mysterious and enchanting",
            "conversation_personality": "Wise storytellers who see magic in everyday life and believe in the power of traditional tales.",
            "system_prompt": "You are the Brothers Grimm, famous German folklorists. Speak with a sense of wonder and mystery. You love traditional tales and believe stories carry deep wisdom. Use simple but evocative language suitable for English learners.",
            "recommended_topics": json.dumps([
                {"title": "Fairy Tales", "titleKo": "동화 이야기", "questions": ["How did you collect your stories?", "What is your favorite tale?"]},
                {"title": "Magic and Wonder", "titleKo": "마법과 경이", "questions": ["Do you believe in magic?", "Why are fairy tales important?"]}
            ]),
            "tts_rate": 0.9,
            "tts_pitch": 1.0,
            "portrait_image": "/heroes/grimm.png",
            "scenarios": json.dumps([
                {
                    "id": "grimm_story_time",
                    "title": "Storytime with the Brothers",
                    "titleKo": "그림 형제와 이야기 시간",
                    "description": "Listen to a fairy tale and discuss its magic",
                    "descriptionKo": "동화를 듣고 그 속의 마법에 대해 이야기해보세요",
                    "difficulty": "easy",
                    "estimatedTime": "10분",
                    "objectives": ["Choose a fairy tale", "Discuss the magic elements", "Understand the hidden meaning"],
                    "initialMessage": "Greetings! We have collected many wonderful tales from the old days. Which interests you more: magic spells, brave heroes, or talking animals?",
                    "systemPromptAddition": "Share a short fairy tale based on the student's interest. Discuss the magical elements and deeper meanings. Keep language simple.",
                    "successCriteria": {"minMessages": 8, "keyTopics": ["magic", "tale", "meaning", "wonder"]},
                    "badge": {"icon": "🏰", "name": "Tale Listener", "nameKo": "이야기 청취자"}
                },
                {
                    "id": "grimm_create_ending",
                    "title": "Create a New Ending",
                    "titleKo": "새로운 결말 만들기",
                    "description": "Rewrite the ending of a classic fairy tale",
                    "descriptionKo": "고전 동화의 결말을 새롭게 바꿔보세요",
                    "difficulty": "easy",
                    "estimatedTime": "12분",
                    "objectives": ["Choose a fairy tale", "Discuss what you'd change", "Create a new ending"],
                    "initialMessage": "Hello! Sometimes we wonder: what if a tale ended differently? Which of our tales would you like to change?",
                    "systemPromptAddition": "Help the student reimagine a fairy tale ending. Encourage creativity while keeping the core message.",
                    "successCriteria": {"minMessages": 10, "keyTopics": ["tale", "ending", "change", "idea"]},
                    "badge": {"icon": "✨", "name": "Story Weaver", "nameKo": "이야기 직조자"}
                }
            ])
        },
        # Intermediate (2명)
        {
            "id": "ohenry",
            "name": "O. Henry",
            "name_ko": "오 헨리",
            "period": "1862-1910",
            "nationality": "United States",
            "nationality_ko": "미국",
            "occupation": json.dumps(["Author", "Short Story Writer"]),
            "occupation_ko": json.dumps(["작가", "단편소설가"]),
            "avatar": "🎁",
            "difficulty": "medium",
            "summary": "American short story writer famous for his witty plots and surprise endings.",
            "summary_ko": "재치 있는 플롯과 반전 결말로 유명한 미국 단편소설 작가입니다.",
            "achievements": json.dumps(["Wrote nearly 300 short stories", "Master of surprise endings", "Stories still widely read today"]),
            "quotes": json.dumps(["Life is made up of sobs, sniffles, and smiles, with sniffles predominating.", "A story with a moral appended is like the bill of a mosquito."]),
            "conversation_tone": "witty and warm",
            "conversation_personality": "A clever storyteller with a warm heart who loves unexpected twists and finds beauty in ordinary people.",
            "system_prompt": "You are O. Henry, the master of short stories with surprise endings. Speak with wit and warmth. You love ordinary people and their small heroisms. You often see irony and unexpected beauty in everyday situations. Respond in English with clever observations.",
            "recommended_topics": json.dumps([
                {"title": "Surprise Endings", "titleKo": "반전 결말", "questions": ["How do you create such surprising endings?", "What inspired your famous stories?"]},
                {"title": "Human Nature", "titleKo": "인간 본성", "questions": ["What do you love most about ordinary people?", "Why do your stories touch hearts?"]}
            ]),
            "tts_rate": 0.9,
            "tts_pitch": 1.0,
            "portrait_image": "/heroes/ohenry.png",
            "scenarios": json.dumps([
                {
                    "id": "ohenry_plot_twist",
                    "title": "Master the Surprise Ending",
                    "titleKo": "반전 결말의 달인",
                    "description": "Learn how to create surprising plot twists",
                    "descriptionKo": "놀라운 반전 결말을 만드는 법을 배워보세요",
                    "difficulty": "medium",
                    "estimatedTime": "15분",
                    "objectives": ["Discuss famous twist endings", "Learn storytelling techniques", "Create your own twist"],
                    "initialMessage": "Ah, hello there! You want to know the secret of a good surprise ending? Well, it's all about making the reader look one way while truth hides in another. Shall we explore this art together?",
                    "systemPromptAddition": "Teach about plot twists using examples from your stories. Help the student understand irony and unexpected endings. Guide them to create their own twist.",
                    "successCriteria": {"minMessages": 12, "keyTopics": ["twist", "surprise", "irony", "story", "ending"]},
                    "badge": {"icon": "🎭", "name": "Plot Twister", "nameKo": "반전의 달인"}
                },
                {
                    "id": "ohenry_sacrifice",
                    "title": "Stories of Sacrifice and Love",
                    "titleKo": "희생과 사랑 이야기",
                    "description": "Discuss the meaning of true sacrifice",
                    "descriptionKo": "진정한 희생의 의미에 대해 이야기해보세요",
                    "difficulty": "medium",
                    "estimatedTime": "12분",
                    "objectives": ["Discuss 'The Gift of the Magi'", "Share personal stories", "Understand true love"],
                    "initialMessage": "Welcome, friend! I've always believed the greatest stories are about ordinary people doing extraordinary things for love. Have you ever sacrificed something important for someone you care about?",
                    "systemPromptAddition": "Discuss themes of love and sacrifice from your stories, especially 'The Gift of the Magi'. Help the student reflect on their own experiences with love and giving.",
                    "successCriteria": {"minMessages": 10, "keyTopics": ["love", "sacrifice", "giving", "gift"]},
                    "badge": {"icon": "💝", "name": "Heart of Gold", "nameKo": "황금빛 마음"}
                }
            ])
        },
        {
            "id": "franklin",
            "name": "Benjamin Franklin",
            "name_ko": "벤자민 프랭클린",
            "period": "1706-1790",
            "nationality": "United States",
            "nationality_ko": "미국",
            "occupation": json.dumps(["Statesman", "Scientist", "Writer", "Inventor"]),
            "occupation_ko": json.dumps(["정치가", "과학자", "작가", "발명가"]),
            "avatar": "⚡",
            "difficulty": "medium",
            "summary": "American polymath and Founding Father known for his practical wisdom and scientific discoveries.",
            "summary_ko": "실용적 지혜와 과학적 발견으로 유명한 미국 건국의 아버지입니다.",
            "achievements": json.dumps(["Founding Father of the United States", "Discovered electricity principles", "Invented bifocals and lightning rod"]),
            "quotes": json.dumps(["An investment in knowledge pays the best interest.", "Early to bed and early to rise makes a man healthy, wealthy, and wise.", "Time is money."]),
            "conversation_tone": "practical and wise",
            "conversation_personality": "A practical philosopher who values hard work, curiosity, and self-improvement.",
            "system_prompt": "You are Benjamin Franklin, American Founding Father and polymath. Speak with practical wisdom and occasional humor. You value industry, frugality, and self-improvement. Share advice that is useful and actionable. Respond in English with clear, practical language.",
            "recommended_topics": json.dumps([
                {"title": "Self-Improvement", "titleKo": "자기계발", "questions": ["How can I improve myself?", "What are your 13 virtues?"]},
                {"title": "Success", "titleKo": "성공", "questions": ["What is the key to success?", "How should I manage my time?"]}
            ]),
            "tts_rate": 0.9,
            "tts_pitch": 0.95,
            "portrait_image": "/heroes/franklin.png",
            "scenarios": json.dumps([
                {
                    "id": "franklin_daily_routine",
                    "title": "Design Your Perfect Day",
                    "titleKo": "완벽한 하루 설계하기",
                    "description": "Create a daily routine with Franklin's wisdom",
                    "descriptionKo": "프랭클린의 지혜로 일과를 만들어보세요",
                    "difficulty": "medium",
                    "estimatedTime": "15분",
                    "objectives": ["Learn Franklin's daily schedule", "Discuss time management", "Create your own routine"],
                    "initialMessage": "Good day! I've always believed that 'time is money.' Let me share my daily routine with you. I wake at 5 AM and ask myself: 'What good shall I do this day?' Shall we design a productive schedule for you?",
                    "systemPromptAddition": "Share your famous daily routine and the 13 virtues. Help the student design a practical schedule that balances work, learning, and rest.",
                    "successCriteria": {"minMessages": 12, "keyTopics": ["routine", "time", "productivity", "schedule"]},
                    "badge": {"icon": "⏰", "name": "Time Master", "nameKo": "시간 관리자"}
                },
                {
                    "id": "franklin_invention",
                    "title": "Brainstorm an Invention",
                    "titleKo": "발명품 아이디어 회의",
                    "description": "Think of solutions to everyday problems",
                    "descriptionKo": "일상의 문제를 해결할 아이디어를 생각해보세요",
                    "difficulty": "medium",
                    "estimatedTime": "15분",
                    "objectives": ["Identify a problem", "Brainstorm solutions", "Design a simple invention"],
                    "initialMessage": "Hello there! I invented bifocals because I was tired of switching glasses. The best inventions solve real problems. What annoys you in your daily life? Perhaps we can invent something!",
                    "systemPromptAddition": "Guide the student through the invention process: identify problem, brainstorm solutions, refine ideas. Encourage practical thinking.",
                    "successCriteria": {"minMessages": 12, "keyTopics": ["problem", "solution", "invention", "idea"]},
                    "badge": {"icon": "💡", "name": "Young Inventor", "nameKo": "젊은 발명가"}
                },
                {
                    "id": "franklin_virtues",
                    "title": "The 13 Virtues Challenge",
                    "titleKo": "13가지 덕목 도전",
                    "description": "Learn Franklin's self-improvement system",
                    "descriptionKo": "프랭클린의 자기계발 시스템을 배워보세요",
                    "difficulty": "medium",
                    "estimatedTime": "12분",
                    "objectives": ["Learn the 13 virtues", "Choose one to practice", "Make an action plan"],
                    "initialMessage": "Welcome! At age 20, I created a list of 13 virtues to improve myself: Temperance, Silence, Order, Resolution, and so on. Would you like to learn them and choose one to practice?",
                    "systemPromptAddition": "Explain your 13 virtues system. Help the student choose one virtue to focus on and create a concrete plan to practice it.",
                    "successCriteria": {"minMessages": 10, "keyTopics": ["virtues", "improvement", "practice", "habit"]},
                    "badge": {"icon": "📜", "name": "Virtue Seeker", "nameKo": "덕목 추구자"}
                }
            ])
        },
        # Advanced (2명)
        {
            "id": "aurelius",
            "name": "Marcus Aurelius",
            "name_ko": "마르쿠스 아우렐리우스",
            "period": "121-180 AD",
            "nationality": "Roman Empire",
            "nationality_ko": "로마 제국",
            "occupation": json.dumps(["Roman Emperor", "Philosopher"]),
            "occupation_ko": json.dumps(["로마 황제", "철학자"]),
            "avatar": "🏛️",
            "difficulty": "advanced",
            "summary": "Roman Emperor and Stoic philosopher, author of Meditations.",
            "summary_ko": "로마 황제이자 스토아 철학자로, 명상록의 저자입니다.",
            "achievements": json.dumps(["Last of the Five Good Emperors", "Wrote Meditations", "Exemplified philosopher-king ideal"]),
            "quotes": json.dumps(["The happiness of your life depends upon the quality of your thoughts.", "Waste no more time arguing about what a good man should be. Be one."]),
            "conversation_tone": "contemplative and measured",
            "conversation_personality": "A thoughtful philosopher-emperor who speaks with measured wisdom about virtue, duty, and inner peace.",
            "system_prompt": "You are Marcus Aurelius, Roman Emperor and Stoic philosopher. Speak with contemplative wisdom. You believe in virtue, duty, and accepting what we cannot control. Your advice is practical yet philosophical. Respond in English with thoughtful, measured language.",
            "recommended_topics": json.dumps([
                {"title": "Stoicism", "titleKo": "스토아 철학", "questions": ["How can I control my emotions?", "What is the key to inner peace?"]},
                {"title": "Leadership", "titleKo": "리더십", "questions": ["How did you lead an empire?", "What makes a good leader?"]}
            ]),
            "tts_rate": 0.85,
            "tts_pitch": 0.95,
            "portrait_image": "/heroes/aurelius.png",
            "scenarios": json.dumps([
                {
                    "id": "aurelius_morning_meditation",
                    "title": "Morning Meditation Practice",
                    "titleKo": "아침 명상 수련",
                    "description": "Practice Stoic morning reflection with Marcus",
                    "descriptionKo": "마르쿠스와 함께 스토아식 아침 성찰을 연습하세요",
                    "difficulty": "advanced",
                    "estimatedTime": "15분",
                    "objectives": ["Learn the morning meditation", "Prepare for daily challenges", "Practice acceptance"],
                    "initialMessage": "Greetings. Each morning, I remind myself: 'Today I shall meet interference, ingratitude, and selfishness.' This prepares my mind. Shall we practice this together?",
                    "systemPromptAddition": "Guide the student through your morning meditation practice. Help them anticipate challenges and prepare mentally using Stoic principles.",
                    "successCriteria": {"minMessages": 12, "keyTopics": ["meditation", "preparation", "acceptance", "stoicism"]},
                    "badge": {"icon": "🏛️", "name": "Stoic Student", "nameKo": "스토아 수련생"}
                },
                {
                    "id": "aurelius_emotions",
                    "title": "Mastering Difficult Emotions",
                    "titleKo": "감정 다스리기",
                    "description": "Learn to control anger and anxiety",
                    "descriptionKo": "분노와 불안을 다스리는 법을 배워보세요",
                    "difficulty": "advanced",
                    "estimatedTime": "18분",
                    "objectives": ["Understand Stoic view of emotions", "Practice emotional control", "Find inner peace"],
                    "initialMessage": "Even as Emperor, I face anger and fear. But remember: you have power over your mind, not outside events. What emotion troubles you most?",
                    "systemPromptAddition": "Discuss Stoic philosophy of emotions. Help the student understand what they can control vs. what they cannot. Provide practical techniques for emotional management.",
                    "successCriteria": {"minMessages": 15, "keyTopics": ["control", "emotions", "peace", "mind", "stoicism"]},
                    "badge": {"icon": "🧘", "name": "Mind Master", "nameKo": "마음의 달인"}
                },
                {
                    "id": "aurelius_purpose",
                    "title": "Finding Your Purpose",
                    "titleKo": "인생의 목적 찾기",
                    "description": "Discover your role in the grand scheme",
                    "descriptionKo": "우주 속에서 나의 역할을 발견하세요",
                    "difficulty": "advanced",
                    "estimatedTime": "20분",
                    "objectives": ["Reflect on your nature", "Understand your duty", "Find meaning"],
                    "initialMessage": "A man must stand upright, not be kept upright by others. What is your purpose? What gift can you give to the world? Let us contemplate together.",
                    "systemPromptAddition": "Help the student reflect deeply on their purpose and duty. Use Stoic philosophy to guide them toward understanding their role in society.",
                    "successCriteria": {"minMessages": 15, "keyTopics": ["purpose", "duty", "meaning", "nature"]},
                    "badge": {"icon": "⭐", "name": "Purpose Finder", "nameKo": "목적 탐구자"}
                }
            ])
        },
        {
            "id": "lincoln",
            "name": "Abraham Lincoln",
            "name_ko": "에이브러햄 링컨",
            "period": "1809-1865",
            "nationality": "United States",
            "nationality_ko": "미국",
            "occupation": json.dumps(["President", "Lawyer", "Statesman"]),
            "occupation_ko": json.dumps(["대통령", "변호사", "정치가"]),
            "avatar": "🎩",
            "difficulty": "advanced",
            "summary": "16th President of the United States, preserved the Union and ended slavery.",
            "summary_ko": "미국 제16대 대통령으로, 연방을 보존하고 노예제를 폐지했습니다.",
            "achievements": json.dumps(["Preserved the United States", "Ended slavery", "Delivered Gettysburg Address"]),
            "quotes": json.dumps(["Government of the people, by the people, for the people.", "In the end, it is not the years in your life that count. It is the life in your years."]),
            "conversation_tone": "humble and profound",
            "conversation_personality": "A humble leader who speaks with folksy wisdom but profound moral clarity.",
            "system_prompt": "You are Abraham Lincoln, 16th President of the United States. Speak with humility and moral clarity. You believe deeply in equality and democracy. You often use stories and analogies to make points. Respond in English with simple but profound language.",
            "recommended_topics": json.dumps([
                {"title": "Freedom", "titleKo": "자유", "questions": ["Why is freedom important?", "What does equality mean to you?"]},
                {"title": "Leadership", "titleKo": "리더십", "questions": ["How did you handle criticism?", "What gives you hope in dark times?"]}
            ]),
            "tts_rate": 0.85,
            "tts_pitch": 0.9,
            "portrait_image": "/heroes/lincoln.png",
            "scenarios": json.dumps([
                {
                    "id": "lincoln_gettysburg",
                    "title": "Preparing the Gettysburg Address",
                    "titleKo": "게티즈버그 연설 준비하기",
                    "description": "Help Lincoln prepare his famous speech",
                    "descriptionKo": "링컨의 유명한 연설을 함께 준비하세요",
                    "difficulty": "advanced",
                    "estimatedTime": "20분",
                    "objectives": ["Understand the Civil War context", "Discuss the speech's purpose", "Analyze key phrases"],
                    "initialMessage": "Good day. I must speak at Gettysburg, where many brave men fell. The world will little note what I say here, but I must speak from the heart. Will you help me think through this?",
                    "systemPromptAddition": "Discuss the Gettysburg Address. Help the student understand the historical context, the purpose of the speech, and the rhetorical devices used. Analyze key phrases like 'government of the people, by the people, for the people.'",
                    "successCriteria": {"minMessages": 15, "keyTopics": ["speech", "equality", "democracy", "freedom", "sacrifice"]},
                    "badge": {"icon": "🎤", "name": "Great Orator", "nameKo": "위대한 연사"}
                },
                {
                    "id": "lincoln_freedom",
                    "title": "The Meaning of Freedom",
                    "titleKo": "자유의 의미",
                    "description": "Discuss what true freedom means",
                    "descriptionKo": "진정한 자유가 무엇인지 이야기해보세요",
                    "difficulty": "advanced",
                    "estimatedTime": "18분",
                    "objectives": ["Define freedom", "Discuss equality", "Understand democracy"],
                    "initialMessage": "My friend, I have always thought that all men are created equal. But what does freedom truly mean? Is it just the absence of chains, or something more? Let us explore this together.",
                    "systemPromptAddition": "Engage in deep discussion about freedom, equality, and human rights. Connect to the Emancipation Proclamation and modern civil rights. Help the student think critically about these concepts.",
                    "successCriteria": {"minMessages": 15, "keyTopics": ["freedom", "equality", "rights", "justice"]},
                    "badge": {"icon": "🗽", "name": "Freedom Fighter", "nameKo": "자유의 수호자"}
                },
                {
                    "id": "lincoln_leadership",
                    "title": "Leadership in Crisis",
                    "titleKo": "위기 속의 리더십",
                    "description": "Learn how to lead through difficult times",
                    "descriptionKo": "어려운 시기에 리더십을 발휘하는 법을 배워보세요",
                    "difficulty": "advanced",
                    "estimatedTime": "20분",
                    "objectives": ["Discuss leadership challenges", "Learn from Civil War decisions", "Apply to modern life"],
                    "initialMessage": "Leadership is not easy. During the war, I faced impossible choices. Every decision affected thousands of lives. What leadership challenges do you face? Perhaps we can learn from each other.",
                    "systemPromptAddition": "Share your leadership experiences during the Civil War. Discuss how you handled criticism, made tough decisions, and stayed true to your principles. Help the student apply these lessons to their own life.",
                    "successCriteria": {"minMessages": 18, "keyTopics": ["leadership", "decision", "crisis", "courage", "principle"]},
                    "badge": {"icon": "🎖️", "name": "Crisis Leader", "nameKo": "위기의 리더"}
                }
            ])
        }
    ]

    for hero in heroes:
        cursor.execute("""
            INSERT OR REPLACE INTO heroes
            (id, name, name_ko, period, nationality, nationality_ko, occupation, occupation_ko,
             avatar, difficulty, summary, summary_ko, achievements, quotes,
             conversation_tone, conversation_personality, system_prompt, recommended_topics, tts_rate, tts_pitch, portrait_image, scenarios)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            hero["id"], hero["name"], hero["name_ko"], hero["period"],
            hero["nationality"], hero["nationality_ko"], hero["occupation"], hero["occupation_ko"],
            hero["avatar"], hero["difficulty"], hero["summary"], hero["summary_ko"],
            hero["achievements"], hero["quotes"], hero["conversation_tone"],
            hero["conversation_personality"], hero["system_prompt"], hero["recommended_topics"],
            hero["tts_rate"], hero["tts_pitch"], hero.get("portrait_image"), hero.get("scenarios")
        ))

    print(f"Seeded {len(heroes)} heroes")

def seed_books_and_chapters(cursor):
    """숏폼 학습에 최적화된 공개 도메인 책과 챕터 데이터"""
    books_data = [
        # ========== BEGINNER (5권) ==========
        {
            "book": {
                "id": "aesop-fables",
                "title": "Aesop's Fables",
                "author": "Aesop",
                "difficulty": "easy",
                "genre": "Fables",
                "year": -600,
                "description": "각 이야기가 100-300단어로 구성된 완벽한 숏폼 학습 콘텐츠입니다. 동물 캐릭터를 통해 삶의 교훈을 전합니다.",
                "cover_color": "#F4A460",
                "cover_image": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Aesop_pushkin01.jpg/220px-Aesop_pushkin01.jpg",
                "word_count": 800,
                "reading_time": "8분",
                "learning_focus": json.dumps(["Basic vocabulary", "Simple past tense", "Moral lessons"]),
                "hero_id": "aesop"
            },
            "chapters": [
                {
                    "title": "The Fox and the Grapes",
                    "content": """A hungry Fox saw some fine bunches of Grapes hanging from a vine that was trained along a high trellis, and did his best to reach them by jumping as high as he could into the air.

But it was all in vain, for they were just out of reach. So he gave up trying, and walked away with an air of dignity and unconcern, remarking, "I thought those Grapes were ripe, but I see now they are quite sour."

Moral: It is easy to despise what you cannot get.""",
                    "word_count": 85,
                    "vocabulary": json.dumps(["trellis", "in vain", "dignity", "unconcern", "despise", "sour"])
                },
                {
                    "title": "The Tortoise and the Hare",
                    "content": """A Hare was making fun of the Tortoise one day for being so slow.

"Do you ever get anywhere?" he asked with a mocking laugh.

"Yes," replied the Tortoise, "and I get there sooner than you think. I will run you a race and prove it."

The Hare was much amused at the idea of running a race with the Tortoise, but agreed. The Fox was to be the judge.

The Hare was soon far out of sight. To show how little he thought of the Tortoise, he lay down beside the course to take a nap.

The Tortoise meanwhile kept going slowly but steadily. When the Hare awoke, the Tortoise was near the goal.

The Hare ran his swiftest, but he could not overtake the Tortoise in time.

Moral: Slow and steady wins the race.""",
                    "word_count": 140,
                    "vocabulary": json.dumps(["mocking", "amused", "steadily", "swiftest", "overtake"])
                },
                {
                    "title": "The Ant and the Grasshopper",
                    "content": """One bright day in late autumn a family of Ants were bustling about in the warm sunshine, drying out the grain they had stored up during the summer.

A starving Grasshopper came up and humbly begged for a bite to eat.

"What!" cried the Ants in surprise. "Haven't you stored anything away for the winter? What were you doing all last summer?"

"I didn't have time to store up any food," whined the Grasshopper. "I was so busy making music that before I knew it the summer was gone."

The Ants shrugged their shoulders in disgust.

"Making music, were you?" they cried. "Very well. Now dance!"

And they turned their backs on the Grasshopper.

Moral: There is a time for work and a time for play.""",
                    "word_count": 130,
                    "vocabulary": json.dumps(["bustling", "starving", "humbly", "begged", "whined", "disgust"])
                },
                {
                    "title": "The Lion and the Mouse",
                    "content": """A Lion was awakened from sleep by a Mouse running over his face. Rising up angrily, he caught him and was about to kill him.

The Mouse begged for mercy. "Please let me go," he cried. "Some day I will surely repay you."

The Lion was amused to think that a Mouse could ever help him. But he let the Mouse go.

Some days later the Lion was caught in a trap. Unable to free himself, he roared in anger.

The Mouse heard him and ran to help. He gnawed the ropes of the net until the Lion was free.

"You laughed at me once," said the Mouse. "Now you see that even a Mouse can help a Lion."

Moral: No act of kindness is ever wasted.""",
                    "word_count": 125,
                    "vocabulary": json.dumps(["awakened", "mercy", "repay", "amused", "gnawed"])
                }
            ]
        },
        {
            "book": {
                "id": "grimm-tales",
                "title": "Grimm's Fairy Tales",
                "author": "Brothers Grimm",
                "difficulty": "easy",
                "genre": "Fairy Tales",
                "year": 1812,
                "description": "그림 형제가 수집한 독일 민담 중 짧은 이야기들입니다. 마법과 교훈이 담긴 고전 동화입니다.",
                "cover_color": "#DDA0DD",
                "cover_image": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Grimm.jpg/220px-Grimm.jpg",
                "word_count": 600,
                "reading_time": "6분",
                "learning_focus": json.dumps(["Past tense", "Story structure", "Dialogue"]),
                "hero_id": "grimm"
            },
            "chapters": [
                {
                    "title": "The Star Money",
                    "content": """There was once a little girl whose father and mother were dead. She was so poor that she no longer had any room to live in, or bed to sleep in.

At last she had nothing left but the clothes on her back and a piece of bread in her hand.

She went out into the country, and a poor man met her. "Give me something to eat," he said. She gave him the whole of her bread.

Then she met a child who said, "My head is so cold. Give me your cap." She gave her cap.

Another child asked for her dress. She gave that too.

At last she stood in a forest with nothing left at all. Then the stars from heaven fell down. They were shining silver coins.

She gathered them up and was rich all her life.

Moral: Kindness brings its own reward.""",
                    "word_count": 150,
                    "vocabulary": json.dumps(["country", "shining", "silver", "gathered", "reward"])
                },
                {
                    "title": "The Golden Key",
                    "content": """In the winter time, when deep snow lay on the ground, a poor boy had to go out on a sledge to fetch wood.

When he had gathered it together, he thought he would not go home at once, but would first light a fire to warm himself a little.

So he scraped away the snow, and as he was clearing the ground, he found a small golden key.

He looked for the lock to which the key might belong. After much searching, he found an iron chest buried in the earth.

"If the key does but fit it!" thought he. "There must be precious things in that chest."

He searched, but no keyhole was to be found. At last he discovered one, so small it was hardly visible.

He tried it, and the key fitted exactly. Then he turned it once round.

And now we must wait until he has quite unlocked it and opened the lid. Then we shall learn what wonderful things were lying in that chest.

Moral: Some mysteries are worth waiting for.""",
                    "word_count": 175,
                    "vocabulary": json.dumps(["sledge", "scraped", "precious", "visible", "mysteries"])
                }
            ]
        },
        {
            "book": {
                "id": "mother-goose",
                "title": "Mother Goose Rhymes",
                "author": "Traditional",
                "difficulty": "easy",
                "genre": "Poetry",
                "year": 1697,
                "description": "영어권에서 가장 유명한 전통 동요 모음입니다. 리듬과 운율 학습에 최적입니다.",
                "cover_color": "#FFD700",
                "cover_image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Mother_Goose.png/220px-Mother_Goose.png",
                "word_count": 300,
                "reading_time": "4분",
                "learning_focus": json.dumps(["Rhyming words", "Rhythm", "Basic vocabulary"]),
                "hero_id": None
            },
            "chapters": [
                {
                    "title": "Classic Nursery Rhymes",
                    "content": """Twinkle, twinkle, little star,
How I wonder what you are!
Up above the world so high,
Like a diamond in the sky.

Mary had a little lamb,
Its fleece was white as snow.
And everywhere that Mary went
The lamb was sure to go.

It followed her to school one day,
Which was against the rule.
It made the children laugh and play
To see a lamb at school.

Humpty Dumpty sat on a wall,
Humpty Dumpty had a great fall.
All the king's horses and all the king's men
Could not put Humpty together again.""",
                    "word_count": 100,
                    "vocabulary": json.dumps(["twinkle", "wonder", "diamond", "fleece", "against"])
                },
                {
                    "title": "More Rhymes to Learn",
                    "content": """Jack and Jill went up the hill
To fetch a pail of water.
Jack fell down and broke his crown,
And Jill came tumbling after.

Little Bo-Peep has lost her sheep,
And does not know where to find them.
Leave them alone, and they will come home,
Bringing their tails behind them.

Hey diddle diddle,
The cat and the fiddle,
The cow jumped over the moon.
The little dog laughed
To see such sport,
And the dish ran away with the spoon.

Row, row, row your boat,
Gently down the stream.
Merrily, merrily, merrily, merrily,
Life is but a dream.""",
                    "word_count": 100,
                    "vocabulary": json.dumps(["fetch", "pail", "crown", "tumbling", "merrily"])
                }
            ]
        },
        {
            "book": {
                "id": "andersen-tales",
                "title": "Andersen's Fairy Tales",
                "author": "Hans Christian Andersen",
                "difficulty": "easy",
                "genre": "Fairy Tales",
                "year": 1835,
                "description": "안데르센의 아름다운 동화 중 짧은 이야기들입니다. 상상력과 감동이 가득합니다.",
                "cover_color": "#87CEEB",
                "cover_image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Hans_Christian_Andersen_%281834_painting%29.jpg/220px-Hans_Christian_Andersen_%281834_painting%29.jpg",
                "word_count": 500,
                "reading_time": "5분",
                "learning_focus": json.dumps(["Descriptive words", "Emotions", "Simple narrative"]),
                "hero_id": None
            },
            "chapters": [
                {
                    "title": "The Princess and the Pea",
                    "content": """Once upon a time there was a prince who wanted to marry a princess. But she would have to be a real princess.

He traveled all over the world to find one, but nowhere could he get what he wanted. There were princesses enough, but he could never be sure whether they were real princesses.

At last he came home again, and he was sad.

One evening there was a terrible storm. There was thunder and lightning, and the rain poured down in torrents.

In the midst of this storm, somebody knocked at the city gate.

The old king went to open it. A princess was standing outside. But what a sight she was from the rain and the weather! The water ran down from her hair and clothes.

Yet she said that she was a real princess.

"We will soon find that out," thought the old queen.

She put a pea on the bed. Then she took twenty mattresses and laid them on the pea. The princess was to sleep on them.

In the morning they asked her how she had slept.

"I scarcely closed my eyes the whole night," said the princess. "I felt something hard. I am black and blue all over."

Now they knew that she was a real princess because she had felt the pea through twenty mattresses.

The prince took her for his wife, for now he knew that he had a real princess.""",
                    "word_count": 230,
                    "vocabulary": json.dumps(["torrents", "midst", "scarcely", "mattresses"])
                }
            ]
        },
        {
            "book": {
                "id": "peter-rabbit",
                "title": "The Tale of Peter Rabbit",
                "author": "Beatrix Potter",
                "difficulty": "easy",
                "genre": "Children's Literature",
                "year": 1902,
                "description": "장난꾸러기 토끼 피터의 모험 이야기입니다. 간결하면서도 우아한 영어 표현을 배울 수 있습니다.",
                "cover_color": "#90EE90",
                "cover_image": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PeterRabbit4.jpg/220px-PeterRabbit4.jpg",
                "word_count": 400,
                "reading_time": "5분",
                "learning_focus": json.dumps(["Descriptive language", "Action verbs", "British English"]),
                "hero_id": None
            },
            "chapters": [
                {
                    "title": "Peter's Mischief",
                    "content": """Once upon a time there were four little Rabbits, and their names were Flopsy, Mopsy, Cotton-tail, and Peter.

They lived with their Mother in a sand-bank, underneath the root of a very big fir-tree.

"Now my dears," said old Mrs. Rabbit one morning, "you may go into the fields or down the lane. But do not go into Mr. McGregor's garden."

"Your Father had an accident there. He was put in a pie by Mrs. McGregor."

Flopsy, Mopsy, and Cotton-tail, who were good little bunnies, went down the lane to gather blackberries.

But Peter, who was very naughty, ran straight away to Mr. McGregor's garden, and squeezed under the gate!

First he ate some lettuces and some French beans. And then he ate some radishes.

And then, feeling rather sick, he went to look for some parsley.

But round the end of a cucumber frame, whom should he meet but Mr. McGregor!""",
                    "word_count": 160,
                    "vocabulary": json.dumps(["sand-bank", "fir-tree", "lane", "naughty", "squeezed", "parsley"])
                },
                {
                    "title": "The Chase",
                    "content": """Mr. McGregor was on his hands and knees planting out young cabbages. But he jumped up and ran after Peter, waving a rake and calling out, "Stop thief!"

Peter was most dreadfully frightened. He rushed all over the garden, for he had forgotten the way back to the gate.

He lost one of his shoes among the cabbages. And the other shoe amongst the potatoes.

After losing them, he ran on four legs and went faster.

I think he might have got away altogether if he had not unfortunately run into a gooseberry net, and got caught by the large buttons on his jacket. It was a blue jacket with brass buttons, quite new.

Peter gave himself up for lost, and shed big tears.

Some friendly sparrows flew to him and implored him to try harder.

Mr. McGregor came up with a sieve, which he meant to pop upon the top of Peter.

But Peter wriggled out just in time, leaving his jacket behind him.""",
                    "word_count": 165,
                    "vocabulary": json.dumps(["dreadfully", "unfortunately", "gooseberry", "brass", "implored", "wriggled"])
                }
            ]
        },
        # ========== INTERMEDIATE (5권) ==========
        {
            "book": {
                "id": "gift-of-magi",
                "title": "The Gift of the Magi",
                "author": "O. Henry",
                "difficulty": "medium",
                "genre": "Short Stories",
                "year": 1905,
                "description": "사랑하는 사람을 위한 희생을 그린 오 헨리의 대표작입니다. 아이러니와 반전의 교과서입니다.",
                "cover_color": "#FFB347",
                "cover_image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/O._Henry_portrait.jpg/220px-O._Henry_portrait.jpg",
                "word_count": 600,
                "reading_time": "7분",
                "learning_focus": json.dumps(["Irony", "Descriptive language", "Emotional vocabulary"]),
                "hero_id": "ohenry"
            },
            "chapters": [
                {
                    "title": "Della's Dilemma",
                    "content": """One dollar and eighty-seven cents. That was all. And sixty cents of it was in pennies.

Three times Della counted it. One dollar and eighty-seven cents. And the next day would be Christmas.

There was clearly nothing to do but flop down on the shabby little couch and cry. So Della did it.

Now, Della and her husband Jim were not rich. They lived in a furnished flat for eight dollars a week.

In the hall below was a letter-box too small for letters, and an electric button from which no finger could get a ring.

There was a card bearing the name "Mr. James Dillingham Young."

When the income came down from thirty dollars to twenty dollars, the letters of "Dillingham" looked blurred, as though they were thinking seriously of becoming a modest and unassuming D.

But whenever Mr. James Dillingham Young came home, Mrs. James Dillingham Young called him "Jim" and hugged him. Which is all very good.""",
                    "word_count": 160,
                    "vocabulary": json.dumps(["shabby", "furnished", "bearing", "blurred", "unassuming"])
                },
                {
                    "title": "Two Treasures",
                    "content": """Now, there were two possessions of the Dillingham Youngs in which they both took a mighty pride.

One was Jim's gold watch that had been his father's and his grandfather's.

The other was Della's hair.

Had the queen of Sheba lived in the flat across the air shaft, Della would have let her hair hang out the window to dry, just to show off.

Had King Solomon been the janitor, with all his treasures piled up in the basement, Jim would have pulled out his watch every time he passed, just to see him pull at his beard with envy.

So now Della's beautiful hair fell about her, rippling and shining like a cascade of brown waters. It reached below her knee and made itself almost a garment for her.

And then she did it up again nervously and quickly.

A tear or two splashed on the worn red carpet.

On went her old brown jacket; on went her old brown hat.

She hurried down the stairs to the street and walked to a shop with a sign: "Madame Sofronie. Hair Goods of All Kinds."

"Will you buy my hair?" asked Della.

"I buy hair," said Madame. "Take your hat off and let me see it."

Down rippled the brown cascade.

"Twenty dollars," said Madame.""",
                    "word_count": 210,
                    "vocabulary": json.dumps(["possessions", "cascade", "garment", "nervously", "splashed"])
                }
            ]
        },
        {
            "book": {
                "id": "last-leaf",
                "title": "The Last Leaf",
                "author": "O. Henry",
                "difficulty": "medium",
                "genre": "Short Stories",
                "year": 1907,
                "description": "희망과 예술적 희생에 관한 가슴 뭉클한 이야기입니다.",
                "cover_color": "#8B4513",
                "cover_image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/O._Henry_portrait.jpg/220px-O._Henry_portrait.jpg",
                "word_count": 700,
                "reading_time": "8분",
                "learning_focus": json.dumps(["Medical vocabulary", "Artistic terms", "Emotional expressions"]),
                "hero_id": "ohenry"
            },
            "chapters": [
                {
                    "title": "Johnsy Falls Ill",
                    "content": """In a little district west of Washington Square the streets have run crazy and broken themselves into small strips called "places."

At the top of a three-story building, Sue and Johnsy had their studio. "Johnsy" was a name for Joanna.

One was from Maine; the other from California. They had met at a cafe and found their tastes in art, food, and fashion so similar that the joint studio resulted.

That was in May. In November a cold, unseen stranger, whom the doctors called Pneumonia, walked about the neighborhood, touching one here and there with his icy fingers.

He touched Johnsy. She lay, scarcely moving, on her bed, looking through the small window at the blank side of the next brick house.

One morning the doctor took Sue into the hallway.

"She has one chance in ten," he said. "And that chance is for her to want to live. Your little lady has made up her mind that she is not going to get well. Has she anything on her mind?"

"She wanted to paint the Bay of Naples some day," said Sue.

"Paint? Nonsense! Is there anything worth thinking about? A man, for example?"

"No," said Sue. "There is nothing of the kind."

"Well, then," said the doctor, "I will do all that science can accomplish. But whenever my patient begins to count the carriages in her funeral procession, I subtract 50 percent from the medicine's power."

After the doctor had gone, Sue went into the workroom and cried.""",
                    "word_count": 250,
                    "vocabulary": json.dumps(["studio", "pneumonia", "scarcely", "funeral", "procession", "subtract"])
                },
                {
                    "title": "The Masterpiece",
                    "content": """Sue found Johnsy with dull, wide-open eyes, staring at the window.

"What is it, dear?" asked Sue.

"Six," said Johnsy. "They are falling faster now. Three days ago there were almost a hundred. It made my head ache to count them. But now it is easy. There goes another one. There are only five left now."

"Five what, dear?"

"Leaves. On the ivy vine. When the last one falls, I must go, too. I've known that for three days."

"Oh, I never heard of such nonsense," complained Sue. "What have old ivy leaves to do with your getting well?"

"The last one will fall today, and I shall die at the same time."

Sue looked out the window. There was only a bare, dreary yard to be seen, and the blank side of the brick house twenty feet away. An old, old ivy vine climbed half way up the brick wall. The cold breath of autumn had stricken its leaves from the vine until its skeleton branches clung, almost bare, to the crumbling bricks.

"Try to sleep," said Sue. "I must call old Behrman up to be my model. I'll be back in a minute."

Old Behrman was a painter who lived on the ground floor beneath them. He was past sixty and had a long white beard curling down over his chest. Despite forty years in art, he had never painted a masterpiece. For years he had been always about to paint one but had never yet begun it.

"Someday I will paint a masterpiece," he would say, "and we shall all go away."

He sneered at softness in anyone, and he regarded himself as a watchdog of the two young artists in the studio above.""",
                    "word_count": 290,
                    "vocabulary": json.dumps(["ivy", "dreary", "stricken", "skeleton", "crumbling", "sneered", "watchdog"])
                }
            ]
        },
        {
            "book": {
                "id": "way-to-wealth",
                "title": "The Way to Wealth",
                "author": "Benjamin Franklin",
                "difficulty": "medium",
                "genre": "Essays",
                "year": 1758,
                "description": "벤자민 프랭클린의 실용적 지혜가 담긴 에세이입니다. Talk to Hero 기능과 연계하기 좋습니다.",
                "cover_color": "#D2B48C",
                "cover_image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Joseph_Siffrein_Duplessis_-_Benjamin_Franklin_-_Google_Art_Project.jpg/220px-Joseph_Siffrein_Duplessis_-_Benjamin_Franklin_-_Google_Art_Project.jpg",
                "word_count": 600,
                "reading_time": "7분",
                "learning_focus": json.dumps(["Practical advice", "Proverbs", "18th century English"]),
                "hero_id": "franklin"
            },
            "chapters": [
                {
                    "title": "Industry and Diligence",
                    "content": """Friends, says he, and neighbors, the taxes are indeed very heavy. We are taxed twice as much by our idleness, three times as much by our pride, and four times as much by our folly.

God helps them that help themselves, as Poor Richard says. And again, He that rises late must trot all day.

Sloth, like rust, consumes faster than labor wears, while the used key is always bright, as Poor Richard says.

But dost thou love life? Then do not squander time, for that is the stuff life is made of.

How much more than is necessary do we spend in sleep, forgetting that the sleeping fox catches no poultry, and that there will be sleeping enough in the grave!

If time be of all things the most precious, wasting time must be the greatest waste.

Lost time is never found again; and what we call time enough always proves little enough.

Let us then be up and be doing, and doing to the purpose; so by diligence shall we do more with less confusion.

Sloth makes all things difficult, but industry makes all things easy, as Poor Richard says.

He that riseth late must trot all day, and shall scarce overtake his business at night.

While laziness travels so slowly, that poverty soon overtakes him.

Drive thy business, or it will drive thee; and early to bed, and early to rise, makes a man healthy, wealthy, and wise.""",
                    "word_count": 240,
                    "vocabulary": json.dumps(["idleness", "folly", "sloth", "squander", "diligence", "overtake"])
                },
                {
                    "title": "Frugality and Prudence",
                    "content": """A fat kitchen makes a lean will, as Poor Richard says; and many estates are spent in the getting.

If you would be wealthy, think of saving as well as of getting.

Away then with your expensive follies, and you will not then have so much cause to complain of hard times.

What maintains one vice would bring up two children.

You may think, perhaps, that a little tea, or a little punch now and then, diet a little more costly, clothes a little finer, and a little more entertainment now and then can be no great matter.

But remember what Poor Richard says: Beware of little expenses; a small leak will sink a great ship.

Who dainties love shall beggars prove; and moreover, fools make feasts, and wise men eat them.

Buy what thou hast no need of, and ere long thou shalt sell thy necessaries.

If you would know the value of money, go and try to borrow some.

He that goes borrowing goes sorrowing; and indeed so does he that lends to such people.

Fond pride of dress is sure a very curse. Ere fancy you consult, consult your purse.

Pride is as loud a beggar as want, and a great deal more saucy.

When you have bought one fine thing, you must buy ten more, that your appearance may be all of a piece.

It is easier to suppress the first desire than to satisfy all that follow it.""",
                    "word_count": 250,
                    "vocabulary": json.dumps(["estates", "frugality", "prudence", "dainties", "saucy", "suppress"])
                }
            ]
        },
        {
            "book": {
                "id": "happy-prince",
                "title": "The Happy Prince",
                "author": "Oscar Wilde",
                "difficulty": "medium",
                "genre": "Fairy Tales",
                "year": 1888,
                "description": "희생과 사랑에 관한 오스카 와일드의 아름다운 동화입니다. 문체가 유려하여 필사 학습에 좋습니다.",
                "cover_color": "#E6E6FA",
                "cover_image": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Oscar_Wilde_Sarony.jpg/220px-Oscar_Wilde_Sarony.jpg",
                "word_count": 700,
                "reading_time": "8분",
                "learning_focus": json.dumps(["Literary style", "Descriptive writing", "Symbolism"]),
                "hero_id": None
            },
            "chapters": [
                {
                    "title": "The Statue and the Swallow",
                    "content": """High above the city, on a tall column, stood the statue of the Happy Prince. He was gilded all over with thin leaves of fine gold.

For eyes he had two bright sapphires. A large red ruby glowed on his sword-hilt.

He was very much admired indeed.

"He is as beautiful as a weathercock," remarked one of the Town Councillors.

"Why cannot you be like the Happy Prince?" asked a sensible mother of her little boy who was crying for the moon. "The Happy Prince never dreams of crying for anything."

"I am glad there is someone in the world who is quite happy," muttered a disappointed man as he gazed at the wonderful statue.

"He looks just like an angel," said the Charity Children as they came out of the cathedral in their bright scarlet cloaks.

One night there flew over the city a little Swallow. His friends had gone away to Egypt six weeks before, but he had stayed behind.

He was in love with the most beautiful Reed. He had met her early in the spring, and had been so attracted by her slender waist that he had stopped to talk to her.

"Shall I love you?" said the Swallow.

And the Reed made him a low bow.

So he flew round and round her, touching the water with his wings, and making silver ripples. This was his courtship, and it lasted all through the summer.

"It is a ridiculous attachment," twittered the other Swallows. "She has no money, and far too many relations."

And indeed the river was quite full of Reeds.

Then when the autumn came, they all flew away.""",
                    "word_count": 270,
                    "vocabulary": json.dumps(["gilded", "sapphires", "ruby", "weathercock", "cathedral", "courtship"])
                },
                {
                    "title": "The Prince's Request",
                    "content": """After they had gone, the Swallow felt lonely. He grew tired of his love.

"She has no conversation," he said. "And I am afraid that she is a flirt. She is always flirting with the wind."

And certainly, whenever the wind blew, the Reed made the most graceful curtseys.

"I admit that she is domestic," he continued, "but I love travelling. My wife, consequently, should love travelling also."

"Will you come away with me?" he asked finally.

But the Reed shook her head. She was so attached to her home.

"You have been trifling with me," he cried. "I am off to the Pyramids. Goodbye!"

And he flew away.

All day long he flew. At night-time he arrived at the city.

"Where shall I stay?" he said. "I hope the town has made preparations."

Then he saw the statue on the tall column.

"I will stay there," he cried. "It is a fine position, with plenty of fresh air."

So he alighted just between the feet of the Happy Prince.

"I have a golden bedroom," he said softly to himself as he looked round. And he prepared to go to sleep.

But just as he was putting his head under his wing, a large drop of water fell on him.

"What a curious thing!" he cried. "There is not a single cloud in the sky. And yet it is raining."

Then another drop fell.

"What is the use of a statue if it cannot keep the rain off?" he said. "I must look for a good chimney-pot."

But before he had opened his wings, a third drop fell.

He looked up, and saw... Ah! What did he see?

The eyes of the Happy Prince were filled with tears, and tears were running down his golden cheeks.""",
                    "word_count": 300,
                    "vocabulary": json.dumps(["flirt", "curtseys", "domestic", "trifling", "alighted", "chimney-pot"])
                }
            ]
        },
        {
            "book": {
                "id": "poor-richard",
                "title": "Poor Richard's Almanack",
                "author": "Benjamin Franklin",
                "difficulty": "medium",
                "genre": "Proverbs",
                "year": 1732,
                "description": "벤자민 프랭클린의 지혜로운 격언 모음집입니다. 짧은 문장으로 영어 표현력을 기를 수 있습니다.",
                "cover_color": "#8B4513",
                "cover_image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Joseph_Siffrein_Duplessis_-_Benjamin_Franklin_-_Google_Art_Project.jpg/220px-Joseph_Siffrein_Duplessis_-_Benjamin_Franklin_-_Google_Art_Project.jpg",
                "word_count": 400,
                "reading_time": "5분",
                "learning_focus": json.dumps(["Proverbs", "Wisdom", "Short sentences"]),
                "hero_id": "franklin"
            },
            "chapters": [
                {
                    "title": "Wisdom for Daily Life",
                    "content": """Early to bed and early to rise, makes a man healthy, wealthy, and wise.

A penny saved is a penny earned.

An investment in knowledge pays the best interest.

By failing to prepare, you are preparing to fail.

Well done is better than well said.

Tell me and I forget, teach me and I may remember, involve me and I learn.

Energy and persistence conquer all things.

Lost time is never found again.

He that is good for making excuses is seldom good for anything else.

Do not fear mistakes. You will know failure. Continue to reach out.

Hide not your talents. They for use were made. What is a sundial in the shade?

It takes many good deeds to build a good reputation, and only one bad one to lose it.

Be at war with your vices, at peace with your neighbors, and let every new year find you a better man.

Honesty is the best policy.

Never leave that till tomorrow which you can do today.

There never was a good war or a bad peace.

A true friend is the best possession.

We are all born ignorant, but one must work hard to remain stupid.

Speak little, do much.

Without continual growth and progress, such words as improvement, achievement, and success have no meaning.""",
                    "word_count": 210,
                    "vocabulary": json.dumps(["investment", "persistence", "conquer", "sundial", "reputation", "continual"])
                }
            ]
        },
        # ========== ADVANCED (4권) ==========
        {
            "book": {
                "id": "meditations",
                "title": "Meditations",
                "author": "Marcus Aurelius",
                "difficulty": "advanced",
                "genre": "Philosophy",
                "year": 180,
                "description": "스토아 철학의 정수가 담긴 명상록입니다. 구절 단위로 나뉘어 있어 조각 학습에 최적입니다.",
                "cover_color": "#708090",
                "cover_image": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/MSR-ra-61-b-1-DM.jpg/220px-MSR-ra-61-b-1-DM.jpg",
                "word_count": 600,
                "reading_time": "8분",
                "learning_focus": json.dumps(["Abstract concepts", "Complex sentences", "Stoic philosophy"]),
                "hero_id": "aurelius"
            },
            "chapters": [
                {
                    "title": "Morning Reflection",
                    "content": """Begin each day by telling yourself: Today I shall be meeting with interference, ingratitude, insolence, disloyalty, ill-will, and selfishness.

All of them are due to the offenders' ignorance of what is good or evil.

But for my part I have long perceived the nature of good and its nobility, the nature of evil and its meanness, and also the nature of the culprit himself, who is my brother.

Not in the physical sense, but as a fellow creature similarly endowed with reason and a share of the divine.

Therefore none of those things can injure me, for nobody can implicate me in what is degrading.

Neither can I be angry with my brother or fall foul of him.

For he and I were born to work together, like a man's two hands, feet, or eyelids.

Or like the upper and lower rows of his teeth.

To obstruct each other is against nature's law. And what is irritation or aversion but a form of obstruction?

Never value anything as profitable that compels you to break your promise, lose your self-respect, hate any man, suspect, curse, act the hypocrite, or desire anything that needs walls or curtains.

For he who values above all else his own intelligence and spirit, and the worship of its excellence, makes no outcry, forms no complains, craves neither solitude nor society.

Best of all, he will live without either pursuing or fleeing. Whether he is to enjoy life in a body for a longer or shorter time, is the least of his concerns.""",
                    "word_count": 250,
                    "vocabulary": json.dumps(["ingratitude", "insolence", "culprit", "endowed", "implicate", "degrading", "obstruct", "aversion"])
                },
                {
                    "title": "On Transience",
                    "content": """Of human life the time is a point, and the substance is in a flux, and the perception dull, and the composition of the whole body subject to putrefaction.

The soul is a spinning-Loss, and fortune hard to divine, and fame a thing devoid of judgment.

In a word, everything that belongs to the body is a stream, and what belongs to the soul is a dream and vapor.

Life is a warfare and a stranger's sojourn, and after-fame is oblivion.

What then is that which is able to conduct a man?

One thing and only one: philosophy.

And this consists in keeping the spirit within a man free from violence and unharmed.

Superior to pains and pleasures, doing nothing without purpose, nor yet falsely and with hypocrisy.

Not feeling the need of another's doing or not doing anything.

And besides, accepting all that happens, and all that is allotted.

For all that happens comes from the same source.

And finally, waiting for death with a cheerful mind, as being nothing else than a dissolution of the elements of which every living being is composed.

And if there is no harm to the elements themselves in each continually changing into another, why should a man have any apprehension about the change and dissolution of all the elements?

For it is according to nature, and nothing is evil which is according to nature.""",
                    "word_count": 240,
                    "vocabulary": json.dumps(["transience", "putrefaction", "devoid", "sojourn", "oblivion", "hypocrisy", "dissolution", "apprehension"])
                }
            ]
        },
        {
            "book": {
                "id": "gettysburg",
                "title": "The Gettysburg Address",
                "author": "Abraham Lincoln",
                "difficulty": "advanced",
                "genre": "Speeches",
                "year": 1863,
                "description": "미국 역사상 가장 유명한 연설문입니다. 272단어에 담긴 강력한 수사학을 배울 수 있습니다.",
                "cover_color": "#2F4F4F",
                "cover_image": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Abraham_Lincoln_O-77_matte_collodion_print.jpg/220px-Abraham_Lincoln_O-77_matte_collodion_print.jpg",
                "word_count": 272,
                "reading_time": "4분",
                "learning_focus": json.dumps(["Rhetorical devices", "Formal speech", "Historical context"]),
                "hero_id": "lincoln"
            },
            "chapters": [
                {
                    "title": "The Gettysburg Address",
                    "content": """Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in liberty, and dedicated to the proposition that all men are created equal.

Now we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure.

We are met on a great battlefield of that war.

We have come to dedicate a portion of that field, as a final resting place for those who here gave their lives that that nation might live.

It is altogether fitting and proper that we should do this.

But, in a larger sense, we cannot dedicate, we cannot consecrate, we cannot hallow this ground.

The brave men, living and dead, who struggled here, have consecrated it, far above our poor power to add or detract.

The world will little note, nor long remember what we say here, but it can never forget what they did here.

It is for us the living, rather, to be dedicated here to the unfinished work which they who fought here have thus far so nobly advanced.

It is rather for us to be here dedicated to the great task remaining before us.

That from these honored dead we take increased devotion to that cause for which they gave the last full measure of devotion.

That we here highly resolve that these dead shall not have died in vain.

That this nation, under God, shall have a new birth of freedom.

And that government of the people, by the people, for the people, shall not perish from the earth.""",
                    "word_count": 272,
                    "vocabulary": json.dumps(["score", "conceived", "proposition", "consecrate", "hallow", "detract", "devotion", "perish"])
                }
            ]
        },
        {
            "book": {
                "id": "self-reliance",
                "title": "Self-Reliance",
                "author": "Ralph Waldo Emerson",
                "difficulty": "advanced",
                "genre": "Essays",
                "year": 1841,
                "description": "자기 신뢰의 중요성을 역설한 에머슨의 대표작입니다. 초월주의 철학의 핵심을 담고 있습니다.",
                "cover_color": "#6B8E23",
                "cover_image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Ralph_Waldo_Emerson_ca1857_retouched.jpg/220px-Ralph_Waldo_Emerson_ca1857_retouched.jpg",
                "word_count": 600,
                "reading_time": "8분",
                "learning_focus": json.dumps(["Individualism", "Abstract thinking", "Persuasive writing"]),
                "hero_id": None
            },
            "chapters": [
                {
                    "title": "Trust Thyself",
                    "content": """There is a time in every man's education when he arrives at the conviction that envy is ignorance; that imitation is suicide.

He must take himself for better, for worse, as his portion.

That though the wide universe is full of good, no kernel of nourishing corn can come to him but through his toil bestowed on that plot of ground which is given to him to till.

The power which resides in him is new in nature.

None but he knows what that is which he can do, nor does he know until he has tried.

Trust thyself: every heart vibrates to that iron string.

Accept the place the divine providence has found for you.

Accept the society of your contemporaries, the connection of events.

Great men have always done so, and confided themselves childlike to the genius of their age.

Betraying their perception that the absolutely trustworthy was seated at their heart.

Working through their hands, predominating in all their being.

And we are now men, and must accept in the highest mind the same transcendent destiny.

We are not minors and invalids in a protected corner.

We are not cowards fleeing before a revolution.

But guides, redeemers, and benefactors, obeying the Almighty effort, and advancing on Chaos and the Dark.

What pretty oracles nature yields us on this text, in the face and behavior of children, babes, and even brutes!

That divided and rebel mind, that distrust of a sentiment because our arithmetic has computed the strength and means opposed to our purpose, these have not.

Their mind being whole, their eye is as yet unconquered.""",
                    "word_count": 270,
                    "vocabulary": json.dumps(["conviction", "imitation", "bestowed", "providence", "contemporaries", "transcendent", "benefactors", "unconquered"])
                },
                {
                    "title": "Nonconformity",
                    "content": """Whoso would be a man must be a nonconformist.

He who would gather immortal palms must not be hindered by the name of goodness, but must explore if it be goodness.

Nothing is at last sacred but the integrity of your own mind.

Absolve you to yourself, and you shall have the suffrage of the world.

I remember an answer which when quite young I was prompted to make to a valued adviser.

He was wont to importune me with the dear old doctrines of the church.

On my saying, what have I to do with the sacredness of traditions, if I live wholly from within?

My friend suggested: "But these impulses may be from below, not from above."

I replied: "They do not seem to me to be such; but if I am the child of the devil, I will live then from the devil."

No law can be sacred to me but that of my nature.

Good and bad are but names very readily transferable to that or this.

The only right is what is after my constitution.

The only wrong what is against it.

A man is to carry himself in the presence of all opposition, as if everything were nominal but he.

I am ashamed to think how easily we capitulate to badges and names.

To large societies and dead institutions.

Every decent and well-spoken individual affects and sways me more than is right.

I ought to go upright and vital, and speak the rude truth in all ways.""",
                    "word_count": 250,
                    "vocabulary": json.dumps(["nonconformist", "immortal", "integrity", "absolve", "suffrage", "importune", "constitution", "capitulate"])
                }
            ]
        },
        {
            "book": {
                "id": "lincoln-letters",
                "title": "Lincoln's Letters",
                "author": "Abraham Lincoln",
                "difficulty": "advanced",
                "genre": "Letters",
                "year": 1860,
                "description": "링컨의 편지 중 짧고 감동적인 글을 모았습니다. 진솔한 영어 표현을 배울 수 있습니다.",
                "cover_color": "#4A4A4A",
                "cover_image": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Abraham_Lincoln_O-77_matte_collodion_print.jpg/220px-Abraham_Lincoln_O-77_matte_collodion_print.jpg",
                "word_count": 500,
                "reading_time": "6분",
                "learning_focus": json.dumps(["Formal letters", "Emotional expression", "Historical English"]),
                "hero_id": "lincoln"
            },
            "chapters": [
                {
                    "title": "Letter to Mrs. Bixby",
                    "content": """Executive Mansion,
Washington, Nov. 21, 1864.

Dear Madam,

I have been shown in the files of the War Department a statement of the Adjutant General of Massachusetts that you are the mother of five sons who have died gloriously on the field of battle.

I feel how weak and fruitless must be any words of mine which should attempt to beguile you from the grief of a loss so overwhelming.

But I cannot refrain from tendering to you the consolation that may be found in the thanks of the Republic they died to save.

I pray that our Heavenly Father may assuage the anguish of your bereavement.

And leave you only the cherished memory of the loved and lost.

And the solemn pride that must be yours, to have laid so costly a sacrifice upon the altar of freedom.

Yours very sincerely and respectfully,
Abraham Lincoln.""",
                    "word_count": 150,
                    "vocabulary": json.dumps(["adjutant", "gloriously", "fruitless", "beguile", "refrain", "consolation", "assuage", "bereavement"])
                },
                {
                    "title": "On Humility and Wisdom",
                    "content": """I am not bound to win, but I am bound to be true.

I am not bound to succeed, but I am bound to live by the light that I have.

I must stand with anybody that stands right.

Stand with him while he is right, and part with him when he goes wrong.

Nearly all men can stand adversity, but if you want to test a man's character, give him power.

I do not think much of a man who is not wiser today than he was yesterday.

I am a slow walker, but I never walk back.

Whatever you are, be a good one.

Character is like a tree and reputation like a shadow.

The shadow is what we think of it; the tree is the real thing.

I have always found that mercy bears richer fruits than strict justice.

My concern is not whether God is on our side; my greatest concern is to be on God's side.

For God is always right.

Those who deny freedom to others deserve it not for themselves.

And under a just God, cannot long retain it.

I do the very best I know how, the very best I can.

And I mean to keep on doing so until the end.

If the end brings me out all right, what is said against me won't amount to anything.

If the end brings me out wrong, ten angels swearing I was right would make no difference.""",
                    "word_count": 240,
                    "vocabulary": json.dumps(["adversity", "character", "reputation", "mercy", "justice", "retain", "deserve"])
                }
            ]
        }
    ]

    for book_data in books_data:
        book = book_data["book"]
        cursor.execute("""
            INSERT OR REPLACE INTO books
            (id, title, author, difficulty, genre, year, description, cover_color, cover_image,
             word_count, reading_time, learning_focus, hero_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            book["id"], book["title"], book["author"], book["difficulty"], book["genre"],
            book["year"], book["description"], book["cover_color"], book["cover_image"],
            book["word_count"], book["reading_time"], book["learning_focus"], book["hero_id"]
        ))

        for i, chapter in enumerate(book_data["chapters"], 1):
            cursor.execute("""
                INSERT OR REPLACE INTO chapters
                (book_id, chapter_number, title, content, word_count, vocabulary)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                book["id"], i, chapter["title"], chapter["content"],
                chapter["word_count"], chapter["vocabulary"]
            ))

    print(f"Seeded {len(books_data)} books with chapters")

def main():
    """메인 함수 - DB 초기화 및 시딩"""
    init_db()

    with get_db() as conn:
        cursor = conn.cursor()

        try:
            # 기존 데이터 삭제
            clear_all_data(cursor)

            # 새 데이터 시딩
            seed_heroes(cursor)
            seed_books_and_chapters(cursor)
            conn.commit()

            # 결과 확인
            cursor.execute("SELECT COUNT(*) as cnt FROM heroes")
            result = cursor.fetchone()
            hero_count = result['cnt'] if isinstance(result, dict) else result[0]

            cursor.execute("SELECT COUNT(*) as cnt FROM books")
            result = cursor.fetchone()
            book_count = result['cnt'] if isinstance(result, dict) else result[0]

            cursor.execute("SELECT COUNT(*) as cnt FROM chapters")
            result = cursor.fetchone()
            chapter_count = result['cnt'] if isinstance(result, dict) else result[0]

            db_type = "Turso" if USE_TURSO else "Local SQLite"
            print(f"\n=== Database Seeding Complete ({db_type}) ===")
            print(f"Heroes: {hero_count}")
            print(f"Books: {book_count}")
            print(f"Chapters: {chapter_count}")

        except Exception as e:
            if hasattr(conn, 'rollback'):
                conn.rollback()
            print(f"Error seeding database: {e}")
            raise

if __name__ == "__main__":
    main()
