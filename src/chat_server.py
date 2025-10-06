from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import asyncio
import json
from typing import List, Dict
from .kafka_producer import ChatProducer
from .kafka_consumer import ChatConsumer
from .models import ChatMessage

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[str, WebSocket] = {}  # user_id -> websocket
        self.producer = ChatProducer()

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.user_connections[user_id] = websocket
        await self.broadcast_user_list()

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        # Remove user from user_connections
        to_remove = None
        for user_id, ws in self.user_connections.items():
            if ws == websocket:
                to_remove = user_id
                break
        if to_remove:
            del self.user_connections[to_remove]
        # Broadcast updated user list
        import asyncio
        asyncio.create_task(self.broadcast_user_list())

    async def send_personal_message(self, message: dict, recipient_id: str):
        ws = self.user_connections.get(recipient_id)
        if ws:
            await ws.send_text(json.dumps(message))

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except:
                pass

    async def broadcast_user_list(self):
        user_list = list(self.user_connections.keys())
        payload = {"type": "user_list", "users": user_list}
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(payload))
            except:
                pass

    def send_to_kafka(self, message: ChatMessage):
        self.producer.send_message(message)

manager = ConnectionManager()

@app.get("/")
async def get():
    with open("static/index.html") as f:
        return HTMLResponse(content=f.read())


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)

            chat_message = ChatMessage(
                username=message_data["username"],
                message=message_data["message"],
                room=message_data.get("room", "general")
            )

            manager.send_to_kafka(chat_message)

            # Private message handling
            recipient_id = message_data.get("recipient")
            msg_payload = {
                "username": chat_message.username,
                "message": chat_message.message,
                "timestamp": chat_message.timestamp.isoformat(),
                "room": chat_message.room,
                "private": bool(recipient_id),
                "recipient": recipient_id if recipient_id else None
            }
            if recipient_id:
                await manager.send_personal_message(msg_payload, recipient_id)
                await manager.send_personal_message(msg_payload, user_id)  # echo to sender
            else:
                await manager.broadcast(msg_payload)

    except WebSocketDisconnect:
        manager.disconnect(websocket)