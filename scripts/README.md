# Project Gutenberg 데이터 수집 파이프라인

영어 학습용 고전 문학 도서 자동 수집 시스템

## 주요 기능

### 1. 영어 학습에 최적화된 챕터 분할
- **최대 챕터 길이**: 8,000자로 제한
- **최대 챕터 수**: 도서당 20개로 제한
- **자동 분할**: 긴 챕터를 문단 단위로 자동 분할
- **평균 챕터 길이**: 약 5,000-7,500자 (읽기 적절한 길이)

### 2. 텍스트 클리닝
- Project Gutenberg 헤더/푸터 자동 제거
- 서문, 목차 등 학습에 불필요한 부분 제거
- 과도한 공백 및 줄바꿈 정리

### 3. 메타데이터 자동 추출
- 도서 제목, 저자, 출판 연도
- 난이도, 장르 자동 분류
- 챕터별 제목 및 내용

## 파일 구조

```
scripts/
├── requirements.txt           # Python 의존성
├── config.json                # 도서 ID 및 설정
├── gutenberg_api.py           # Gutendex API 래퍼
├── text_cleaner.py            # 텍스트 클리닝
├── chapter_splitter.py        # 챕터 분리 (개선됨!)
├── json_generator.py          # JSON 생성
├── gutenberg_collector.py     # 메인 실행 스크립트
├── update_gutenberg_books.py  # Gutenberg 도서 업데이트
└── output/
    ├── collected_books.json   # 수집된 도서
    └── logs/
        ├── collection.log
        └── quality_report.json
```

## 사용 방법

### 1. 의존성 설치
```bash
cd scripts
pip install -r requirements.txt
```

### 2. 도서 수집
```bash
python gutenberg_collector.py
```

### 3. books.json 업데이트
```bash
# 샘플 도서는 유지하고 Gutenberg 도서만 업데이트
python update_gutenberg_books.py
```

## 설정 (config.json)

### 도서 추가
```json
{
  "heroes": [
    {
      "id": "hero_id",
      "name": "Hero Name",
      "book_ids": [12345, 67890],
      "books": [
        {
          "id": 12345,
          "title": "Book Title",
          "genre": "Biography",
          "difficulty": "easy"
        }
      ]
    }
  ]
}
```

### 챕터 분할 파라미터 조정

`gutenberg_collector.py`에서 수정:
```python
chapters = split_chapters_safe(
    clean_text,
    merge_short=False,
    max_length=8000,    # 최대 챕터 길이 (기본: 8000자)
    split_long=True     # 긴 챕터 자동 분할 (기본: True)
)

# 챕터 수 제한
if len(chapters) > 20:  # 최대 챕터 수 (기본: 20개)
    chapters = chapters[:20]
```

## 개선 사항 (2025-01-14)

### 문제점
- ❌ 챕터가 너무 길었음 (평균 5만~16만 문자)
- ❌ 전체 도서가 너무 길었음 (최대 290만 문자)
- ❌ 영어 학습에 부적합한 길이

### 해결책
- ✅ `split_long_chapters()` 함수 추가
  - 8,000자 이상의 챕터를 문단 단위로 자동 분할
  - Part 1, Part 2 형태로 챕터 제목 추가
- ✅ 도서당 최대 20개 챕터로 제한
  - 긴 도서는 앞부분만 선택
  - 마지막 챕터에 "(계속...)" 표시
- ✅ 평균 챕터 길이: 7,000자 내외

### 결과
| 도서 | 챕터 수 | 평균 길이 |
|------|---------|-----------|
| Benjamin Franklin Autobiography | 20 | 7,202자 |
| Poor Richard's Almanack | 20 | 7,258자 |
| Lincoln Papers and Writings | 20 | 6,913자 |
| Lincoln Speeches & Letters | 20 | 7,179자 |
| Radio-Active Substances | 20 | 7,330자 |
| Discovery of Radium | 2 | 5,004자 |

## 추천 도서 ID

### Benjamin Franklin
- **148**: The Autobiography of Benjamin Franklin ⭐
- **20203**: Poor Richard's Almanack

### Abraham Lincoln
- **3253**: The Papers and Writings of Abraham Lincoln
- **14721**: Speeches & Letters of Abraham Lincoln ⭐

### Marie Curie
- **60564**: Radio-Active Substances (과학, Hard)
- **61622**: The Discovery of Radium ⭐

### Winston Churchill
- **18419**: The Story of the Malakand Field Force

### Mahatma Gandhi
- **783**: My Experiments with Truth (관련 도서)

## 주의사항

1. **인코딩**: 모든 파일은 UTF-8로 처리됨
2. **API 제한**: Gutendex API는 무료이지만 과도한 요청 주의
3. **챕터 분할**: 일부 도서는 원본과 다르게 분할될 수 있음
4. **학습 목적**: 전체 도서가 아닌 발췌본으로 제공됨

## 트러블슈팅

### 챕터가 너무 많이 생성됨
→ `max_length` 값을 증가 (예: 10000)

### 챕터가 너무 적게 생성됨
→ `max_length` 값을 감소 (예: 5000)

### 특정 도서만 재수집
`config.json`에서 해당 영웅의 `book_ids`만 남기고 실행

## 라이선스

- Project Gutenberg 도서: Public Domain
- 파이프라인 코드: MIT License
