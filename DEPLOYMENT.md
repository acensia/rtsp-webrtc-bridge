# Deployment Guide for Ubuntu 20.04 ARM64

This guide will help you deploy the RTSP to WebRTC streaming server on Ubuntu 20.04 ARM64.

## Prerequisites

1. Docker installed on your system:
   ```bash
   # Update system
   sudo apt-get update
   sudo apt-get upgrade -y

   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh

   # Add your user to docker group
   sudo usermod -aG docker $USER

   # Log out and log back in for group changes to take effect
   ```

2. Docker Compose installed:
   ```bash
   sudo apt-get install docker-compose -y
   ```

3. Verify installation:
   ```bash
   docker --version
   docker-compose --version
   ```

## Configuration

1. Edit `config.json` and set your RTSP camera URL:
   ```json
   {
     "rtsp": {
       "url": "rtsp://192.168.1.120:554/test",
       "username": "",
       "password": ""
     },
     "server": {
       "port": 3000,
       "wsPort": 8080
     }
   }
   ```

   **Common RTSP URL formats:**
   - Generic: `rtsp://ip:port/path`
   - Hikvision: `rtsp://username:password@ip:554/Streaming/Channels/101`
   - Dahua: `rtsp://username:password@ip:554/cam/realmonitor?channel=1&subtype=0`
   - ONVIF: `rtsp://username:password@ip:554/onvif1`

## Build and Deploy

### Option 1: Using the build script (Recommended)

```bash
# Make script executable
chmod +x build-docker.sh

# Build the image
./build-docker.sh

# Start the container
docker-compose up -d
```

### Option 2: Manual build and run

```bash
# Build the Docker image
docker build -t rtsp-webrtc-streamer:latest .

# Run using Docker Compose
docker-compose up -d

# Or run manually
docker run -d \
  --name rtsp-webrtc-server \
  -p 3000:3000 \
  -p 8080:8080 \
  -p 9999:9999 \
  -v $(pwd)/config.json:/app/config.json:ro \
  rtsp-webrtc-streamer:latest
```

## Verification

1. Check container status:
   ```bash
   docker ps
   ```

2. View logs:
   ```bash
   docker-compose logs -f
   # or
   docker logs -f rtsp-webrtc-server
   ```

3. Check health:
   ```bash
   curl http://localhost:3000/health
   ```
   Should return: `{"status":"ok","message":"Server is running"}`

4. Access the web interface:
   - Open browser: `http://your-server-ip:3000`
   - Click "Start Stream" button

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs

# Check if ports are in use
sudo netstat -tlnp | grep -E '3000|8080|9999'
```

### FFmpeg errors
```bash
# Check if FFmpeg is installed in container
docker exec rtsp-webrtc-server ffmpeg -version

# Test RTSP connection manually
docker exec rtsp-webrtc-server ffmpeg -rtsp_transport tcp -i rtsp://your-camera-url -frames:v 1 -f null -
```

### RTSP stream not connecting
1. Verify RTSP URL is correct
2. Check camera is accessible from the server:
   ```bash
   # From host machine
   ping your-camera-ip

   # Test RTSP with FFmpeg
   ffmpeg -rtsp_transport tcp -i rtsp://your-camera-url -frames:v 1 -f null -
   ```

3. Check firewall settings:
   ```bash
   # Allow Docker ports
   sudo ufw allow 3000/tcp
   sudo ufw allow 8080/tcp
   sudo ufw allow 9999/tcp
   ```

### Video not playing in browser
1. Check browser console for errors (F12)
2. Verify WebSocket connections are established
3. Try different browser (Chrome/Firefox/Edge)
4. Check if JSMpeg library is loaded

### High latency or buffering
1. Lower the resolution in `src/rtspClient.ts`:
   ```typescript
   '-s', '1280x720',  // Change from 1920x1080
   ```

2. Reduce bitrate:
   ```typescript
   '-b:v', '1000k',  // Change from 2000k
   ```

3. Rebuild after changes:
   ```bash
   docker-compose down
   docker-compose build
   docker-compose up -d
   ```

## Maintenance

### Update configuration
```bash
# Edit config.json
nano config.json

# Restart container
docker-compose restart
```

### View resource usage
```bash
docker stats rtsp-webrtc-server
```

### Stop and remove
```bash
# Stop container
docker-compose down

# Remove image
docker rmi rtsp-webrtc-streamer:latest
```

### Cleanup logs
```bash
# Docker logs are managed by the logging configuration in docker-compose.yml
# Max 3 files of 10MB each

# To manually clean all Docker logs
docker system prune -a
```

## Production Recommendations

1. **Use HTTPS**: Add reverse proxy (nginx) with SSL certificate
2. **Authentication**: Implement user authentication
3. **Monitoring**: Set up monitoring (Prometheus + Grafana)
4. **Backup**: Backup configuration files regularly
5. **Updates**: Keep Docker and base images updated
6. **Resource Limits**: Add resource limits in docker-compose.yml:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '2'
         memory: 2G
   ```

## Performance Tuning for ARM64

1. **CPU Affinity**: Pin Docker to specific cores
   ```bash
   docker run --cpuset-cpus="0-3" ...
   ```

2. **Memory Limits**: Set appropriate memory limits
   ```bash
   docker run --memory="1g" --memory-swap="2g" ...
   ```

3. **FFmpeg Optimization**: For ARM64, use hardware acceleration if available
   ```typescript
   // In rtspClient.ts, add hardware encoding flags
   '-hwaccel', 'auto',
   ```

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify FFmpeg version and RTSP URL
3. Test camera stream with standalone FFmpeg first
4. Check GitHub issues or create a new one
