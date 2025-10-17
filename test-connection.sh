#!/bin/bash

echo "RTSP Connection Tester"
echo "======================"
echo ""

# Check if config.json exists
if [ ! -f config.json ]; then
    echo "Error: config.json not found!"
    exit 1
fi

# Extract RTSP URL from config.json
RTSP_URL=$(grep -o '"url"[[:space:]]*:[[:space:]]*"[^"]*"' config.json | cut -d'"' -f4)

if [ -z "$RTSP_URL" ]; then
    echo "Error: Could not extract RTSP URL from config.json"
    exit 1
fi

echo "Testing RTSP URL: $RTSP_URL"
echo ""

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is not installed"
    echo "Please install ffmpeg:"
    echo "  Ubuntu/Debian: sudo apt-get install ffmpeg"
    echo "  macOS: brew install ffmpeg"
    exit 1
fi

echo "FFmpeg version:"
ffmpeg -version | head -n 1
echo ""

echo "Testing RTSP connection (this may take a few seconds)..."
echo ""

# Test RTSP connection by grabbing 1 frame
timeout 10 ffmpeg -rtsp_transport tcp -i "$RTSP_URL" -frames:v 1 -f null - 2>&1 | tail -n 20

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    echo "✓ SUCCESS: RTSP connection is working!"
    echo ""
    echo "You can now build and run the Docker container:"
    echo "  ./build-docker.sh"
    echo "  docker-compose up -d"
else
    echo ""
    echo "✗ FAILED: Could not connect to RTSP stream"
    echo ""
    echo "Troubleshooting tips:"
    echo "1. Check if the camera IP is correct and reachable"
    echo "2. Verify RTSP port (usually 554)"
    echo "3. Check username/password if required"
    echo "4. Try pinging the camera: ping <camera-ip>"
    echo "5. Check if camera supports RTSP protocol"
fi
