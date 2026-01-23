import requests
from app.core.config import settings

def send_telegram_alert(message: str):
    """
    Sends a real message to the Owner's Telegram Channel via Bot API.
    """
    token = settings.TELEGRAM_BOT_TOKEN
    chat_id = settings.TELEGRAM_CHAT_ID

    # Log to console for local debugging
    print(f"\n📲 [SYSTEM LOG]: {message}\n")

    if not token or not chat_id:
        print("⚠️ Telegram Token or Chat ID is missing in .env. Skipping alert.")
        return

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML"
    }

    try:
        response = requests.post(url, json=payload, timeout=5)
        if response.status_code != 200:
            print(f"❌ Telegram API Error: {response.text}")
    except Exception as e:
        print(f"❌ Connection Error sending Telegram alert: {e}")
