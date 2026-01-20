#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
JSON 생성 모듈
books.json 형식으로 데이터 생성
"""

import re
from typing import Dict, List


def extract_year(metadata: Dict) -> int:
    """
    메타데이터에서 출판 연도 추출

    Args:
        metadata: Gutendex API 메타데이터

    Returns:
        출판 연도 (추정치 포함)
    """
    # subjects에서 연도 추출 시도
    subjects = metadata.get('subjects', [])
    for subject in subjects:
        match = re.search(r'\b(1[6-9]\d{2}|20[0-2]\d)\b', subject)
        if match:
            return int(match.group(1))

    # bookshelves에서 연도 추출 시도
    bookshelves = metadata.get('bookshelves', [])
    for shelf in bookshelves:
        match = re.search(r'\b(1[6-9]\d{2}|20[0-2]\d)\b', shelf)
        if match:
            return int(match.group(1))

    # 저자 사망 연도 기반 추정
    authors = metadata.get('authors', [])
    if authors and len(authors) > 0:
        death_year = authors[0].get('death_year')
        if death_year:
            # 사망 10년 전으로 추정
            return max(death_year - 10, 1500)

    # 기본값
    return 1900


def generate_description(metadata: Dict, first_chapter_content: str) -> str:
    """
    도서 설명 생성

    Args:
        metadata: Gutendex API 메타데이터
        first_chapter_content: 첫 챕터 내용

    Returns:
        도서 설명 문자열
    """
    # subjects 활용
    subjects = metadata.get('subjects', [])
    if subjects:
        # 짧은 키워드만 선택 (5단어 이하)
        keywords = [s for s in subjects if len(s.split()) <= 5 and 'Gutenberg' not in s]
        if keywords:
            # 처음 2-3개 키워드 조합
            description = ', '.join(keywords[:3])
            if len(description) > 200:
                description = description[:200] + '...'
            return description

    # Fallback: 첫 문장 추출
    if first_chapter_content:
        sentences = re.split(r'[.!?]+', first_chapter_content)
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) >= 20:  # 최소 길이
                # 너무 길면 자르기
                if len(sentence) > 200:
                    return sentence[:197] + '...'
                return sentence + '.'

    # 최종 Fallback
    return "A classic work from Project Gutenberg."


def assign_cover_color(genre: str, index: int, config: Dict) -> str:
    """
    장르와 인덱스 기반으로 표지 색상 할당

    Args:
        genre: 도서 장르
        index: 도서 인덱스 (같은 장르 내에서)
        config: 설정 딕셔너리 (cover_colors 포함)

    Returns:
        색상 코드 (예: "#87CEEB")
    """
    cover_colors = config.get('cover_colors', {})
    colors = cover_colors.get(genre, ['#87CEEB', '#FFB6C1', '#98FB98'])

    # 인덱스 기반 순환 할당
    return colors[index % len(colors)]


def generate_book_json(book_config: Dict, metadata: Dict, clean_text: str,
                       chapters: List[Dict], hero_id: str, index: int,
                       config: Dict) -> Dict:
    """
    books.json 형식의 도서 데이터 생성

    Args:
        book_config: config.json의 도서 설정
        metadata: Gutendex API 메타데이터
        clean_text: 클리닝된 전체 텍스트
        chapters: 챕터 리스트
        hero_id: 영웅 ID
        index: 영웅 내 도서 인덱스
        config: 전체 설정

    Returns:
        books.json 형식의 도서 딕셔너리
    """
    # 저자 이름 추출
    authors = metadata.get('authors', [])
    author_name = authors[0]['name'] if authors else 'Unknown Author'

    # 첫 챕터 내용 (description 생성용)
    first_content = chapters[0]['content'] if chapters else ''

    # 도서 데이터 구성
    book_data = {
        "id": f"{hero_id}-{book_config['id']}",
        "title": book_config['title'],
        "author": author_name,
        "difficulty": book_config['difficulty'],
        "genre": book_config['genre'],
        "year": extract_year(metadata),
        "description": generate_description(metadata, first_content),
        "coverColor": assign_cover_color(book_config['genre'], index, config),
        "chapters": chapters
    }

    return book_data


def validate_book_json(book: Dict) -> bool:
    """
    생성된 도서 JSON 유효성 검증

    Args:
        book: 검증할 도서 딕셔너리

    Returns:
        유효하면 True, 아니면 False
    """
    required_fields = ['id', 'title', 'author', 'difficulty', 'genre',
                      'year', 'description', 'coverColor', 'chapters']

    # 필수 필드 확인
    for field in required_fields:
        if field not in book:
            print(f"    ❌ 필수 필드 누락: {field}")
            return False

    # 챕터 검증
    if not book['chapters'] or len(book['chapters']) == 0:
        print(f"    ❌ 챕터가 없습니다")
        return False

    # 각 챕터 검증
    for chapter in book['chapters']:
        if 'id' not in chapter or 'title' not in chapter or 'content' not in chapter:
            print(f"    ❌ 챕터 필수 필드 누락")
            return False

        if len(chapter['content']) < 100:
            print(f"    ❌ 챕터 내용이 너무 짧습니다: {chapter['title']}")
            return False

    return True


def generate_quality_report(books: List[Dict]) -> Dict:
    """
    수집된 도서들의 품질 보고서 생성

    Args:
        books: 도서 리스트

    Returns:
        품질 보고서 딕셔너리
    """
    if not books:
        return {
            'total_books': 0,
            'error': '수집된 도서가 없습니다'
        }

    total_chapters = sum(len(book['chapters']) for book in books)
    avg_chapters = total_chapters / len(books) if books else 0

    # 난이도 분포
    difficulty_dist = {
        'easy': sum(1 for b in books if b['difficulty'] == 'easy'),
        'medium': sum(1 for b in books if b['difficulty'] == 'medium'),
        'hard': sum(1 for b in books if b['difficulty'] == 'hard'),
    }

    # 장르 분포
    genre_dist = {}
    for book in books:
        genre = book['genre']
        genre_dist[genre] = genre_dist.get(genre, 0) + 1

    # 영웅별 분포
    hero_dist = {}
    for book in books:
        hero_id = book['id'].split('-')[0]
        hero_dist[hero_id] = hero_dist.get(hero_id, 0) + 1

    report = {
        'total_books': len(books),
        'total_chapters': total_chapters,
        'avg_chapters_per_book': round(avg_chapters, 1),
        'difficulty_distribution': difficulty_dist,
        'genre_distribution': genre_dist,
        'hero_distribution': hero_dist,
        'books': [
            {
                'id': book['id'],
                'title': book['title'],
                'chapters': len(book['chapters']),
                'difficulty': book['difficulty']
            }
            for book in books
        ]
    }

    return report


if __name__ == '__main__':
    # 테스트 코드
    print("=== JSON 생성 테스트 ===\n")

    # 샘플 메타데이터
    sample_metadata = {
        'id': 148,
        'title': 'The Autobiography of Benjamin Franklin',
        'authors': [
            {
                'name': 'Benjamin Franklin',
                'birth_year': 1706,
                'death_year': 1790
            }
        ],
        'subjects': [
            'Franklin, Benjamin, 1706-1790',
            'Statesmen -- United States -- Biography',
            'Autobiographies'
        ],
        'bookshelves': ['Biography'],
        'languages': ['en']
    }

    # 샘플 챕터
    sample_chapters = [
        {
            'id': 1,
            'title': 'CHAPTER I',
            'content': 'This is the first chapter content. ' * 20
        },
        {
            'id': 2,
            'title': 'CHAPTER II',
            'content': 'This is the second chapter content. ' * 20
        }
    ]

    # 샘플 설정
    sample_config = {
        'cover_colors': {
            'Biography': ['#87CEEB', '#FFB6C1', '#98FB98']
        }
    }

    # 샘플 도서 설정
    sample_book_config = {
        'id': 148,
        'title': 'The Autobiography of Benjamin Franklin',
        'genre': 'Biography',
        'difficulty': 'easy'
    }

    # JSON 생성
    book_json = generate_book_json(
        sample_book_config,
        sample_metadata,
        '',
        sample_chapters,
        'benjamin_franklin',
        0,
        sample_config
    )

    print("생성된 도서 JSON:")
    print(f"  ID: {book_json['id']}")
    print(f"  제목: {book_json['title']}")
    print(f"  저자: {book_json['author']}")
    print(f"  난이도: {book_json['difficulty']}")
    print(f"  장르: {book_json['genre']}")
    print(f"  연도: {book_json['year']}")
    print(f"  설명: {book_json['description'][:80]}...")
    print(f"  표지 색상: {book_json['coverColor']}")
    print(f"  챕터 수: {len(book_json['chapters'])}")

    # 유효성 검증
    print("\n유효성 검증:")
    if validate_book_json(book_json):
        print("  ✅ 검증 성공")
    else:
        print("  ❌ 검증 실패")

    # 품질 보고서
    print("\n품질 보고서:")
    report = generate_quality_report([book_json])
    print(f"  총 도서: {report['total_books']}권")
    print(f"  총 챕터: {report['total_chapters']}개")
    print(f"  평균 챕터/도서: {report['avg_chapters_per_book']}개")
