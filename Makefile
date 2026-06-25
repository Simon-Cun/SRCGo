.PHONY: setup dev lint format

setup:
	npm install
	cd backend && npm install
	cd frontend && npm install

dev:
	@echo "Starting backend (Express + tsx watch) and frontend (Vite)..."
	@trap 'kill 0' SIGINT; \
	cd backend && npx tsx watch server.ts & \
	cd frontend && npm run dev

lint:
	npm run lint
	cd frontend && npm run lint
	cd backend && npm run lint

format:
	npm run format
	cd frontend && npm run format
	cd backend && npm run format
