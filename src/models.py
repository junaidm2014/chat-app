from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ChatMessage(BaseModel):
    username: str
    message: str
    timestamp: datetime = datetime.now()
    room: str = "general"