require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()
require("@nomiclabs/hardhat-ethers")

const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || ""

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL

const PRIVATE_KEY = process.env.PRIVATE_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            forking: {
                url: MAINNET_RPC_URL,
            },
        },
        localhost: {
            chainId: 31337,
        },
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 11155111,
            // blockConfirmations: 9, //how many blocks we want to wait
            //zasto bas 9? zelimo dat ethscanu sansu da indexira nasu transakciju
        },
    },
    // solidity: "0.8.7",
    solidity: {
        compilers: [
            { version: "0.8.7" },
            { version: "0.6.0" },
            { version: "0.6.6" },
            { version: "0.4.19" },
            { version: "0.8.0" },
        ],
    },

    namedAccounts: {
        deployer: {
            default: 0,
        },
        player: {
            default: 1,
        },
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    gasReporter: {
        enabled: true,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        // coinmarketcap: COINMARKETCAP_API_KEY,
        // token: "ETH",
    },
    mocha: {
        timeout: 500000, // 200 seconds max
    },
}
