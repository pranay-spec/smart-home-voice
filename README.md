# Smart Home Voice Controller

A voice-command smart home simulator with a REST API and real-time dashboard. Process natural language commands to control virtual devices like lights, AC, TV, and fans.

## Features

- Natural language command parsing (rule-based + optional OpenAI fallback)
- REST API for device control
- Real-time web dashboard with dark/light theme
- Persistent state storage
- Multi-command support (e.g., "Turn on the bedroom light and set AC to 24")
- Command history tracking

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or with hot-reload for development
npm run dev
```

The server runs on `http://localhost:3000` by default.

## Configuration

Copy `.env.example` to `.env` and configure:

```env
# Optional: Enables AI-powered parsing for complex commands
OPENAI_API_KEY=your_key_here

# Server port (default: 3000)
PORT=3000

# API authentication key (default: 12345)
API_KEY=your_secret_key
```

## API Endpoints

All endpoints require the `x-api-key` header.

### Process Voice Command
```
POST /api/process
```

**Request:**
```json
{
  "prompt": "Turn on the bedroom light and set AC to 24 degrees"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Workflow executed",
  "note_id": "uuid",
  "parsed": { "actions": [...] },
  "results": [...],
  "state": { ... }
}
```

### Get Current State
```
GET /api/state
```

### Get Command History
```
GET /api/history
```

## Supported Commands

| Command Type | Examples |
|-------------|----------|
| Power | "Turn on the bedroom light", "Switch off the AC" |
| Temperature | "Set AC to 24 degrees", "Set temperature to 22" |
| Brightness | "Dim lights to 50%", "Set brightness to 80%" |
| TV Channel | "Set channel 5", "Change to channel 12" |

## Supported Devices

- `light` - Lights/lamps (on/off, brightness)
- `ac` - Air conditioner (on/off, temperature)
- `tv` - Television (on/off, channel)
- `fan` - Fan (on/off)

## Supported Rooms

- `bedroom`
- `living_room`
- `kitchen`
- `hall`

## Dashboard

Access the web dashboard at `http://localhost:3000` to view real-time device states with auto-refresh.

## Requirements

- Node.js >= 18

## License

MIT
