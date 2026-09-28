.PHONY: setup dev lint format deploy

setup:
	npm install
	cd frontend && npm install

dev:
	@echo "Starting API (wrangler pages dev) and frontend (Vite)..."
	@trap 'kill 0' SIGINT; \
	npx wrangler pages dev --port 3000 & \
	cd frontend && npm run dev

lint:
	npm run lint
	cd frontend && npm run lint

format:
	npm run format
	cd frontend && npm run format

deploy:
	npm run deploy
