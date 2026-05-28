# ==========================================
# STAGE 1: BUILD DEPENDENCIES
# ==========================================
FROM python:3.12-slim AS builder

WORKDIR /build

# Install compiler utilities for psycopg2 compiling
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements to leverage Docker layer cache
COPY requirements.txt .

# Compile requirements into wheels
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /build/wheels -r requirements.txt

# ==========================================
# STAGE 2: FINAL COMPLIANT RUNTIME
# ==========================================
FROM python:3.12-slim

WORKDIR /app

# Install runtime PostgreSQL client library
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy wheels from builder stage
COPY --from=builder /build/wheels /wheels
COPY --from=builder /build/requirements.txt .

# Install dependencies from compiled wheels
RUN pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.txt \
    && rm -rf /wheels requirements.txt

# Copy backend application source files
COPY . .

# Setup Rotating audit logs directory
RUN mkdir -p logs && chmod -R 777 logs

# Create secure non-root deployment user for government portal compliance
RUN useradd -u 1001 nhrsuser && chown -R nhrsuser:nhrsuser /app
USER nhrsuser

# Expose backend REST port
EXPOSE 8000

# Start production server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
