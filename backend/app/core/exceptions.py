def is_gemini_quota_error(e: Exception) -> bool:
    """
    Categorizes Gemini API client and server exceptions to check if they
    refer to quota limitations, API key exhaustion, or authentication failures.
    """
    if hasattr(e, "status_code") and e.status_code in (429, 403):
        return True
    if hasattr(e, "code") and e.code in (429, 403):
        return True

    for attr in ("response", "response_json"):
        if hasattr(e, attr):
            val = getattr(e, attr)
            if val and hasattr(val, "status_code") and val.status_code in (429, 403):
                return True
            if isinstance(val, dict) and val.get("error", {}).get("code") in (429, 403):
                return True

    error_str = str(e).upper()
    return any(
        keyword in error_str
        for keyword in ["429", "RESOURCE_EXHAUSTED", "403", "API_KEY", "QUOTA"]
    )
