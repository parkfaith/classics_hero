# Vercel Serverless Function 진입점
import sys
import os

# backend 모듈을 찾을 수 있도록 경로 추가
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from main import app

# Vercel은 'app' 또는 'handler'를 찾음
handler = app
