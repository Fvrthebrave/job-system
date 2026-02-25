# Distributed Job Processing System

A containerized asynchronous job processing system built with:

- Node.js
- TypeScript
- Express
- Redis
- PostgreSQL
- Docker

## Architecture

Client → API → Postgres (persist job) → Redis (queue) → Worker → Postgres (update status)

## Features

- REST API for job creation
- Redis-backed blocking queue
- Worker service with BRPOP consumption
- Postgres-backed job state tracking
- Enum-based job status
- Fully containerized with Docker Compose

## Running Locally

```bash
docker compose up --build

API runs on: http://localhost:3000

To create a job:
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{"type":"email","payload":{"to":"test@test.com"}}'