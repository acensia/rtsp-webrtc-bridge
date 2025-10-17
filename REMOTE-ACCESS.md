# Remote Access Guide

This guide explains how to access the RTSP to WebRTC streaming server from other devices on your network or the internet.

## Network Binding

The server now **explicitly binds to 0.0.0.0** (all network interfaces), which means it's accessible from:
- ✓ localhost (127.0.0.1)
- ✓ Local network IP (e.g., 192.168.1.x)
- ✓ Public IP (if properly configured)

## Accessing from Local Network

### 1. Find Your Server's IP Address

On your Ubuntu server:
```bash
# Method 1: Using ip command
ip addr show | grep "inet " | grep -v 127.0.0.1

# Method 2: Using hostname command
hostname -I

# Method 3: Check specific interface (e.g., eth0)
ip addr show eth0 | grep "inet "
```

Example output:
```
192.168.1.100
```

### 2. Access from Other Devices

Once you know your server IP (e.g., 192.168.1.100), you can access from:

**Web Browser:**
```
http://192.168.1.100:3000
```

**Mobile Device:**
- Connect to same WiFi network
- Open browser: `http://192.168.1.100:3000`

**Another Computer:**
- Same network
- Browser: `http://192.168.1.100:3000`

### 3. Client Auto-Detection

The web client **automatically detects the server IP** from the URL you use to access it:
- Access via `http://192.168.1.100:3000` → connects to `ws://192.168.1.100:9999`
- Access via `http://localhost:3000` → connects to `ws://localhost:9999`

No configuration needed!

## Ports Used

Make sure these ports are accessible:

| Port | Service | Protocol | Purpose |
|------|---------|----------|---------|
| 3000 | HTTP Server | TCP | Web interface |
| 8080 | WebSocket | TCP | WebRTC signaling |
| 9999 | WebSocket | TCP | RTSP video stream |

## Firewall Configuration

### Ubuntu UFW Firewall

```bash
# Allow ports
sudo ufw allow 3000/tcp comment 'RTSP WebRTC HTTP'
sudo ufw allow 8080/tcp comment 'RTSP WebRTC Signaling'
sudo ufw allow 9999/tcp comment 'RTSP WebRTC Stream'

# Check status
sudo ufw status
```

### Docker Port Mapping

The `docker-compose.yml` already maps these ports:
```yaml
ports:
  - "3000:3000"
  - "8080:8080"
  - "9999:9999"
```

## Testing Remote Access

### From Server (Localhost)
```bash
# HTTP endpoint
curl http://localhost:3000/health

# Test ports are listening
netstat -tlnp | grep -E '3000|8080|9999'
```

### From Remote Device
```bash
# Replace 192.168.1.100 with your server IP
curl http://192.168.1.100:3000/health

# Test connectivity
ping 192.168.1.100

# Test port accessibility
nc -zv 192.168.1.100 3000
nc -zv 192.168.1.100 8080
nc -zv 192.168.1.100 9999
```

## Internet Access (Advanced)

To access from the internet (outside your local network):

### Option 1: Port Forwarding (Home/Small Office)

1. **Configure Router:**
   - Login to your router admin panel
   - Find "Port Forwarding" section
   - Forward external ports to server:
     - External 3000 → Internal 192.168.1.100:3000
     - External 8080 → Internal 192.168.1.100:8080
     - External 9999 → Internal 192.168.1.100:9999

2. **Find Public IP:**
   ```bash
   curl ifconfig.me
   ```

3. **Access:**
   ```
   http://<your-public-ip>:3000
   ```

**Security Warning:** Port forwarding exposes your server to the internet. See security recommendations below.

### Option 2: VPN (Recommended for Security)

Use WireGuard, OpenVPN, or Tailscale:
- Connect remote device to VPN
- Access using internal IP: `http://192.168.1.100:3000`
- More secure than port forwarding

### Option 3: Reverse Proxy with SSL

Use nginx or Caddy with Let's Encrypt:
```nginx
# nginx example
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /ws/ {
        proxy_pass http://localhost:9999;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Troubleshooting Remote Access

### Cannot access from other devices

1. **Check server is listening on 0.0.0.0:**
   ```bash
   # Should show 0.0.0.0:3000, not 127.0.0.1:3000
   netstat -tlnp | grep 3000
   ```

2. **Check firewall:**
   ```bash
   sudo ufw status
   sudo iptables -L -n
   ```

3. **Check Docker network:**
   ```bash
   docker exec rtsp-webrtc-server netstat -tlnp
   ```

4. **Test from server itself:**
   ```bash
   # Using server's LAN IP (not localhost)
   curl http://192.168.1.100:3000/health
   ```

### Connection refused or timeout

1. **Firewall blocking:**
   - Check UFW: `sudo ufw status`
   - Temporarily disable to test: `sudo ufw disable`

2. **Network isolation:**
   - Ensure devices are on same subnet
   - Check router AP isolation settings

3. **Docker network issue:**
   ```bash
   docker network inspect bridge
   ```

### WebSocket connection fails

1. **Browser console shows WebSocket error:**
   - Check if using correct IP
   - Verify port 9999 is accessible
   - Check browser console for exact error

2. **Mixed content error (HTTP/HTTPS):**
   - If accessing via HTTPS, WebSocket must be WSS
   - Use HTTP for testing: `http://ip:3000`

## Security Recommendations

### For Local Network Access
- ✓ Generally safe if network is trusted
- ✓ Keep server updated
- ✓ Use strong WiFi password

### For Internet Access
- ⚠️ **Add authentication** (username/password)
- ⚠️ **Use HTTPS/WSS** with valid SSL certificate
- ⚠️ **Restrict IP ranges** in firewall
- ⚠️ **Use VPN** instead of port forwarding
- ⚠️ **Monitor access logs**
- ⚠️ **Keep Docker images updated**

### Example: IP Whitelist with UFW
```bash
# Only allow specific IP
sudo ufw allow from 203.0.113.10 to any port 3000

# Allow IP range
sudo ufw allow from 203.0.113.0/24 to any port 3000
```

## Performance Considerations

### Local Network
- Low latency (~10-50ms)
- High bandwidth available
- Supports 1080p @ 30fps easily

### Internet Access
- Higher latency (100-500ms+)
- Limited by upload bandwidth
- Consider lowering resolution:
  ```typescript
  // In src/rtspClient.ts
  '-s', '1280x720',  // Instead of 1920x1080
  '-b:v', '1000k',   // Instead of 2000k
  ```

## Monitoring Remote Access

```bash
# View active connections
docker exec rtsp-webrtc-server netstat -an | grep ESTABLISHED

# Monitor bandwidth
iftop -i eth0

# View access logs
docker logs -f rtsp-webrtc-server | grep "client connected"
```

## Quick Reference

| Access Type | URL Format | Example |
|-------------|------------|---------|
| Localhost | `http://localhost:3000` | Same machine |
| LAN | `http://<lan-ip>:3000` | `http://192.168.1.100:3000` |
| Internet | `http://<public-ip>:3000` | `http://203.0.113.10:3000` |
| Domain | `https://<domain>` | `https://stream.example.com` |

## Summary

✅ Server binds to **0.0.0.0** by default
✅ Client **auto-detects** server IP from URL
✅ Works on **local network** out of the box
✅ Configure **firewall** for remote access
✅ Use **VPN or reverse proxy** for secure internet access

For most use cases, **local network access** is sufficient and secure!
