from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import asyncio
import json
from typing import List
from .kafka_producer import ChatProducer
from .kafka_consumer import ChatConsumer
from .models import ChatMessage

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.producer = ChatProducer()
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except:
                pass
    
    def send_to_kafka(self, message: ChatMessage):
        self.producer.send_message(message)

manager = ConnectionManager()

@app.get("/")
async def get():
    with open("static/index.html") as f:
        return HTMLResponse(content=f.read())

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            chat_message = ChatMessage(
                username=message_data["username"],
                message=message_data["message"],
                room=message_data.get("room", "general")
            )
            
            # Send to Kafka
            manager.send_to_kafka(chat_message)
            
            # Broadcast to all connected clients
            await manager.broadcast({
                "username": chat_message.username,
                "message": chat_message.message,
                "timestamp": chat_message.timestamp.isoformat(),
                "room": chat_message.room
            })
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)