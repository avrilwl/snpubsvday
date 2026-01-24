# Use official Python runtime as base image
FROM python:3.11-slim

# Set working directory in container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file (if exists, otherwise install dependencies directly)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose port (Cloud Run uses PORT env variable, defaults to 8080)
EXPOSE 8080

# Set environment to production
ENV FLASK_ENV=production
ENV PORT=8080

# Start the application
CMD exec gunicorn --bind :$PORT --workers 1 --timeout 0 server:app
