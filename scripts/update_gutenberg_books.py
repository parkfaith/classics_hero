#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Gutenberg 도서만 업데이트 (샘플 도서는 유지)
"""

import json
import sys
from pathlib import Path


def main():
    # 파일 경로
    existing_path = Path('../src/data/books.json')
    collected_path = Path('output/collected_books.json')
    backup_path = Path('../src/data/books_backup.json')

    # 기존 파일 백업
    if existing_path.exists():
        print(f"기존 books.json 백업 중...")
        with open(existing_path, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)

        with open(backup_path, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, indent=2, ensure_ascii=False)

        print(f"[OK] 백업 완료: {backup_path}")
    else:
        existing_data = []
        print(f"[WARN] 기존 books.json이 없습니다.")

    # 수집된 데이터 로드
    if not collected_path.exists():
        print(f"[ERROR] collected_books.json을 찾을 수 없습니다: {collected_path}")
        sys.exit(1)

    with open(collected_path, 'r', encoding='utf-8') as f:
        collected_data = json.load(f)

    print(f"\n수집된 Gutenberg 도서: {len(collected_data)}권")

    # Gutenberg 도서 ID 목록 (benjamin_franklin, abraham_lincoln, marie_curie로 시작)
    gutenberg_ids = {book['id'] for book in collected_data}

    # 기존 데이터에서 샘플 도서만 유지 (Gutenberg 도서 제외)
    sample_books = [book for book in existing_data if book['id'] not in gutenberg_ids]

    print(f"유지할 샘플 도서: {len(sample_books)}권")
    for book in sample_books:
        print(f"  - {book['title']}")

    # 병합: 샘플 도서 + Gutenberg 도서
    merged_data = sample_books + collected_data

    print(f"\n병합 결과:")
    print(f"  - 샘플 도서: {len(sample_books)}권")
    print(f"  - Gutenberg 도서: {len(collected_data)}권")
    print(f"  - 최종 도서: {len(merged_data)}권")

    # 저장
    with open(existing_path, 'w', encoding='utf-8') as f:
        json.dump(merged_data, f, indent=2, ensure_ascii=False)

    print(f"\n[SUCCESS] books.json 업데이트 완료!")
    print(f"[SAVE] 저장 위치: {existing_path.absolute()}")

    # 통계
    print(f"\n[STATS] 챕터 통계:")
    for book in merged_data:
        total_length = sum(len(ch['content']) for ch in book['chapters'])
        avg_length = total_length / len(book['chapters']) if book['chapters'] else 0
        print(f"  {book['title'][:40]:40s} - {len(book['chapters']):2d}챕터 (평균 {avg_length:,.0f}자)")


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"\n[ERROR] 업데이트 실패: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
