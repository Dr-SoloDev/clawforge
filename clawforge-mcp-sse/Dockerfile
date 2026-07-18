FROM node:20-slim

RUN apt-get update && apt-get install -y \
  python3 \
  python3-pip \
  ffmpeg \
  curl \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libgbm1 \
  libglib2.0-0 \
  libnspr4 \
  libnss3 \
  libu2f-udev \
  libvulkan1 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxkbcommon0 \
  libxrandr2 \
  xdg-utils \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

RUN pip3 install edge-tts --no-cache-dir --break-system-packages

WORKDIR /app

COPY package*.json ./
COPY clawforge-mcp-sse/package*.json ./clawforge-mcp-sse/
RUN npm install

COPY bin/ ./bin/
COPY src/ ./src/
COPY clawforge-mcp-sse/ ./clawforge-mcp-sse/

RUN npx playwright install chromium --with-deps

RUN addgroup --system --gid 1001 clawforge \
  && adduser --system --uid 1001 --ingroup clawforge --home /app clawforge \
  && chown -R clawforge:clawforge /app
USER clawforge

EXPOSE 3100

ENV NODE_ENV=production
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -sf http://127.0.0.1:3100/health || exit 1

CMD ["node", "clawforge-mcp-sse/index.js"]