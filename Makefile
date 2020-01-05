prepare:
	./bin/bootstrap.sh

prepareMinimal:
	./bin/bootstrap_minimal.sh

destroy:
	docker-compose down -v

contract:
	docker-compose exec blockchain_cli sh deploy_contracts.sh

start:
	docker-compose up -d app db blockchain

startMinimal:
	docker-compose up -d db blockchain

stop:
	docker-compose stop
