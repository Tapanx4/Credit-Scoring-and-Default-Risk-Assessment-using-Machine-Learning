FROM python:3.10-slim

# 1. Setup System Dependencies
USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 2. Create User 1000 (Required by Hugging Face)
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

# 3. Setup Workspace
WORKDIR /app

# 4. Install Python Deps
# Copy only requirements first to cache this layer
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 5. Copy Application Code
# This copies everything in 'backend/' to '/app/' in the container
COPY --chown=user . .

# 6. Run
# Hugging Face expects port 7860
EXPOSE 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]