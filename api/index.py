# Vercel Serverless Function 진입점
import sys
import os

# backend 모듈을 찾을 수 있도록 경로 추가
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from mangum import Mangum
from main import app

# Mangum으로 ASGI → AWS Lambda/Vercel 호환 변환
handler = Mangum(app, lifespan="off")
