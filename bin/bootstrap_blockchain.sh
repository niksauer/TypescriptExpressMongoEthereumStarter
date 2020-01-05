#!/bin/bash
set -ueo pipefail

PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." > /dev/null && pwd )"

abort() {
    tput setaf 1
    echo "$1"
    tput sgr0
    exit 1
}

header() {
    echo
    tput setaf 5
    echo "$1"
    tput sgr0
}

cd "$PROJECT_ROOT"

# Test that user has the docker tools installed.
pgrep -f docker > /dev/null \
    || abort "The docker daemon is not running. Please start it and try again."
command -v docker-compose > /dev/null \
    || abort "Could not find 'docker-compose'. Please install docker and try again."

header "[ Building Blockchain CLI Container ]"
docker-compose build blockchain blockchain_cli

header "[ Starting Blockchain Services ]"
docker-compose up -d blockchain blockchain_cli

header "[ Running Contract Deployment ]"
make contract

echo "Please update docker-compose.yaml or local environment with contract address seen above (2_deploy_contract.js -> 'CONTRACT_NAME' -> contract address)"

docker-compose stop