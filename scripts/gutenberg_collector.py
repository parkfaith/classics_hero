#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Project Gutenberg 도서 수집 메인 스크립트
영어 고전 도서를 자동으로 수집하여 books.json 형식으로 변환
"""

import json
import sys
from pathlib import Path
from datetime import datetime

# 로컬 모듈 임포트
from gutenberg_api import get_book_metadata, download_book_text
from text_cleaner import clean_text_pipeline
from chapter_splitter import split_chapters_safe
from json_generator import generate_book_json, validate_book_json, generate_quality_report


def load_config(config_path: str = 'config.json') -> dict:
    """
    설정 파일 로드

    Args:
        config_path: 설정 파일 경로

    Returns:
        설정 딕셔너리

    Raises:
        FileNotFoundError: 설정 파일이 없는 경우
        json.JSONDecodeError: JSON 파싱 오류
    """
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"[ERROR] 설정 파일을 찾을 수 없습니다: {config_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"[ERROR] 설정 파일 파싱 오류: {e}")
        sys.exit(1)


def save_json(data: list, output_path: str):
    """
    JSON 파일로 저장

    Args:
        data: 저장할 데이터 (리스트)
        output_path: 출력 파일 경로
    """
    # 디렉토리 생성
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    # JSON 저장
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def log_message(message: str, log_file: str = 'output/logs/collection.log'):
    """
    로그 메시지 출력 및 파일 기록

    Args:
        message: 로그 메시지
        log_file: 로그 파일 경로
    """
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_entry = f"[{timestamp}] {message}\n"

    # 콘솔 출력
    print(message)

    # 로그 파일 기록
    Path(log_file).parent.mkdir(parents=True, exist_ok=True)
    with open(log_file, 'a', encoding='utf-8') as f:
        f.write(log_entry)


def collect_book(book_config: dict, hero_id: str, hero_name: str,
                index: int, config: dict) -> dict:
    """
    단일 도서 수집

    Args:
        book_config: 도서 설정 (config.json의 books 항목)
        hero_id: 영웅 ID
        hero_name: 영웅 이름
        index: 영웅 내 도서 인덱스
        config: 전체 설정

    Returns:
        생성된 도서 JSON 데이터

    Raises:
        Exception: 수집 실패 시
    """
    book_id = book_config['id']
    book_title = book_config['title']

    log_message(f"  [BOOK] [{book_id}] {book_title} 다운로드 중...")

    # 1. 메타데이터 조회
    metadata = get_book_metadata(book_id)
    log_message(f"    [v] 메타데이터 조회 완료")

    # 2. 텍스트 다운로드
    raw_text = download_book_text(book_id)
    log_message(f"    [v] 텍스트 다운로드 완료 ({len(raw_text):,} 문자)")

    # 3. 텍스트 클리닝
    clean_text = clean_text_pipeline(raw_text)
    log_message(f"    [v] 텍스트 클리닝 완료 ({len(clean_text):,} 문자)")

    # 4. 챕터 분리 (영어 학습용: 최대 8000자로 제한)
    chapters = split_chapters_safe(
        clean_text,
        merge_short=False,
        max_length=8000,
        split_long=True
    )
    log_message(f"    [v] 챕터 분리 완료 ({len(chapters)}개 챕터)")

    # 5. 챕터 수 제한 (최대 20개, 영어 학습용)
    if len(chapters) > 20:
        log_message(f"    [INFO] 챕터가 너무 많습니다 ({len(chapters)}개). 처음 20개만 선택합니다.")
        chapters = chapters[:20]
        chapters[-1]['title'] += ' (계속...)'

    # 6. JSON 생성
    book_json = generate_book_json(
        book_config, metadata, clean_text,
        chapters, hero_id, index, config
    )

    # 6. 유효성 검증
    if not validate_book_json(book_json):
        raise ValueError("생성된 JSON이 유효하지 않습니다")

    log_message(f"  [OK] 수집 완료!")

    return book_json


def main():
    """
    메인 실행 함수
    """
    print("=" * 60)
    print("[Project Gutenberg] 도서 수집 시작")
    print("=" * 60)
    print()

    # 설정 로드
    try:
        config = load_config('config.json')
    except Exception as e:
        print(f"[ERROR] 설정 로드 실패: {e}")
        sys.exit(1)

    collected_books = []
    failed_books = []

    # 각 영웅별 도서 수집
    for hero in config['heroes']:
        hero_id = hero['id']
        hero_name = hero['name']

        log_message(f"\n[{hero_name}] 도서 수집 시작...")

        for idx, book_config in enumerate(hero['books']):
            try:
                book_json = collect_book(
                    book_config, hero_id, hero_name,
                    idx, config
                )
                collected_books.append(book_json)

            except Exception as e:
                error_msg = f"  [ERROR] 수집 실패: {str(e)}"
                log_message(error_msg)
                failed_books.append({
                    'hero': hero_name,
                    'book_id': book_config['id'],
                    'title': book_config['title'],
                    'error': str(e)
                })
                continue

    # 최종 저장
    print("\n" + "=" * 60)

    if collected_books:
        output_path = 'output/collected_books.json'
        save_json(collected_books, output_path)
        log_message(f"[SUCCESS] 총 {len(collected_books)}권 수집 완료!")
        log_message(f"[SAVE] 저장 위치: {output_path}")

        # 품질 보고서 생성
        report = generate_quality_report(collected_books)
        report_path = 'output/logs/quality_report.json'
        save_json(report, report_path)

        # 통계 출력
        log_message(f"\n[STATS] 통계:")
        log_message(f"  - 총 도서: {report['total_books']}권")
        log_message(f"  - 총 챕터: {report['total_chapters']}개")
        log_message(f"  - 평균 챕터/도서: {report['avg_chapters_per_book']}개")

        log_message(f"\n  난이도 분포:")
        for level, count in report['difficulty_distribution'].items():
            log_message(f"    - {level}: {count}권")

        log_message(f"\n  장르 분포:")
        for genre, count in report['genre_distribution'].items():
            log_message(f"    - {genre}: {count}권")

        log_message(f"\n  영웅별 분포:")
        for hero, count in report['hero_distribution'].items():
            log_message(f"    - {hero}: {count}권")

    else:
        log_message("[ERROR] 수집된 도서가 없습니다.")

    # 실패 목록 출력
    if failed_books:
        log_message(f"\n[WARN] 실패한 도서 ({len(failed_books)}개):")
        for failed in failed_books:
            log_message(f"  - {failed['hero']}: {failed['title']} (ID: {failed['book_id']})")
            log_message(f"    오류: {failed['error']}")

    print("=" * 60)

    # 종료 코드
    if collected_books and not failed_books:
        sys.exit(0)  # 완전 성공
    elif collected_books and failed_books:
        sys.exit(2)  # 부분 성공
    else:
        sys.exit(1)  # 완전 실패


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[WARN] 사용자에 의해 중단되었습니다.")
        sys.exit(130)
    except Exception as e:
        print(f"\n\n[ERROR] 예상치 못한 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
