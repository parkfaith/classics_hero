#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
수집된 도서를 기존 books.json과 병합
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
        print(f"    기존 도서 수: {len(existing_data)}권")
    else:
        existing_data = []
        print(f"[WARN] 기존 books.json이 없습니다. 새로 생성합니다.")

    # 수집된 데이터 로드
    if not collected_path.exists():
        print(f"[ERROR] collected_books.json을 찾을 수 없습니다: {collected_path}")
        sys.exit(1)

    with open(collected_path, 'r', encoding='utf-8') as f:
        collected_data = json.load(f)

    print(f"\n수집된 도서: {len(collected_data)}권")

    # 중복 확인 (ID 기준)
    existing_ids = {book['id'] for book in existing_data}
    new_books = []
    skipped_books = []

    for book in collected_data:
        if book['id'] in existing_ids:
            skipped_books.append(book['id'])
        else:
            new_books.append(book)

    if skipped_books:
        print(f"\n[WARN] 중복된 도서 {len(skipped_books)}권 건너뜀:")
        for book_id in skipped_books:
            print(f"  - {book_id}")

    # 병합
    merged_data = existing_data + new_books

    print(f"\n병합 결과:")
    print(f"  - 기존 도서: {len(existing_data)}권")
    print(f"  - 새로운 도서: {len(new_books)}권")
    print(f"  - 최종 도서: {len(merged_data)}권")

    # 저장
    with open(existing_path, 'w', encoding='utf-8') as f:
        json.dump(merged_data, f, indent=2, ensure_ascii=False)

    print(f"\n[SUCCESS] books.json 병합 완료!")
    print(f"[SAVE] 저장 위치: {existing_path.absolute()}")

    # 통계
    print(f"\n[STATS] 최종 통계:")
    genres = {}
    difficulties = {}
    for book in merged_data:
        genre = book['genre']
        difficulty = book['difficulty']
        genres[genre] = genres.get(genre, 0) + 1
        difficulties[difficulty] = difficulties.get(difficulty, 0) + 1

    print(f"  장르 분포:")
    for genre, count in sorted(genres.items()):
        print(f"    - {genre}: {count}권")

    print(f"  난이도 분포:")
    for diff, count in sorted(difficulties.items()):
        print(f"    - {diff}: {count}권")


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"\n[ERROR] 병합 실패: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
