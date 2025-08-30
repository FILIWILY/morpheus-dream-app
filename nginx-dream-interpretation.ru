# =================================================================
# Nginx Configuration for Morpheus Dream App (dream-interpretation.ru)
# =================================================================

# HTTP Server - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name dream-interpretation.ru www.dream-interpretation.ru;

    # Redirect all HTTP requests to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server - Main Application
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dream-interpretation.ru www.dream-interpretation.ru;

    # SSL Certificate Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/dream-interpretation.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dream-interpretation.ru/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Content Security Policy for Telegram Web App
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://telegram.org https://maps.googleapis.com 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'self' https://web.telegram.org;" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Main Application Proxy
    location / {
        # Proxy to Docker frontend container
        proxy_pass http://127.0.0.1:8080;
        
        # Proxy Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Proxy Timeouts
        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer Settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        
        # Error Handling
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
        proxy_next_upstream_tries 2;
        proxy_next_upstream_timeout 5s;
    }

    # API Proxy (explicit routing for better control)
    location /api/ {
        # Proxy to Docker backend container
        proxy_pass http://127.0.0.1:9000/;
        
        # Proxy Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # API Specific Timeouts
        proxy_connect_timeout 5s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # Disable buffering for API responses
        proxy_buffering off;
    }

    # Static Assets Caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        
        # Cache static assets
        expires 1y;
        add_header Cache-Control "public, immutable";
        
        # Compression for static assets
        gzip_static on;
    }

    # Security: Block suspicious requests
    location ~* /(wp-admin|wp-content|wp-includes|wordpress|admin|phpmyadmin|mysql|sql) {
        return 444;
    }

    # Security: Block common exploit attempts
    location ~* \.(php|asp|aspx|jsp|cgi)$ {
        return 444;
    }

    # Health Check Endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Error Pages
    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /var/www/html;
        internal;
    }

    # Logging
    access_log /var/log/nginx/dream-interpretation.ru.access.log;
    error_log /var/log/nginx/dream-interpretation.ru.error.log warn;
}
