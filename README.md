# Rock Paper Scissors

This project is a secure Rock Paper Scissors game.

## How to play?

THE GAME ONLY WORKS ON RINKEBY WITH THE CURRENT DEPLOY

You need to install metamask and have some Rinkeby ether to play.
Each player should use a different EOA. 
You can get some from here:
https://faucet.rinkeby.io/

The game has three phases:

- Play
- Reveal
- Collect

### Play

The player has to pick a move between rock, paper and scissors, a password for hashing the move in the blockchain and then click Play. Once one player has played, a time limit of ten minutes is set. A second player should play before the time limit is reached.

### Reveal

Once the second player has played the time limit is reset to ten minutes, each player has to reveal. They need to provide the password, the move they picked and click Reveal. After one player reveals the time limit is again reset to 10 minutes.

### Collect

Once both players have reveal (or the time limit has been reached), anyone can click on Collet Bets. The game will transfer the bets to the winner, in case of a draw, each one will recieve its bet.

The smart contract is already deployed and verified on rinkeby:
https://rinkeby.etherscan.io/address/0xBF01B9eC81A1a4E43A55C1B54766D7e9e8c62264


## Smart contract - Hardhat

To build the app you have to install the dependencies in the root folder:

```shell
npm install
```

To test the smart contract run:

```shell
npx hardhat test
```

## Frontend- React

Go to the app folder and run:

```shell
npm install
```

```shell
npm start
```

##some clarifications

The game only accepts only ETH, to make it ERC20 compatible you should make a few changes, some of them are:
-You would have to set a new variable to specify the address of the erc020 that you are using for a particular game.
-You wold have to create/import an ERC20 interface
-Each time that you want to send a bet you should first approve the amount in the particular ERC20.
-You should modify the minimum bet, if you want to have a minimum token value equivalent to the ETH specified you would need to use some price feed oracle
