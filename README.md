# Kafka Chat Application

A real-time chat application built with FastAPI, WebSockets, and Apache Kafka for scalable message processing.

## Features

- **Real-time messaging** using WebSockets
- **Scalable architecture** with Kafka message streaming
- **Modern web interface** with responsive design
- **Docker-based Kafka setup** for easy deployment
- **Message persistence** through Kafka topics
- **Multiple chat rooms** support (extensible)

## Architecture

```
Browser (WebSocket) ↔ FastAPI Server ↔ Kafka Topic ↔ Message Storage
                           ↕
                    Multiple Connected Users
```

## Prerequisites

- **Python 3.8+**
- **Docker & Docker Compose**
- **Web browser** (Chrome, Firefox, Safari, etc.)

## Installation

### 1. Clone and Setup

```bash
# Navigate to the project directory
cd chat-app

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

Or install manually:
```bash
pip install kafka-python fastapi uvicorn websockets python-socketio pydantic
```

### 3. Start Kafka Services

```bash
# Start Kafka and Zookeeper using Docker
docker compose up -d

# Verify services are running
docker ps
```

You should see both `chat-app-kafka-1` and `chat-app-zookeeper-1` containers running.

## Running the Application

### 1. Start the Chat Server

```bash
# Make sure virtual environment is activated
source .venv/bin/activate

# Start the FastAPI server
python main.py
```

The server will start on `http://localhost:8000`

### 2. Access the Chat Interface

Open your web browser and navigate to:
```
http://localhost:8000
```

### 3. Start Chatting!

1. Enter your username
2. Type a message
3. Press Enter or click Send
4. Open multiple browser tabs to test real-time messaging

## Project Structure

```
chat-app/
├── README.md                 # This file
├── requirements.txt          # Python dependencies
├── docker-compose.yml        # Kafka setup
├── main.py                   # Application entry point
├── src/                      # Python source code
│   ├── __init__.py
│   ├── models.py            # Data models (ChatMessage)
│   ├── kafka_config.py      # Kafka configuration
│   ├── kafka_producer.py    # Message producer
│   ├── kafka_consumer.py    # Message consumer
│   └── chat_server.py       # FastAPI server & WebSocket handling
└── static/                   # Frontend files
    ├── index.html           # Chat interface
    ├── style.css            # Styling
    └── script.js            # WebSocket client logic
```

## Configuration

### Kafka Settings
Edit `src/kafka_config.py` to modify:
- Kafka broker addresses
- Topic names
- Connection settings

### Server Settings
Edit `main.py` to change:
- Server host/port
- CORS settings
- Logging configuration

## Troubleshooting

### Kafka Connection Issues
```bash
# Check if Kafka containers are running
docker ps

# View Kafka logs
docker logs chat-app-kafka-1

# View Zookeeper logs
docker logs chat-app-zookeeper-1

# Restart services
docker compose down
docker compose up -d
```

### Python Dependencies
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check virtual environment
which python
```

### Port Conflicts
- **Port 8000**: FastAPI server (change in `main.py`)
- **Port 9092**: Kafka broker (change in `docker-compose.yml`)
- **Port 2181**: Zookeeper (change in `docker-compose.yml`)

## Development

### Adding New Features

1. **Message History**: Implement Kafka consumer to load previous messages
2. **Chat Rooms**: Extend the room functionality in `models.py`
3. **User Authentication**: Add login/logout functionality
4. **Private Messages**: Implement direct messaging between users
5. **Message Persistence**: Add database integration for long-term storage

### Running in Development Mode

```bash
# Start with auto-reload
uvicorn src.chat_server:app --reload --host 0.0.0.0 --port 8000
```

### Testing

```bash
# Test Kafka connection
python -c "from kafka import KafkaProducer; print('Kafka connection successful')"

# Test WebSocket locally
# Open browser console and run:
# ws = new WebSocket('ws://localhost:8000/ws/test')
```

## Production Deployment

### Environment Variables
Create a `.env` file:
```env
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
CHAT_TOPIC=chat-messages
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
```

### Docker Deployment
```bash
# Build and run everything with Docker
docker compose -f docker-compose.prod.yml up -d
```

### Scaling
- Add more Kafka brokers for higher throughput
- Use multiple FastAPI instances behind a load balancer
- Implement Redis for session management

## API Endpoints

- `GET /`: Chat interface (HTML page)
- `WebSocket /ws/{client_id}`: Real-time messaging endpoint
- `GET /static/*`: Static file serving

## WebSocket Message Format

### Sending Messages
```json
{
  "username": "john_doe",
  "message": "Hello, world!",
  "room": "general"
}
```

### Receiving Messages
```json
{
  "username": "john_doe",
  "message": "Hello, world!",
  "timestamp": "2025-10-03T22:30:45.123456",
  "room": "general"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review Docker and Kafka logs
3. Open an issue with detailed error information

---

**Happy Chatting! 🚀**