#!/bin/bash

echo "=========================================="
echo "RTSP WebRTC Container Health Check"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if container is running
echo "1. Checking container status..."
if docker ps | grep -q rtsp-webrtc-server; then
    echo -e "${GREEN}✓ Container is running${NC}"
    CONTAINER_ID=$(docker ps | grep rtsp-webrtc-server | awk '{print $1}')
    echo "  Container ID: $CONTAINER_ID"
else
    echo -e "${RED}✗ Container is not running${NC}"
    echo ""
    echo "Start the container with:"
    echo "  docker-compose up -d"
    exit 1
fi
echo ""

# Check container health status
echo "2. Checking container health..."
HEALTH=$(docker inspect --format='{{.State.Health.Status}}' rtsp-webrtc-server 2>/dev/null)
if [ "$HEALTH" == "healthy" ]; then
    echo -e "${GREEN}✓ Container is healthy${NC}"
elif [ "$HEALTH" == "starting" ]; then
    echo -e "${YELLOW}⚠ Container is starting (wait a moment)${NC}"
else
    echo -e "${RED}✗ Container health: $HEALTH${NC}"
fi
echo ""

# Check HTTP server
echo "3. Checking HTTP server (port 3000)..."
if curl -s -f http://localhost:3000/health > /dev/null 2>&1; then
    RESPONSE=$(curl -s http://localhost:3000/health)
    echo -e "${GREEN}✓ HTTP server is responding${NC}"
    echo "  Response: $RESPONSE"
else
    echo -e "${RED}✗ HTTP server is not responding${NC}"
    echo "  Check logs: docker logs rtsp-webrtc-server"
fi
echo ""

# Check WebSocket signaling server
echo "4. Checking WebSocket signaling server (port 8080)..."
if timeout 2 bash -c "echo > /dev/tcp/localhost/8080" 2>/dev/null; then
    echo -e "${GREEN}✓ WebSocket signaling server is listening${NC}"
else
    echo -e "${RED}✗ WebSocket signaling server is not accessible${NC}"
fi
echo ""

# Check RTSP stream WebSocket
echo "5. Checking RTSP stream WebSocket (port 9999)..."
if timeout 2 bash -c "echo > /dev/tcp/localhost/9999" 2>/dev/null; then
    echo -e "${GREEN}✓ RTSP stream WebSocket is listening${NC}"
else
    echo -e "${RED}✗ RTSP stream WebSocket is not accessible${NC}"
fi
echo ""

# Check FFmpeg process
echo "6. Checking FFmpeg process..."
if docker exec rtsp-webrtc-server pgrep ffmpeg > /dev/null 2>&1; then
    echo -e "${GREEN}✓ FFmpeg process is running${NC}"
    FFMPEG_PID=$(docker exec rtsp-webrtc-server pgrep ffmpeg)
    echo "  FFmpeg PID: $FFMPEG_PID"
else
    echo -e "${YELLOW}⚠ FFmpeg process is not running${NC}"
    echo "  This may be normal if RTSP stream failed to start"
    echo "  Check RTSP URL in config.json"
fi
echo ""

# Check resource usage
echo "7. Checking resource usage..."
STATS=$(docker stats --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}" rtsp-webrtc-server | tail -n 1)
echo "  CPU / Memory: $STATS"
echo ""

# Show recent logs
echo "8. Recent container logs (last 15 lines)..."
echo "----------------------------------------"
docker logs --tail 15 rtsp-webrtc-server
echo "----------------------------------------"
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo "Web Interface: http://localhost:3000"
echo "Health Check:  http://localhost:3000/health"
echo ""
echo "To view full logs:"
echo "  docker logs -f rtsp-webrtc-server"
echo ""
echo "To view real-time stats:"
echo "  docker stats rtsp-webrtc-server"
echo ""
echo "To restart container:"
echo "  docker-compose restart"
echo ""
