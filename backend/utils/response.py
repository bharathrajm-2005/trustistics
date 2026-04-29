from typing import Any, Optional
from datetime import datetime, timezone

def api_response(
    success: bool,
    message: str,
    data: Any = None,
    error: Any = None,
    mongo_status: bool = True,
    blockchain_ready: bool = True
) -> dict:
    """
    Standard envelope format for all API returns across Trustistics.
    """
    return {
        "success": success,
        "message": message,
        "data": data,
        "error": error,
        "meta": {
            "mongodb": mongo_status,
            "blockchain": blockchain_ready,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    }
