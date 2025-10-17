#!/bin/bash
set -e

echo "Building RTSP to WebRTC Streamer Docker Image for ARM64..."
echo "============================================================"

# Build the image
docker build -t rtsp-webrtc-streamer:latest .

echo ""
echo "Build complete!"
echo ""
echo "To run the container:"
echo "  docker-compose up -d"
echo ""
echo "Or manually:"
echo "  docker run -d --name rtsp-webrtc-server -p 3000:3000 -p 8080:8080 -p 9999:9999 -v \$(pwd)/config.json:/app/config.json:ro rtsp-webrtc-streamer:latest"
echo ""
echo "To check logs:"
echo "  docker logs -f rtsp-webrtc-server"
echo ""
