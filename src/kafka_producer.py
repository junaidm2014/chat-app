import json
from kafka import KafkaProducer
from .kafka_config import KAFKA_BOOTSTRAP_SERVERS
from .models import ChatMessage

class ChatProducer:
    def __init__(self):
        self.producer = KafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
    
    def send_message(self, message: ChatMessage):
        message_dict = message.model_dump() #message.dict()
        message_dict['timestamp'] = message_dict['timestamp'].isoformat()
        self.producer.send('chat-messages', message_dict)
        self.producer.flush()