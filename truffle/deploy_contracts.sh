#!/bin/bash
set -ueo pipefail

npm install
truffle migrate --reset --network local