// require("@nomiclabs/hardhat-waffle");
// require("@nomiclabs/hardhat-etherscan");
// require("dotenv").config();

// module.exports = {
//   solidity: "0.8.4",
//   paths: {
//     artifacts: "./app/src/artifacts",
//   },
//   networks: {
//   rinkeby: {
//     url: process.env.RINKEBY_URL,
//     accounts: [process.env.PRIVATE_KEY]
//   }
//   },
//   etherscan: {
//     apiKey: process.env.ETHERSCAN_KEY
//   }
// };


require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

module.exports = {
  solidity: "0.8.4",
  paths: {
    artifacts: "./app/src/artifacts",
  },  
  networks: {
    rinkeby: {
      url: process.env.RINKEBY_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_KEY
  }
};



