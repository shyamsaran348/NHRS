import os
from dotenv import load_dotenv

# Load env file variables
load_dotenv()

class Settings:
    # 1. Database Connection URL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://shyam@localhost:5432/gov_highway_tenders"
    )

    # 2. Authentication Signature Key (Mandatory, crashes startup if missing)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    if not SECRET_KEY:
        raise RuntimeError(
            "CRITICAL SECURITY CONFIGURATION ERROR: The 'SECRET_KEY' environment variable is missing. "
            "For active government security compliance, the server cannot start without a cryptographically signed signature key."
        )

    # 3. Encryption Standard
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")

    # 4. Token Expiry (480 minutes / 8 hours standard workday)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

    # 5. Production Restricted CORS Origins
    cors_origins_str: str = os.getenv("CORS_ORIGINS", "")
    if cors_origins_str:
        CORS_ORIGINS: list[str] = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]
    else:
        # Default safe development settings
        CORS_ORIGINS: list[str] = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
        ]

settings = Settings()
