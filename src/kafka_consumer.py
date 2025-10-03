import json
from kafka import KafkaConsumer
from .kafka_config import KAFKA_BOOTSTRAP_SERVERS, CHAT_TOPIC

class ChatConsumer:
    def __init__(self, group_id='chat-group'):
        self.consumer = KafkaConsumer(
            CHAT_TOPIC,
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            group_id=group_id,
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            auto_offset_reset='latest'
        )
    
    def consume_messages(self):
        for message in self.consumer:
            yield message.value