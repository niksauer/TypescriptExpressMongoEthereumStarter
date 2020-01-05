const deployerAddress = "0x41c1c3d1f21a46ab84e4535167044676c30875be";

module.exports = {
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