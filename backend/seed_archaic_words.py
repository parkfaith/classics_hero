import sqlite3
import os
from database import DATABASE_PATH, init_db

def seed_archaic_words(cursor):
    """고어(Archaic Words) 데이터 시딩 - 현대어 매칭"""
    archaic_words = [
        # Pronouns (대명사)
        {
            "word": "thou",
            "modern_equivalent": "you (singular)",
            "part_of_speech": "pronoun",
            "definition": "Second person singular pronoun (subject form)",
            "definition_ko": "2인칭 단수 대명사 (주격) - 너, 당신",
            "example_sentence": "Thou art my friend.",
            "usage_note": "Used in Biblical and Shakespearean English. More intimate than 'you'.",
            "usage_note_ko": "성경과 셰익스피어 영어에서 사용. 'you'보다 친밀한 표현.",
            "category": "pronoun"
        },
        {
            "word": "thee",
            "modern_equivalent": "you (singular, object)",
            "part_of_speech": "pronoun",
            "definition": "Second person singular pronoun (object form)",
            "definition_ko": "2인칭 단수 대명사 (목적격) - 너를, 당신을",
            "example_sentence": "I give thee my word.",
            "usage_note": "Object form of 'thou'. Used after verbs and prepositions.",
            "usage_note_ko": "'thou'의 목적격. 동사와 전치사 뒤에 사용.",
            "category": "pronoun"
        },
        {
            "word": "thy",
            "modern_equivalent": "your (singular)",
            "part_of_speech": "pronoun",
            "definition": "Second person singular possessive (before consonants)",
            "definition_ko": "2인칭 단수 소유격 (자음 앞) - 너의, 당신의",
            "example_sentence": "Thy kingdom come.",
            "usage_note": "Used before words beginning with consonants.",
            "usage_note_ko": "자음으로 시작하는 단어 앞에 사용.",
            "category": "pronoun"
        },
        {
            "word": "thine",
            "modern_equivalent": "your/yours (singular)",
            "part_of_speech": "pronoun",
            "definition": "Second person singular possessive (before vowels or standalone)",
            "definition_ko": "2인칭 단수 소유격 (모음 앞 또는 단독) - 너의 것",
            "example_sentence": "Thine eyes are beautiful. / The glory is thine.",
            "usage_note": "Used before vowels or as standalone possessive pronoun.",
            "usage_note_ko": "모음 앞이나 단독 소유대명사로 사용.",
            "category": "pronoun"
        },
        {
            "word": "ye",
            "modern_equivalent": "you (plural)",
            "part_of_speech": "pronoun",
            "definition": "Second person plural pronoun",
            "definition_ko": "2인칭 복수 대명사 - 너희들",
            "example_sentence": "Hear ye, hear ye!",
            "usage_note": "Plural form of 'thou'. Also used in formal proclamations.",
            "usage_note_ko": "'thou'의 복수형. 공식 선언문에서도 사용.",
            "category": "pronoun"
        },
        {
            "word": "wherefore",
            "modern_equivalent": "why",
            "part_of_speech": "adverb",
            "definition": "For what reason; why",
            "definition_ko": "왜, 무슨 이유로",
            "example_sentence": "Wherefore art thou Romeo?",
            "usage_note": "Often mistaken for 'where'. Actually means 'why'.",
            "usage_note_ko": "'where'로 오해받지만 실제로는 'why'의 의미.",
            "category": "adverb"
        },
        # Verbs (동사)
        {
            "word": "hath",
            "modern_equivalent": "has",
            "part_of_speech": "verb",
            "definition": "Third person singular of 'have'",
            "definition_ko": "'have'의 3인칭 단수형 - ~을 가지고 있다",
            "example_sentence": "He hath no fear.",
            "usage_note": "Archaic third person singular form of 'have'.",
            "usage_note_ko": "'have'의 고어적 3인칭 단수형.",
            "category": "verb"
        },
        {
            "word": "doth",
            "modern_equivalent": "does",
            "part_of_speech": "verb",
            "definition": "Third person singular of 'do'",
            "definition_ko": "'do'의 3인칭 단수형 - ~하다",
            "example_sentence": "The lady doth protest too much.",
            "usage_note": "Archaic third person singular form of 'do'.",
            "usage_note_ko": "'do'의 고어적 3인칭 단수형.",
            "category": "verb"
        },
        {
            "word": "art",
            "modern_equivalent": "are (with thou)",
            "part_of_speech": "verb",
            "definition": "Second person singular of 'be' (used with 'thou')",
            "definition_ko": "'be' 동사의 2인칭 단수형 - ~이다",
            "example_sentence": "Thou art beautiful.",
            "usage_note": "Used exclusively with 'thou'.",
            "usage_note_ko": "'thou'와 함께만 사용.",
            "category": "verb"
        },
        {
            "word": "wilt",
            "modern_equivalent": "will (with thou)",
            "part_of_speech": "verb",
            "definition": "Second person singular of 'will' (used with 'thou')",
            "definition_ko": "'will'의 2인칭 단수형 - ~할 것이다",
            "example_sentence": "Wilt thou go with me?",
            "usage_note": "Future tense marker used with 'thou'.",
            "usage_note_ko": "'thou'와 함께 사용하는 미래 시제.",
            "category": "verb"
        },
        {
            "word": "shalt",
            "modern_equivalent": "shall (with thou)",
            "part_of_speech": "verb",
            "definition": "Second person singular of 'shall' (used with 'thou')",
            "definition_ko": "'shall'의 2인칭 단수형 - ~해야 한다",
            "example_sentence": "Thou shalt not steal.",
            "usage_note": "Used for commands or prophecies with 'thou'.",
            "usage_note_ko": "'thou'와 함께 명령이나 예언에 사용.",
            "category": "verb"
        },
        {
            "word": "dost",
            "modern_equivalent": "do (with thou)",
            "part_of_speech": "verb",
            "definition": "Second person singular of 'do' (used with 'thou')",
            "definition_ko": "'do'의 2인칭 단수형",
            "example_sentence": "What dost thou want?",
            "usage_note": "Used with 'thou' for questions and emphasis.",
            "usage_note_ko": "'thou'와 함께 의문문과 강조에 사용.",
            "category": "verb"
        },
        {
            "word": "hast",
            "modern_equivalent": "have (with thou)",
            "part_of_speech": "verb",
            "definition": "Second person singular of 'have' (used with 'thou')",
            "definition_ko": "'have'의 2인칭 단수형",
            "example_sentence": "What hast thou done?",
            "usage_note": "Used with 'thou'.",
            "usage_note_ko": "'thou'와 함께 사용.",
            "category": "verb"
        },
        {
            "word": "wouldst",
            "modern_equivalent": "would (with thou)",
            "part_of_speech": "verb",
            "definition": "Second person singular of 'would' (used with 'thou')",
            "definition_ko": "'would'의 2인칭 단수형",
            "example_sentence": "Wouldst thou help me?",
            "usage_note": "Conditional form used with 'thou'.",
            "usage_note_ko": "'thou'와 함께 사용하는 조건형.",
            "category": "verb"
        },
        {
            "word": "methinks",
            "modern_equivalent": "I think / it seems to me",
            "part_of_speech": "verb",
            "definition": "It seems to me",
            "definition_ko": "내 생각에는, ~인 것 같다",
            "example_sentence": "Methinks the lady doth protest too much.",
            "usage_note": "Impersonal verb. 'Me' is dative, not accusative.",
            "usage_note_ko": "비인칭 동사. 'Me'는 여격(간접 목적격).",
            "category": "verb"
        },
        {
            "word": "prithee",
            "modern_equivalent": "please / I pray thee",
            "part_of_speech": "verb",
            "definition": "Please; I pray thee",
            "definition_ko": "제발, 부디",
            "example_sentence": "Prithee, tell me the truth.",
            "usage_note": "Contraction of 'I pray thee'. Used for polite requests.",
            "usage_note_ko": "'I pray thee'의 축약형. 공손한 요청에 사용.",
            "category": "contraction"
        },
        # Adverbs & Others
        {
            "word": "hither",
            "modern_equivalent": "here / to this place",
            "part_of_speech": "adverb",
            "definition": "To or toward this place",
            "definition_ko": "이리로, 이쪽으로",
            "example_sentence": "Come hither, my child.",
            "usage_note": "Indicates motion toward the speaker.",
            "usage_note_ko": "화자 쪽으로의 이동을 나타냄.",
            "category": "adverb"
        },
        {
            "word": "thither",
            "modern_equivalent": "there / to that place",
            "part_of_speech": "adverb",
            "definition": "To or toward that place",
            "definition_ko": "저리로, 그쪽으로",
            "example_sentence": "Go thither and return.",
            "usage_note": "Indicates motion away from speaker toward a place.",
            "usage_note_ko": "화자로부터 멀어지는 이동을 나타냄.",
            "category": "adverb"
        },
        {
            "word": "whither",
            "modern_equivalent": "where / to what place",
            "part_of_speech": "adverb",
            "definition": "To what place; where",
            "definition_ko": "어디로",
            "example_sentence": "Whither goest thou?",
            "usage_note": "Asks about destination, not location.",
            "usage_note_ko": "위치가 아닌 목적지를 묻는 표현.",
            "category": "adverb"
        },
        {
            "word": "hence",
            "modern_equivalent": "from here / therefore",
            "part_of_speech": "adverb",
            "definition": "From this place; from this time; therefore",
            "definition_ko": "여기서, 이 시점부터, 따라서",
            "example_sentence": "Get thee hence! / Two weeks hence.",
            "usage_note": "Can indicate place, time, or logical consequence.",
            "usage_note_ko": "장소, 시간, 또는 논리적 결과를 나타낼 수 있음.",
            "category": "adverb"
        },
        {
            "word": "thence",
            "modern_equivalent": "from there / from that",
            "part_of_speech": "adverb",
            "definition": "From that place or source",
            "definition_ko": "거기서, 그것으로부터",
            "example_sentence": "He came from London and thence to Paris.",
            "usage_note": "Indicates origin or source.",
            "usage_note_ko": "기원이나 출처를 나타냄.",
            "category": "adverb"
        },
        {
            "word": "ere",
            "modern_equivalent": "before",
            "part_of_speech": "adverb",
            "definition": "Before (in time)",
            "definition_ko": "~전에",
            "example_sentence": "Ere the sun sets.",
            "usage_note": "Poetic form of 'before'.",
            "usage_note_ko": "'before'의 시적 표현.",
            "category": "adverb"
        },
        {
            "word": "nay",
            "modern_equivalent": "no",
            "part_of_speech": "adverb",
            "definition": "No; or rather; moreover",
            "definition_ko": "아니오, 아니 오히려",
            "example_sentence": "Nay, I shall not go.",
            "usage_note": "Stronger than 'no'. Can also mean 'or rather'.",
            "usage_note_ko": "'no'보다 강한 표현. '아니 오히려'의 의미도 있음.",
            "category": "adverb"
        },
        {
            "word": "aye",
            "modern_equivalent": "yes",
            "part_of_speech": "adverb",
            "definition": "Yes; indeed",
            "definition_ko": "예, 그렇습니다",
            "example_sentence": "Aye, captain!",
            "usage_note": "Still used in parliamentary voting and nautical contexts.",
            "usage_note_ko": "의회 투표와 해양 문맥에서 여전히 사용됨.",
            "category": "adverb"
        },
        {
            "word": "forsooth",
            "modern_equivalent": "indeed / in truth",
            "part_of_speech": "adverb",
            "definition": "In truth; indeed",
            "definition_ko": "정말로, 진실로",
            "example_sentence": "Forsooth, I know not what to say.",
            "usage_note": "Often used ironically in modern contexts.",
            "usage_note_ko": "현대에는 종종 아이러니하게 사용됨.",
            "category": "adverb"
        },
        {
            "word": "perchance",
            "modern_equivalent": "perhaps / by chance",
            "part_of_speech": "adverb",
            "definition": "Perhaps; possibly; by chance",
            "definition_ko": "아마도, 혹시",
            "example_sentence": "To sleep, perchance to dream.",
            "usage_note": "Literary/poetic alternative to 'perhaps'.",
            "usage_note_ko": "'perhaps'의 문학적/시적 대안.",
            "category": "adverb"
        },
        {
            "word": "betwixt",
            "modern_equivalent": "between",
            "part_of_speech": "adverb",
            "definition": "Between",
            "definition_ko": "~사이에",
            "example_sentence": "Betwixt heaven and earth.",
            "usage_note": "Archaic form of 'between'.",
            "usage_note_ko": "'between'의 고어 형태.",
            "category": "adverb"
        },
        {
            "word": "anon",
            "modern_equivalent": "soon / shortly",
            "part_of_speech": "adverb",
            "definition": "Soon; shortly; at another time",
            "definition_ko": "곧, 이내",
            "example_sentence": "I shall return anon.",
            "usage_note": "Can also mean 'at another time' or 'later'.",
            "usage_note_ko": "'나중에'라는 의미도 있음.",
            "category": "adverb"
        },
        # Nouns & Adjectives
        {
            "word": "morrow",
            "modern_equivalent": "morning / tomorrow",
            "part_of_speech": "noun",
            "definition": "The next day; morning",
            "definition_ko": "내일, 아침",
            "example_sentence": "Good morrow to you!",
            "usage_note": "'Good morrow' = 'Good morning'.",
            "usage_note_ko": "'Good morrow' = '좋은 아침'.",
            "category": "noun"
        },
        {
            "word": "fortnight",
            "modern_equivalent": "two weeks",
            "part_of_speech": "noun",
            "definition": "A period of fourteen days; two weeks",
            "definition_ko": "2주",
            "example_sentence": "I shall return in a fortnight.",
            "usage_note": "Still used in British English.",
            "usage_note_ko": "영국 영어에서는 여전히 사용됨.",
            "category": "noun"
        },
        {
            "word": "sennight",
            "modern_equivalent": "one week",
            "part_of_speech": "noun",
            "definition": "A period of seven days; one week",
            "definition_ko": "1주",
            "example_sentence": "A sennight has passed.",
            "usage_note": "Contraction of 'seven nights'. Now obsolete.",
            "usage_note_ko": "'seven nights'의 축약형. 현재는 사용되지 않음.",
            "category": "noun"
        },
        {
            "word": "whereupon",
            "modern_equivalent": "after which / and then",
            "part_of_speech": "adverb",
            "definition": "Immediately after which",
            "definition_ko": "그 후 즉시, 그러자",
            "example_sentence": "He fell, whereupon everyone laughed.",
            "usage_note": "Still used in formal writing.",
            "usage_note_ko": "격식체 글에서 여전히 사용됨.",
            "category": "adverb"
        },
        {
            "word": "albeit",
            "modern_equivalent": "although / even though",
            "part_of_speech": "other",
            "definition": "Although; even though",
            "definition_ko": "비록 ~일지라도",
            "example_sentence": "He tried, albeit unsuccessfully.",
            "usage_note": "Still used in formal English.",
            "usage_note_ko": "격식체 영어에서 여전히 사용됨.",
            "category": "other"
        }
    ]

    for word_data in archaic_words:
        cursor.execute("""
            INSERT OR REPLACE INTO archaic_words
            (word, modern_equivalent, part_of_speech, definition, definition_ko,
             example_sentence, usage_note, usage_note_ko, category)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            word_data["word"], word_data["modern_equivalent"], word_data["part_of_speech"],
            word_data["definition"], word_data["definition_ko"], word_data["example_sentence"],
            word_data["usage_note"], word_data["usage_note_ko"], word_data["category"]
        ))

    print(f"Seeded {len(archaic_words)} archaic words")


def seed_semantic_shifts(cursor):
    """의미 변화 단어 (Semantic Shifts) 데이터 시딩"""
    semantic_shifts = [
        {
            "word": "gay",
            "historical_meaning": "happy, carefree, bright",
            "historical_meaning_ko": "즐거운, 쾌활한, 밝은",
            "modern_meaning": "homosexual (primarily)",
            "modern_meaning_ko": "동성애의 (주로)",
            "example_historical": "The gay flowers bloomed in spring.",
            "example_modern": "Pride Month celebrates gay rights.",
            "tip": "In classic literature, 'gay' almost always means 'happy' or 'bright'. The meaning shift occurred in the mid-20th century.",
            "tip_ko": "고전 문학에서 'gay'는 거의 항상 '즐거운' 또는 '밝은'을 의미합니다. 의미 변화는 20세기 중반에 일어났습니다."
        },
        {
            "word": "awful",
            "historical_meaning": "inspiring awe, magnificent",
            "historical_meaning_ko": "경외심을 일으키는, 장엄한",
            "modern_meaning": "very bad, terrible",
            "modern_meaning_ko": "매우 나쁜, 끔찍한",
            "example_historical": "The awful majesty of God.",
            "example_modern": "The weather was awful.",
            "tip": "Originally meant 'full of awe' (positive). Now means 'terrible' (negative). The word underwent complete semantic reversal.",
            "tip_ko": "원래 '경외심으로 가득 찬'(긍정적) 의미였습니다. 현재는 '끔찍한'(부정적) 의미입니다. 완전한 의미 역전이 일어났습니다."
        },
        {
            "word": "nice",
            "historical_meaning": "foolish, ignorant, precise",
            "historical_meaning_ko": "어리석은, 무지한, 정밀한",
            "modern_meaning": "pleasant, kind, agreeable",
            "modern_meaning_ko": "좋은, 친절한, 상냥한",
            "example_historical": "A nice distinction between the two.",
            "example_modern": "She is a nice person.",
            "tip": "From Latin 'nescius' (ignorant). Evolved through 'precise/subtle' to 'pleasant'. One of English's most dramatic meaning changes.",
            "tip_ko": "라틴어 'nescius'(무지한)에서 유래. '정밀한/미묘한'을 거쳐 '좋은'으로 발전. 영어에서 가장 극적인 의미 변화 중 하나입니다."
        },
        {
            "word": "silly",
            "historical_meaning": "blessed, innocent, pitiable",
            "historical_meaning_ko": "축복받은, 순진한, 불쌍한",
            "modern_meaning": "foolish, lacking sense",
            "modern_meaning_ko": "어리석은, 바보 같은",
            "example_historical": "The silly sheep were led astray.",
            "example_modern": "Don't be silly!",
            "tip": "Originally from 'selig' (blessed/happy). Changed to 'innocent' then 'foolish'. 'Silly sheep' in old texts means 'innocent sheep'.",
            "tip_ko": "'selig'(축복받은/행복한)에서 유래. '순진한'에서 '어리석은'으로 변화. 옛 문헌의 'silly sheep'은 '순진한 양'을 의미합니다."
        },
        {
            "word": "girl",
            "historical_meaning": "young person of either sex",
            "historical_meaning_ko": "어린 사람 (성별 무관)",
            "modern_meaning": "female child or young woman",
            "modern_meaning_ko": "여자아이 또는 젊은 여성",
            "example_historical": "The girls and knaves of the household.",
            "example_modern": "The girl went to school.",
            "tip": "Until the 15th century, 'girl' could mean any young person. 'Knave girl' meant a boy servant.",
            "tip_ko": "15세기까지 'girl'은 어떤 어린 사람도 의미할 수 있었습니다. 'Knave girl'은 남자 하인을 의미했습니다."
        },
        {
            "word": "meat",
            "historical_meaning": "food in general",
            "historical_meaning_ko": "음식 전반",
            "modern_meaning": "animal flesh as food",
            "modern_meaning_ko": "식용 동물의 살",
            "example_historical": "Meat and drink for the journey.",
            "example_modern": "I don't eat meat.",
            "tip": "In the King James Bible, 'meat' means 'food'. The narrowed meaning developed later.",
            "tip_ko": "킹 제임스 성경에서 'meat'는 '음식'을 의미합니다. 좁아진 의미는 나중에 발전했습니다."
        },
        {
            "word": "deer",
            "historical_meaning": "any animal, beast",
            "historical_meaning_ko": "모든 동물, 짐승",
            "modern_meaning": "specific hoofed animal",
            "modern_meaning_ko": "사슴과 동물",
            "example_historical": "All manner of wild deer.",
            "example_modern": "A deer crossed the road.",
            "tip": "Related to German 'Tier' (animal). The meaning narrowed over time to refer only to the specific animal family.",
            "tip_ko": "독일어 'Tier'(동물)와 관련. 시간이 지나면서 특정 동물과만 관련된 의미로 좁혀졌습니다."
        },
        {
            "word": "starve",
            "historical_meaning": "to die (from any cause)",
            "historical_meaning_ko": "죽다 (어떤 원인으로든)",
            "modern_meaning": "to die from hunger",
            "modern_meaning_ko": "굶어 죽다",
            "example_historical": "He starved from the cold.",
            "example_modern": "People are starving in the famine.",
            "tip": "Old English 'steorfan' meant 'to die'. The meaning narrowed specifically to death by hunger.",
            "tip_ko": "고대 영어 'steorfan'은 '죽다'를 의미했습니다. 의미가 특히 굶주림으로 인한 죽음으로 좁혀졌습니다."
        },
        {
            "word": "artificial",
            "historical_meaning": "skillfully made, artistic",
            "historical_meaning_ko": "솜씨 있게 만든, 예술적인",
            "modern_meaning": "fake, not natural",
            "modern_meaning_ko": "인공의, 자연스럽지 않은",
            "example_historical": "The artificial beauty of the garden.",
            "example_modern": "Artificial sweeteners are unhealthy.",
            "tip": "From Latin 'artificium' (skill). Originally praised skilled craftsmanship. Now often has negative connotations.",
            "tip_ko": "라틴어 'artificium'(기술)에서 유래. 원래 숙련된 장인 정신을 칭찬했습니다. 현재는 종종 부정적 의미를 가집니다."
        },
        {
            "word": "cunning",
            "historical_meaning": "knowledgeable, skillful",
            "historical_meaning_ko": "지식이 풍부한, 숙련된",
            "modern_meaning": "sly, crafty, deceitful",
            "modern_meaning_ko": "교활한, 간사한",
            "example_historical": "A cunning craftsman.",
            "example_modern": "A cunning plan to deceive.",
            "tip": "From 'can' (to know). Originally meant 'learned/skilled'. Now implies deceptive cleverness.",
            "tip_ko": "'can'(알다)에서 유래. 원래 '학식 있는/숙련된'을 의미했습니다. 현재는 기만적인 영리함을 암시합니다."
        },
        {
            "word": "brave",
            "historical_meaning": "showy, finely dressed",
            "historical_meaning_ko": "화려한, 멋지게 차려입은",
            "modern_meaning": "courageous, fearless",
            "modern_meaning_ko": "용감한, 두려움 없는",
            "example_historical": "In brave attire.",
            "example_modern": "A brave soldier.",
            "tip": "Originally from Italian 'bravo' (showy). The meaning shifted from external appearance to internal quality.",
            "tip_ko": "이탈리아어 'bravo'(화려한)에서 유래. 의미가 외적 모습에서 내적 자질로 변화했습니다."
        },
        {
            "word": "fond",
            "historical_meaning": "foolish, infatuated",
            "historical_meaning_ko": "어리석은, 맹목적인",
            "modern_meaning": "loving, affectionate",
            "modern_meaning_ko": "좋아하는, 다정한",
            "example_historical": "Fond of idle dreams.",
            "example_modern": "I'm very fond of chocolate.",
            "tip": "Originally meant 'foolish' (from 'fonned' - to be foolish). 'Fond hopes' still carries the old meaning of 'foolishly optimistic'.",
            "tip_ko": "원래 'fonned'(어리석다)에서 '어리석은'을 의미했습니다. 'Fond hopes'는 여전히 '어리석게 낙관적인'이라는 옛 의미를 담고 있습니다."
        },
        {
            "word": "manufacture",
            "historical_meaning": "to make by hand",
            "historical_meaning_ko": "손으로 만들다",
            "modern_meaning": "to make by machine/factory",
            "modern_meaning_ko": "기계/공장으로 만들다",
            "example_historical": "Manufactured with great skill.",
            "example_modern": "Cars are manufactured in Detroit.",
            "tip": "From Latin 'manu factum' (made by hand). The Industrial Revolution reversed the meaning completely.",
            "tip_ko": "라틴어 'manu factum'(손으로 만든)에서 유래. 산업혁명이 의미를 완전히 뒤집었습니다."
        },
        {
            "word": "prevent",
            "historical_meaning": "to go before, anticipate",
            "historical_meaning_ko": "앞서 가다, 예상하다",
            "modern_meaning": "to stop from happening",
            "modern_meaning_ko": "막다, 방지하다",
            "example_historical": "Prevent us, O Lord, in all our doings.",
            "example_modern": "We must prevent crime.",
            "tip": "From Latin 'praevenire' (to come before). In old prayers, 'prevent' means 'go before us'. Modern meaning focuses on blocking.",
            "tip_ko": "라틴어 'praevenire'(앞서 오다)에서 유래. 옛 기도문에서 'prevent'는 '우리 앞서 가소서'를 의미합니다."
        },
        {
            "word": "let",
            "historical_meaning": "to hinder, prevent",
            "historical_meaning_ko": "방해하다, 막다",
            "modern_meaning": "to allow, permit",
            "modern_meaning_ko": "허락하다, ~하게 하다",
            "example_historical": "Without let or hindrance.",
            "example_modern": "Let me help you.",
            "tip": "Two different Old English words merged. 'Without let' (in passports) preserves the old 'hinder' meaning.",
            "tip_ko": "두 개의 다른 고대 영어 단어가 합쳐졌습니다. 여권의 'Without let'은 옛 '방해' 의미를 보존합니다."
        }
    ]

    for shift_data in semantic_shifts:
        cursor.execute("""
            INSERT OR REPLACE INTO semantic_shifts
            (word, historical_meaning, historical_meaning_ko, modern_meaning, modern_meaning_ko,
             example_historical, example_modern, tip, tip_ko)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            shift_data["word"], shift_data["historical_meaning"], shift_data["historical_meaning_ko"],
            shift_data["modern_meaning"], shift_data["modern_meaning_ko"],
            shift_data["example_historical"], shift_data["example_modern"],
            shift_data["tip"], shift_data["tip_ko"]
        ))

    print(f"Seeded {len(semantic_shifts)} semantic shift words")


def main():
    init_db()

    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    try:
        seed_archaic_words(cursor)
        seed_semantic_shifts(cursor)
        conn.commit()
        print("Archaic words and semantic shifts seeding completed!")
    except Exception as e:
        conn.rollback()
        print(f"Error seeding data: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
