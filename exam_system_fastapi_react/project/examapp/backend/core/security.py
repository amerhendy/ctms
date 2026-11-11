"""
أدوات الأمان: تجزئة كلمات المرور (PBKDF2-HMAC-SHA256 عبر hashlib القياسية،
بدون الاعتماد على مكتبات خارجية تحتاج بناء/ترجمة)، وتوليد رموز الجلسات
(Session Tokens) وأكواد دخول المتقدمين.
"""

import hashlib
import hmac
import os
import secrets
import string
from datetime import datetime, timedelta,timezone
from typing import Optional, Any
from core.config import settings
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
PBKDF2_ITERATIONS = 260_000
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()

def _derive(password: str, salt: bytes, iterations: int = PBKDF2_ITERATIONS) -> bytes:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)


def hash_password(password: str) -> str:
    """إرجاع تجزئة بصيغة 'salt_hex$digest_hex' لتخزينها في قاعدة البيانات."""
    salt = os.urandom(16)
    digest = _derive(password, salt)
    return f"{salt.hex()}${digest.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        salt_hex, digest_hex = password_hash.split("$")
    except (ValueError, AttributeError):
        return False
    salt = bytes.fromhex(salt_hex)
    expected = bytes.fromhex(digest_hex)
    actual = _derive(password, salt)
    return hmac.compare_digest(expected, actual)


def generate_token(length: int = 48) -> str:
    """توليد رمز جلسة عشوائي آمن (Bearer Token)."""
    return secrets.token_urlsafe(length)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def generate_access_code(length: int = 8) -> str:
    """توليد كود دخول قصير للمتقدمين (أحرف كبيرة وأرقام)."""
    chars = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(chars) for _ in range(length))

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)