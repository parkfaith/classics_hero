#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Gutendex API 래퍼
Project Gutenberg 도서 메타데이터 조회 및 텍스트 다운로드
"""

import requests
import time
from typing import Dict, Optional


def fetch_with_retry(url: str, max_retries: int = 3, timeout: int = 30) -> requests.Response:
    """
    재시도 로직이 포함된 HTTP GET 요청

    Args:
        url: 요청 URL
        max_retries: 최대 재시도 횟수
        timeout: 타임아웃 (초)

    Returns:
        requests.Response 객체

    Raises:
        requests.RequestException: 모든 재시도 실패 시
    """
    for attempt in range(max_retries):
        try:
            response = requests.get(url, timeout=timeout)
            response.raise_for_status()
            return response
        except requests.RequestException as e:
            if attempt == max_retries - 1:
                raise
            wait_time = 2 ** attempt
            print(f"    ⚠️ 재시도 중... ({attempt + 1}/{max_retries}) - {wait_time}초 대기")
            time.sleep(wait_time)


def get_book_metadata(book_id: int) -> Dict:
    """
    Gutendex API로 도서 메타데이터 조회

    Args:
        book_id: Project Gutenberg 도서 ID

    Returns:
        도서 메타데이터 딕셔너리
        {
            'id': int,
            'title': str,
            'authors': [{'name': str, 'birth_year': int, 'death_year': int}],
            'subjects': [str],
            'bookshelves': [str],
            'languages': [str],
            'copyright': bool,
            'formats': {'mime/type': 'url'}
        }

    Raises:
        requests.RequestException: API 호출 실패
        ValueError: 유효하지 않은 응답
    """
    url = f"https://gutendex.com/books/{book_id}"

    try:
        response = fetch_with_retry(url)
        data = response.json()

        if 'id' not in data:
            raise ValueError(f"유효하지 않은 메타데이터: {book_id}")

        return data

    except requests.RequestException as e:
        raise requests.RequestException(f"메타데이터 조회 실패 (Book ID: {book_id}): {str(e)}")


def download_book_text(book_id: int) -> str:
    """
    Project Gutenberg에서 도서 텍스트 다운로드

    여러 URL 패턴을 시도하여 UTF-8 텍스트 파일 다운로드

    Args:
        book_id: Project Gutenberg 도서 ID

    Returns:
        도서의 전체 텍스트 (UTF-8 인코딩)

    Raises:
        Exception: 모든 URL 패턴에서 다운로드 실패
    """
    # 시도할 URL 패턴 목록 (우선순위 순)
    url_patterns = [
        f"https://www.gutenberg.org/files/{book_id}/{book_id}-0.txt",
        f"https://www.gutenberg.org/cache/epub/{book_id}/pg{book_id}.txt",
        f"https://www.gutenberg.org/ebooks/{book_id}.txt.utf-8",
    ]

    last_error = None

    for url in url_patterns:
        try:
            response = requests.get(url, timeout=30)

            if response.status_code == 200:
                # UTF-8 인코딩 시도
                try:
                    text = response.content.decode('utf-8')
                    return text
                except UnicodeDecodeError:
                    # Fallback: latin-1 인코딩 시도
                    try:
                        text = response.content.decode('latin-1')
                        return text
                    except:
                        continue

        except Exception as e:
            last_error = e
            continue

    # 모든 URL 패턴 실패
    error_msg = f"텍스트를 다운로드할 수 없습니다 (Book ID: {book_id})"
    if last_error:
        error_msg += f" - 마지막 오류: {str(last_error)}"
    raise Exception(error_msg)


def search_books_by_author(author_name: str, limit: int = 10) -> list:
    """
    저자 이름으로 도서 검색 (향후 확장용)

    Args:
        author_name: 저자 이름
        limit: 최대 결과 수

    Returns:
        도서 메타데이터 리스트
    """
    url = "https://gutendex.com/books"
    params = {
        "search": author_name,
        "languages": "en"
    }

    try:
        response = fetch_with_retry(url)
        data = response.json()
        results = data.get('results', [])

        return results[:limit]

    except Exception as e:
        print(f"⚠️ 저자 검색 실패 ({author_name}): {str(e)}")
        return []


if __name__ == '__main__':
    # 테스트 코드
    print("=== Gutenberg API 테스트 ===\n")

    # 테스트 1: 메타데이터 조회
    print("1. 메타데이터 조회 테스트 (Book ID: 148)")
    try:
        metadata = get_book_metadata(148)
        print(f"   제목: {metadata['title']}")
        print(f"   저자: {metadata['authors'][0]['name']}")
        print(f"   ✅ 성공\n")
    except Exception as e:
        print(f"   ❌ 실패: {e}\n")

    # 테스트 2: 텍스트 다운로드
    print("2. 텍스트 다운로드 테스트 (Book ID: 148)")
    try:
        text = download_book_text(148)
        print(f"   다운로드 크기: {len(text):,} 문자")
        print(f"   미리보기: {text[:100]}...")
        print(f"   ✅ 성공\n")
    except Exception as e:
        print(f"   ❌ 실패: {e}\n")
