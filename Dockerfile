# syntax=docker/dockerfile:1
FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# system deps that help wheels install quickly, then clean
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential git && \
    rm -rf /var/lib/apt/lists/*

# install python deps (no cache -> smaller layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy only app code and KB
COPY app.py /app/app.py
COPY data /app/data

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
