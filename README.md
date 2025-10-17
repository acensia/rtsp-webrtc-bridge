# RTSP to WebRTC Streaming Server

A Node.js application that receives video streams from RTSP servers and publishes them as WebRTC streams for browser-based playback.

## Features

- Connects to RTSP camera streams
- Converts RTSP to WebSocket stream using FFmpeg
- WebRTC signaling server for peer connections
- Web-based video player interface
- Configurable stream settings

## Prerequisites

### Option 1: Native Installation
- Node.js (v16 or higher)
- FFmpeg installed on your system
  ```bash
  # macOS
  brew install ffmpeg

  # Ubuntu/Debian
  sudo apt-get install ffmpeg

  # Windows
  # Download from https://ffmpeg.org/download.html
  ```

### Option 2: Docker (Recommended for Ubuntu 20.04 ARM64)
- Docker (v20.10 or higher)
- Docker Compose (v1.29 or higher)

## Installation

### Native Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure your RTSP source in `config.json`:
   ```json
   {
     "rtsp": {
       "url": "rtsp://your-camera-ip:554/stream",
       "username": "",
       "password": ""
     },
     "server": {
       "port": 3000,
       "wsPort": 8080
     }
   }
   ```

### Docker Installation

1. Configure your RTSP source in `config.json` (same as above)

2. Build the Docker image:
   ```bash
   docker build -t rtsp-webrtc-streamer:latest .
   ```

   Or use Docker Compose:
   ```bash
   docker-compose build
   ```

## Usage

### Native Usage

1. Build the project:
   ```bash
   npm run build
   ```

2. Start the server:
   ```bash
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

4. Click "Start Stream" to begin viewing the RTSP stream

### Docker Usage

1. Start the container using Docker Compose (recommended):
   ```bash
   docker-compose up -d
   ```

   Or using Docker directly:
   ```bash
   docker run -d \
     --name rtsp-webrtc-server \
     -p 3000:3000 \
     -p 8080:8080 \
     -p 9999:9999 \
     -v $(pwd)/config.json:/app/config.json:ro \
     rtsp-webrtc-streamer:latest
   ```

2. Check container logs:
   ```bash
   docker-compose logs -f
   # or
   docker logs -f rtsp-webrtc-server
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

4. Click "Start Stream" to begin viewing the RTSP stream

5. Stop the container:
   ```bash
   docker-compose down
   # or
   docker stop rtsp-webrtc-server
   ```

### Testing on Ubuntu 20.04 ARM64

The Dockerfile is optimized for ARM64 architecture:

```bash
# On Ubuntu 20.04 ARM64
docker build -t rtsp-webrtc-streamer:latest .
docker-compose up -d
```

The image uses `arm64v8/node:20-bullseye-slim` as the base image and includes FFmpeg compiled for ARM64.

## Architecture

```
RTSP Camera → RTSP Client → FFmpeg → WebSocket (port 9999)
                                           ↓
                                    Browser Client
                                           ↑
WebRTC Signaling ← WebSocket Server (port 8080)
```

### Components

- **RTSP Client** (`src/rtspClient.ts`): Connects to RTSP source and converts to WebSocket stream using FFmpeg
- **Signaling Server** (`src/signalingServer.ts`): Handles WebRTC signaling between peers
- **Web Client** (`public/`): Browser-based video player interface
- **Main Server** (`src/index.ts`): Orchestrates all components

## Configuration

Edit `config.json` to customize:

- **rtsp.url**: Your RTSP camera URL
- **rtsp.username/password**: RTSP authentication (if required)
- **server.port**: HTTP server port (default: 3000)
- **server.wsPort**: WebSocket signaling port (default: 8080)
- **webrtc.iceServers**: STUN/TURN servers for WebRTC

## Troubleshooting

### Stream not connecting
- Verify FFmpeg is installed: `ffmpeg -version`
- Check RTSP URL is correct and accessible
- Ensure camera supports RTSP protocol

### Video not playing
- Check browser console for errors
- Verify WebSocket connections are established
- Ensure ports 3000, 8080, and 9999 are not blocked

### High latency
- Adjust FFmpeg options in `src/rtspClient.ts`
- Use lower resolution or frame rate
- Check network bandwidth

## Development

Project structure:
```
ral-webrtc/
├── src/
│   ├── index.ts              # Main server
│   ├── rtspClient.ts          # RTSP stream handler
│   └── signalingServer.ts     # WebRTC signaling
├── public/
│   ├── index.html             # Web interface
│   └── client.js              # Browser client logic
├── config.json                # Configuration
├── package.json
└── tsconfig.json
```

## Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled server
- `npm run dev` - Run with ts-node for development
- `npm run watch` - Watch mode for TypeScript compilation

## Docker Details

### Multi-stage Build
The Dockerfile uses a multi-stage build to minimize the final image size:
- **Builder stage**: Compiles TypeScript code
- **Production stage**: Contains only runtime dependencies and compiled code

### Image Features
- Based on `arm64v8/node:20-bullseye-slim` for ARM64 compatibility
- FFmpeg pre-installed and verified
- Non-root user for security
- Health check endpoint configured
- Automatic restart on failure

### Ports
- **3000**: HTTP server for web interface
- **8080**: WebRTC signaling WebSocket server
- **9999**: RTSP stream WebSocket server

### Environment Variables
You can override configuration using environment variables in `docker-compose.yml`:
```yaml
environment:
  - NODE_ENV=production
```

## Notes

- The implementation uses FFmpeg directly via Node.js child processes
- For production use, consider adding authentication and HTTPS
- WebRTC peer connections may require TURN servers for NAT traversal
- The stream port (9999) is used for the FFmpeg WebSocket output
- Docker image is optimized for Ubuntu 20.04 ARM64 architecture

## License

MIT
