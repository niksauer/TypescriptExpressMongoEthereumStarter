const Web3 = require("web3");

const deployerAddress = "0x41c1c3d1f21a46ab84e4535167044676c30875be";

module.exports = {
    // Uncommenting the defaults below 
    // provides for an easier quick-start with Ganache.
    // You can also follow this format for other networks;
    // see <http://truffleframework.com/docs/advanced/configuration>
    // for more details on how to specify configuration options!

    networks: {
        local: {
            host: "blockchain",
            port: 8545,
            network_id: "*",
            from: deployerAddress
        },
    },
    compilers: {
        solc: {
            version: "^0.5.2"
        }
    }
};