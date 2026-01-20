#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
텍스트 클리닝 모듈
Project Gutenberg 헤더/푸터, 서문, 목차 등 제거
"""

import re


def remove_gutenberg_header_footer(text: str) -> str:
    """
    Project Gutenberg 헤더 및 푸터 제거

    헤더: *** START OF THE PROJECT GUTENBERG ... ***
    푸터: *** END OF THE PROJECT GUTENBERG ... ***

    Args:
        text: 원본 텍스트

    Returns:
        헤더/푸터가 제거된 텍스트
    """
    # 헤더 제거
    start_patterns = [
        r'\*\*\*\s*START OF TH[EI]S? PROJECT GUTENBERG.*?\*\*\*',
        r'\*\*\*\s*START OF THE PROJECT GUTENBERG.*?\*\*\*',
    ]

    for pattern in start_patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            text = text[match.end():]
            break

    # 푸터 제거
    end_patterns = [
        r'\*\*\*\s*END OF TH[EI]S? PROJECT GUTENBERG.*?\*\*\*',
        r'\*\*\*\s*END OF THE PROJECT GUTENBERG.*?\*\*\*',
    ]

    for pattern in end_patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            text = text[:match.start()]
            break

    return text.strip()


def remove_front_matter(text: str) -> str:
    """
    서문, 목차 등 학습에 불필요한 부분 제거

    - CONTENTS ~ CHAPTER 1 사이
    - PREFACE/INTRODUCTION ~ CHAPTER 1 사이
    - TABLE OF CONTENTS ~ CHAPTER 1 사이

    Args:
        text: 클리닝할 텍스트

    Returns:
        서문/목차가 제거된 텍스트
    """
    # CONTENTS 제거
    text = re.sub(
        r'(?i)(?:^|\n)CONTENTS.*?(?=(?:^|\n)(?:CHAPTER|SPEECH|LETTER)\s+(?:I\b|1\b|ONE\b))',
        '',
        text,
        flags=re.DOTALL
    )

    # TABLE OF CONTENTS 제거
    text = re.sub(
        r'(?i)(?:^|\n)TABLE\s+OF\s+CONTENTS.*?(?=(?:^|\n)(?:CHAPTER|SPEECH|LETTER)\s+(?:I\b|1\b|ONE\b))',
        '',
        text,
        flags=re.DOTALL
    )

    # PREFACE 제거
    text = re.sub(
        r'(?i)(?:^|\n)PREFACE.*?(?=(?:^|\n)(?:CHAPTER|SPEECH|LETTER)\s+(?:I\b|1\b|ONE\b))',
        '',
        text,
        flags=re.DOTALL
    )

    # INTRODUCTION 제거
    text = re.sub(
        r'(?i)(?:^|\n)INTRODUCTION.*?(?=(?:^|\n)(?:CHAPTER|SPEECH|LETTER)\s+(?:I\b|1\b|ONE\b))',
        '',
        text,
        flags=re.DOTALL
    )

    # FOREWORD 제거
    text = re.sub(
        r'(?i)(?:^|\n)FOREWORD.*?(?=(?:^|\n)(?:CHAPTER|SPEECH|LETTER)\s+(?:I\b|1\b|ONE\b))',
        '',
        text,
        flags=re.DOTALL
    )

    return text


def clean_whitespace(text: str) -> str:
    """
    불필요한 공백 및 줄바꿈 정리

    - 과도한 줄바꿈 제거 (3개 이상 → 2개)
    - 각 줄의 앞뒤 공백 제거
    - 탭을 공백으로 변환

    Args:
        text: 클리닝할 텍스트

    Returns:
        공백이 정리된 텍스트
    """
    # 탭을 공백으로 변환
    text = text.replace('\t', ' ')

    # 각 줄의 앞뒤 공백 제거
    lines = [line.strip() for line in text.split('\n')]
    text = '\n'.join(lines)

    # 과도한 줄바꿈 제거 (3개 이상 → 2개)
    text = re.sub(r'\n{3,}', '\n\n', text)

    # 앞뒤 공백 제거
    text = text.strip()

    return text


def remove_page_numbers(text: str) -> str:
    """
    페이지 번호 제거 (선택 사항)

    독립된 줄에 있는 숫자만 있는 라인 제거

    Args:
        text: 클리닝할 텍스트

    Returns:
        페이지 번호가 제거된 텍스트
    """
    # 독립된 줄에 숫자만 있는 경우 제거
    text = re.sub(r'(?:^|\n)\s*\d+\s*(?:\n|$)', '\n', text, flags=re.MULTILINE)

    return text


def clean_text_pipeline(raw_text: str, remove_pages: bool = False) -> str:
    """
    전체 텍스트 클리닝 파이프라인

    1. Gutenberg 헤더/푸터 제거
    2. 서문/목차 제거
    3. 페이지 번호 제거 (선택)
    4. 공백 정리

    Args:
        raw_text: 원본 텍스트
        remove_pages: 페이지 번호 제거 여부

    Returns:
        클리닝된 텍스트
    """
    text = remove_gutenberg_header_footer(raw_text)
    text = remove_front_matter(text)

    if remove_pages:
        text = remove_page_numbers(text)

    text = clean_whitespace(text)

    return text


if __name__ == '__main__':
    # 테스트 코드
    print("=== 텍스트 클리닝 테스트 ===\n")

    test_text = """
*** START OF THE PROJECT GUTENBERG EBOOK AUTOBIOGRAPHY OF BENJAMIN FRANKLIN ***

Produced by David Widger

CONTENTS

Chapter I
Chapter II
Chapter III

PREFACE

This is a preface that should be removed.

CHAPTER I

This is the actual content that should remain.
It has multiple paragraphs.

This is another paragraph.


CHAPTER II

More content here.


*** END OF THE PROJECT GUTENBERG EBOOK AUTOBIOGRAPHY OF BENJAMIN FRANKLIN ***
    """

    print("원본 텍스트 길이:", len(test_text))
    print("\n클리닝 중...\n")

    cleaned = clean_text_pipeline(test_text)

    print("클리닝된 텍스트 길이:", len(cleaned))
    print("\n클리닝된 텍스트:")
    print("=" * 60)
    print(cleaned)
    print("=" * 60)

    # 헤더/푸터 제거 확인
    if "*** START OF" not in cleaned and "*** END OF" not in cleaned:
        print("\n✅ 헤더/푸터 제거 성공")
    else:
        print("\n❌ 헤더/푸터 제거 실패")

    # 서문 제거 확인
    if "PREFACE" not in cleaned and "CONTENTS" not in cleaned:
        print("✅ 서문/목차 제거 성공")
    else:
        print("❌ 서문/목차 제거 실패")

    # 챕터 내용 유지 확인
    if "CHAPTER I" in cleaned and "actual content" in cleaned:
        print("✅ 챕터 내용 유지 성공")
    else:
        print("❌ 챕터 내용 유지 실패")
