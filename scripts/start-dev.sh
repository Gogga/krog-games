#!/bin/bash

# KROG Chess - Safe Development Startup Script
# Prevents zombie processes by cleaning up before starting

echo "🧹 Cleaning up old processes..."
pkill -9 node 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 2

echo "🚀 Starting servers..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Start server
cd "$PROJECT_DIR/server" && npm run dev &
SERVER_PID=$!
sleep 3

# Start client
cd "$PROJECT_DIR/client" && npm run dev &
CLIENT_PID=$!

echo ""
echo "✅ Servers started!"
echo "   Server: http://localhost:3000 (PID: $SERVER_PID)"
echo "   Client: http://localhost:5173 (PID: $CLIENT_PID)"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait
