FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy both backend (for models/services) and worker code
COPY backend /app/backend
COPY worker /app/worker

# Set pythonpath so it can find backend module
ENV PYTHONPATH=/app/backend

CMD ["python", "worker/main.py"]
