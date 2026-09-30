.PHONY: help install test-backend test-ml run-backend run-dashboard docker-up docker-down

help:
	@echo "Available commands:"
	@echo "  make install        - Install python dependencies & npm packages"
	@echo "  make test-ml        - Run ML golden parity tests"
	@echo "  make test-backend   - Run backend integration tests"
	@echo "  make run-backend    - Start FastAPI server on port 8000"
	@echo "  make run-dashboard  - Start React dashboard on port 5173"
	@echo "  make docker-up      - Run backend and dashboard via docker-compose"
	@echo "  make docker-down    - Stop docker-compose services"

install:
	pip install -r backend/requirements.txt
	cd dashboard && npm install

test-ml:
	python ml/golden_tests/run_parity_tests.py

test-backend:
	python -m pytest backend/tests/test_api.py -v

run-backend:
	uvicorn backend.app.main:app --reload --port 8000

run-dashboard:
	cd dashboard && npm run dev

docker-up:
	docker-compose up -d --build

docker-down:
	docker-compose down
