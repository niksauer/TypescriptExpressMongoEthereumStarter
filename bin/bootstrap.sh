#!/bin/bash
set -ueo pipefail

PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." > /dev/null && pwd )"

promptyn () {
    while true; do
        read -rp "$1 " yn
        case $yn in
            [Yy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Please answer yes or no.";;
        esac
    done
}

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

if promptyn "Did you forget to bootstrap the blockchain? [y/n] >"; then
    $PROJECT_ROOT/bin/bootstrap_blockchain.sh
    abort "Aborting to wait for docker-compose.yaml changes, please call script again."
fi

header "[ Building Containers ]"
docker-compose build app db blockchain

header "[ Starting Services ]"
docker-compose up -d app db blockchain 

header "[ Status ]"
echo "The following containers are now running:"
echo
docker-compose ps

echo
header "Setup complete!"
echo
echo "Perform future management tasks with docker-compose:"
echo "  $ docker-compose help"
echo
echo "View logs with docker-compose logs:"
echo "  $ docker-compose logs -f"
echo
if promptyn "Attach to logs now? [y/n] >"; then
    docker-compose logs -f
fi