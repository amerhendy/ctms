FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/db/data /app/uploads/reports /app/assets/fonts

ENV PYTHONUNBUFFERED=1
ENV HOST=0.0.0.0
ENV PORT=5051

EXPOSE 5051

CMD ["python", "main.py"]
