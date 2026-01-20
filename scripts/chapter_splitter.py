#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
챕터 분리 모듈
텍스트를 챕터별로 분리
"""

import re
from typing import List, Dict


def split_chapters(text: str) -> List[Dict]:
    """
    텍스트를 챕터별로 분리

    다양한 패턴 시도:
    1. CHAPTER I, CHAPTER 1, CHAPTER ONE
    2. 로마 숫자 (I., II., III.)
    3. SPEECH/LETTER 패턴
    4. Fallback: 단일 챕터

    Args:
        text: 분리할 텍스트

    Returns:
        챕터 리스트
        [
            {
                "id": 1,
                "title": "CHAPTER I",
                "content": "챕터 내용..."
            }
        ]
    """
    # 패턴 우선순위 순서대로 시도
    patterns = [
        # CHAPTER I, CHAPTER 1, CHAPTER ONE
        r'(?:^|\n)(CHAPTER\s+(?:[IVXLCDM]+|\d+|[A-Z][a-z]+)\.?\s*[:\-—]?\s*[^\n]*)',
        # 로마 숫자 (I., II., III.)
        r'(?:^|\n)([IVXLCDM]+\.\s*[^\n]+)',
        # SPEECH I, SPEECH 1
        r'(?:^|\n)(SPEECH\s+(?:[IVXLCDM]+|\d+)[^\n]*)',
        # LETTER I, LETTER 1
        r'(?:^|\n)(LETTER\s+(?:[IVXLCDM]+|\d+)[^\n]*)',
    ]

    for pattern in patterns:
        try:
            matches = list(re.finditer(pattern, text, re.MULTILINE | re.IGNORECASE))

            # 최소 2개 이상의 챕터가 있어야 유효
            if len(matches) >= 2:
                chapters = []

                for i, match in enumerate(matches):
                    title = match.group(1).strip()
                    start = match.end()
                    end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
                    content = text[start:end].strip()

                    # 최소 길이 체크 (너무 짧은 챕터 제외)
                    if len(content) >= 100:
                        chapters.append({
                            "id": len(chapters) + 1,
                            "title": title,
                            "content": content
                        })

                # 유효한 챕터가 2개 이상이면 반환
                if len(chapters) >= 2:
                    return chapters

        except Exception as e:
            # 패턴 매칭 실패 시 다음 패턴 시도
            continue

    # 모든 패턴 실패 시 전체 텍스트를 단일 챕터로
    return [{
        "id": 1,
        "title": "Full Text",
        "content": text.strip()
    }]


def split_long_chapters(chapters: List[Dict], max_length: int = 8000) -> List[Dict]:
    """
    너무 긴 챕터를 문단 단위로 분할 (영어 학습용)

    Args:
        chapters: 챕터 리스트
        max_length: 최대 챕터 길이 (문자 수)

    Returns:
        분할된 챕터 리스트
    """
    result = []

    for chapter in chapters:
        content = chapter['content']

        # 챕터가 max_length보다 짧으면 그대로 유지
        if len(content) <= max_length:
            result.append(chapter)
            continue

        # 긴 챕터는 문단 단위로 분할
        paragraphs = content.split('\n\n')
        current_part = []
        current_length = 0
        part_num = 1

        for paragraph in paragraphs:
            para_length = len(paragraph)

            # 현재 파트에 추가했을 때 max_length를 초과하면 새 파트 시작
            if current_length + para_length > max_length and current_part:
                result.append({
                    "id": len(result) + 1,
                    "title": f"{chapter['title']} (Part {part_num})",
                    "content": '\n\n'.join(current_part)
                })
                current_part = [paragraph]
                current_length = para_length
                part_num += 1
            else:
                current_part.append(paragraph)
                current_length += para_length + 2  # '\n\n' 길이 포함

        # 마지막 파트 추가
        if current_part:
            title = f"{chapter['title']} (Part {part_num})" if part_num > 1 else chapter['title']
            result.append({
                "id": len(result) + 1,
                "title": title,
                "content": '\n\n'.join(current_part)
            })

    # ID 재할당
    for i, ch in enumerate(result):
        ch['id'] = i + 1

    return result


def merge_short_chapters(chapters: List[Dict], min_length: int = 500) -> List[Dict]:
    """
    너무 짧은 챕터를 병합 (선택 사항)

    Args:
        chapters: 챕터 리스트
        min_length: 최소 챕터 길이 (문자 수)

    Returns:
        병합된 챕터 리스트
    """
    if not chapters:
        return []

    merged = []
    buffer = None

    for chapter in chapters:
        content_length = len(chapter['content'])

        if content_length < min_length:
            # 짧은 챕터는 버퍼에 누적
            if buffer is None:
                buffer = chapter.copy()
            else:
                buffer['content'] += '\n\n' + chapter['content']
                # 제목도 병합
                buffer['title'] += ' / ' + chapter['title']
        else:
            # 긴 챕터 발견 시
            if buffer:
                # 버퍼에 누적된 내용이 있으면 먼저 추가
                merged.append(buffer)
                buffer = None
            merged.append(chapter)

    # 마지막 버퍼 처리
    if buffer:
        if merged:
            # 마지막 챕터에 병합
            merged[-1]['content'] += '\n\n' + buffer['content']
        else:
            # 버퍼만 있는 경우
            merged.append(buffer)

    # ID 재할당
    for i, chapter in enumerate(merged):
        chapter['id'] = i + 1

    return merged


def validate_chapters(chapters: List[Dict]) -> bool:
    """
    챕터 유효성 검증

    Args:
        chapters: 검증할 챕터 리스트

    Returns:
        유효하면 True, 아니면 False
    """
    if not chapters or len(chapters) == 0:
        return False

    for chapter in chapters:
        # 필수 필드 체크
        if 'id' not in chapter or 'title' not in chapter or 'content' not in chapter:
            return False

        # 내용 최소 길이 체크
        if len(chapter['content']) < 50:
            return False

    return True


def split_chapters_safe(text: str, merge_short: bool = False, min_length: int = 500,
                        max_length: int = 8000, split_long: bool = True) -> List[Dict]:
    """
    안전한 챕터 분리 (에러 핸들링 포함)

    Args:
        text: 분리할 텍스트
        merge_short: 짧은 챕터 병합 여부
        min_length: 최소 챕터 길이 (병합 시)
        max_length: 최대 챕터 길이 (분할 시)
        split_long: 긴 챕터 분할 여부

    Returns:
        챕터 리스트
    """
    try:
        chapters = split_chapters(text)

        # 긴 챕터 분할 (영어 학습용)
        if split_long:
            chapters = split_long_chapters(chapters, max_length)
            print(f"    [INFO] 긴 챕터 분할 완료: {len(chapters)}개 챕터")

        # 병합 옵션
        if merge_short and len(chapters) > 1:
            chapters = merge_short_chapters(chapters, min_length)

        # 유효성 검증
        if not validate_chapters(chapters):
            raise ValueError("유효하지 않은 챕터 구조")

        # 챕터가 너무 많으면 경고 (100개 이상)
        if len(chapters) > 100:
            print(f"    [WARN] 챕터가 너무 많습니다 ({len(chapters)}개). 재분석이 필요할 수 있습니다.")

        # 통계 출력
        avg_length = sum(len(ch['content']) for ch in chapters) / len(chapters)
        print(f"    [INFO] 평균 챕터 길이: {avg_length:,.0f} 문자")

        return chapters

    except Exception as e:
        # 에러 발생 시 전체 텍스트를 단일 챕터로
        print(f"    [WARN] 챕터 분리 실패: {str(e)}. 전체 텍스트를 단일 챕터로 처리합니다.")
        return [{
            "id": 1,
            "title": "Full Text",
            "content": text.strip()
        }]


if __name__ == '__main__':
    # 테스트 코드
    print("=== 챕터 분리 테스트 ===\n")

    test_text = """
CHAPTER I

This is the first chapter.
It has multiple paragraphs.

This is another paragraph in chapter one.


CHAPTER II

This is the second chapter.
It also has content.


CHAPTER III

This is the third chapter.
More content here.
    """

    print("원본 텍스트 길이:", len(test_text))
    print("\n챕터 분리 중...\n")

    chapters = split_chapters_safe(test_text)

    print(f"총 {len(chapters)}개 챕터 발견\n")

    for chapter in chapters:
        print(f"챕터 {chapter['id']}: {chapter['title']}")
        print(f"  내용 길이: {len(chapter['content'])} 문자")
        print(f"  미리보기: {chapter['content'][:50]}...")
        print()

    # 유효성 검증
    if validate_chapters(chapters):
        print("✅ 챕터 유효성 검증 성공")
    else:
        print("❌ 챕터 유효성 검증 실패")

    # 단일 챕터 테스트
    print("\n=== 단일 텍스트 테스트 ===\n")
    single_text = "This is a single text without chapters."
    single_chapters = split_chapters_safe(single_text)
    print(f"챕터 수: {len(single_chapters)}")
    print(f"제목: {single_chapters[0]['title']}")
