# Makefile — atalhos para o ambiente Docker local
# Uso: make up | make down | make logs | make reset

.PHONY: up down logs ps deploy reset shell-backend health

up:        ## sobe todo o ambiente (rebuild)
	docker compose up -d --build

down:      ## derruba (mantém volumes)
	docker compose down

reset:     ## derruba e apaga volumes (blockchain do zero)
	docker compose down -v

logs:      ## logs do backend ao vivo
	docker compose logs -f backend

ps:        ## status dos serviços
	docker compose ps

deploy:    ## re-deploya os contratos no nó já no ar
	docker compose run --rm deployer

shell-backend: ## shell dentro do backend
	docker compose exec backend sh

health:    ## checa saúde dos serviços
	@echo "== blockchain ==" && curl -s -X POST http://localhost:8545 \
	  -H "Content-Type: application/json" \
	  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' || true
	@echo "\n== backend ==" && curl -s http://localhost:3001/health || true
	@echo "\n== contratos ==" && curl -s http://localhost:3001/contracts || true
