FROM node:20-slim

# Install ffmpeg, Python, and edge-tts dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    python3-venv \
    chromium \
    chromium-driver \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install edge-tts
RUN pip3 install --no-cache-dir edge-tts

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install Node dependencies
RUN npm install

# Install Playwright browsers (chromium only)
RUN npx playwright install chromium

# Copy source code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 clawforge && \
    chown -R clawforge:clawforge /app
USER clawforge

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD node bin/clawforge.js check-deps || exit 1

# Default: show help
CMD ["node", "bin/clawforge.js", "--help"]
