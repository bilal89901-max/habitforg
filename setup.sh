#!/bin/bash

echo "🚀 HabitForge Setup Script"
echo "=========================="
echo ""

echo "📦 Step 1: Installing frontend dependencies..."
npm install

echo ""
echo "📦 Step 2: Installing backend dependencies..."
cd backend
npm install
cd ..

echo ""
echo "🐳 Step 3: Starting PostgreSQL with Docker..."
if ! docker-compose up -d; then
  echo "⚠️  Docker Compose failed. Please make sure Docker is installed and running."
  echo "   You can install PostgreSQL manually instead."
  echo ""
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

echo ""
echo "🗄️  Step 4: Running database migrations..."
cd backend
npm run migrate

echo ""
echo "🌱 Step 5: Seeding database with initial data..."
npm run seed

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎮 Next steps:"
echo "   1. Start the backend:  cd backend && npm run dev"
echo "   2. Start the frontend: npm run dev"
echo "   3. Visit http://localhost:3000"
echo ""
echo "Happy habit building! ⚔️"
