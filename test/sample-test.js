const { expect, assert } = require("chai");
const { parseEther, soliditySha256 } = require("ethers/lib/utils");
const { ethers } = require("hardhat");

async function  revertEVM(snapshot) {
  const result= await network.provider.request({
    method: 'evm_revert',
    params: [snapshot],
  });
  const newSnapshot = await network.provider.request({
    method: 'evm_snapshot',
    params: [],
  });

  return newSnapshot
}

async function  increaseTime(time) {
  const result= await network.provider.request({
    method: 'evm_increaseTime',
    params: [time],
  });
}

describe("RockPaperScissors", function () {
  let wallet1, wallet2, wallet3;
  let RockPaperScissors, rockPaperScissors, snapshot;
  const None = 0; 
  const Rock = 1;
  const Paper = 2;
  const Scissors= 3;
  const Player1wins = 1; 
  const Player2wins = 2; 
  const Draw = 3; 
  const salt1 = "perros";
  const salt2 = "gatos";
  before(async () => {
    [wallet1, wallet2, wallet3] = await ethers.getSigners();
    RockPaperScissors = await ethers.getContractFactory("RockPaperScissors");
    rockPaperScissors = await RockPaperScissors.deploy();
    await rockPaperScissors.deployed();


    snapshot = await network.provider.request({
      method: 'evm_snapshot',
      params: [],
    });
  });

  describe("Play", function () {
    beforeEach(async function() {
      snapshot = await revertEVM(snapshot)
    })  
    it("Should revert if the move is incorrect", async function () {
      await expect(rockPaperScissors.play(13,salt1,{value: parseEther('0.001')})).to.be.reverted
    });
    it("Should revert if the bet is lower than the min bet", async function () {
      await expect(rockPaperScissors.play(Rock,salt1,{value: parseEther('0.001')})).to.be.revertedWith("Must provide a minimun Bet");
    });

    it("Should not allow same user to play twice", async function () {
      await rockPaperScissors.play(Rock,salt1,{value: parseEther('0.01')})
      await expect(rockPaperScissors.play(Scissors,salt1,{value: parseEther('0.01')})).to.be.revertedWith("You can't play against yourself")
    });

    it("Should revert if the bet is lower than the first player's bet", async function () {
      await rockPaperScissors.play(Rock,salt1,{value: parseEther('0.02')})
      await expect(rockPaperScissors.connect(wallet2).play(Rock,salt1,{value: parseEther('0.01')})).to.be.revertedWith("Must provide a bet at least equal to player's 1")
    });

    it("Should not allow players to play on an expired game", async function () {
      await rockPaperScissors.play(Rock,salt1,{value: parseEther('0.01')})
      increaseTime(601)
      await expect(rockPaperScissors.connect(wallet2).play(Rock,salt1,{value: parseEther('0.01')})).to.be.revertedWith("Game expired")
    });

    it("Should not allow other players to play on an started game", async function () {
      await rockPaperScissors.play(Rock,salt1,{value: parseEther('0.01')})
      await rockPaperScissors.connect(wallet2).play(Rock,salt2,{value: parseEther('0.01')})
      await expect(rockPaperScissors.connect( wallet3).play(Rock,salt1,{value: parseEther('0.01')})).to.be.revertedWith("Game in progress")
    });


    it("Should accept a valid move and a valid bet", async function () {
      await rockPaperScissors.play(Rock,salt1,{value: parseEther('0.01')});
      assert.equal(await rockPaperScissors.playersAddress(0), wallet1.address);
      const bet = await rockPaperScissors.playersBet(0);
      assert.equal(bet.toString(), parseEther('0.01').toString());
      const hash = await rockPaperScissors.playersMoveHash(0);
      const recreatedHash = soliditySha256(['string','uint8' ],[salt1,Rock]);
      assert.equal(hash, recreatedHash)

      // assert.equal(await rockPaperScissors.playersAddress(0), wallet1.address)
    });

    it("Should update the time limit", async function () {
      await rockPaperScissors.play(Rock,salt1,{value: parseEther('0.01')});
      const timeLimit = await rockPaperScissors.timeLimit();
      assert.isAbove(timeLimit.toNumber(), 0)
    });

    it("Should accept a valid move and a valid bet for a player2", async function () {
      await rockPaperScissors.play(Rock,salt1,{value: parseEther('0.01')});
      await rockPaperScissors.connect(wallet2).play(Scissors,salt2,{value: parseEther('0.01')});
      assert.equal(await rockPaperScissors.playersAddress(1), wallet2.address);
      const bet = await rockPaperScissors.playersBet(1);
      assert.equal(bet.toString(), parseEther('0.01').toString());
      const hash = await rockPaperScissors.playersMoveHash(1);
      const recreatedHash = soliditySha256(['string','uint8' ],[salt2,Scissors]);
      assert.equal(hash, recreatedHash)

      // assert.equal(await rockPaperScissors.playersAddress(0), wallet1.address)
    });

    it("Should update the time limit again", async function () {
      await rockPaperScissors.play(Rock,salt1,{value: parseEther('0.01')});
      const timeLimit = await rockPaperScissors.timeLimit();
      await rockPaperScissors.connect(wallet2).play(Scissors,salt2,{value: parseEther('0.01')});
      const timeLimit2 = await rockPaperScissors.timeLimit();
      assert.isAbove(timeLimit2.toNumber(),timeLimit.toNumber())
    });

    it("Should change the game status to CommitReveal", async function () {
      await rockPaperScissors.play(Rock,salt1,{value: parseEther('0.01')});
      await rockPaperScissors.connect(wallet2).play(Scissors,salt2,{value: parseEther('0.01')});
      const gameStatus = await rockPaperScissors.gameStatus();
      assert.equal(gameStatus,1)
    });

    it("Should be reverted when the game status is CommitReveal", async function () {
      await rockPaperScissors.play(Rock,salt1,{value: parseEther('0.01')});
      await rockPaperScissors.connect(wallet2).play(Scissors,salt2,{value: parseEther('0.01')});
      await expect(rockPaperScissors.connect( wallet3).play(Rock,salt1,{value: parseEther('0.01')})).to.be.revertedWith("Game in progress")
    });
  });

  describe("CommitReveal", function () {

    it("Should not allow players to commit reveal until both player have played", async function () {
      snapshot = await revertEVM(snapshot)
      await expect(rockPaperScissors.commitReveal(Rock,salt1)).to.be.revertedWith("Not ready for commit reveal")
    });

    it("Should declare Rock winner against Scissors", async function () {
      snapshot = await revertEVM(snapshot)
      await rockPaperScissors.play(Rock,salt1,{value: parseEther('0.01')});
      await rockPaperScissors.connect(wallet2).play(Scissors,salt2,{value: parseEther('0.01')});
      await rockPaperScissors.commitReveal(Rock,salt1);
      await rockPaperScissors.connect(wallet2).commitReveal(Scissors,salt2);
      const result = await rockPaperScissors.result();
      assert.equal(result,Player1wins)
    });

    it("Should declare Scissors winner against Paper", async function () {
      snapshot = await revertEVM(snapshot)
      await rockPaperScissors.play(Scissors,salt1,{value: parseEther('0.01')});
      await rockPaperScissors.connect(wallet2).play(Paper,salt2,{value: parseEther('0.01')});
      await rockPaperScissors.commitReveal(Scissors,salt1);
      await rockPaperScissors.connect(wallet2).commitReveal(Paper,salt2);
      const result = await rockPaperScissors.result();
      assert.equal(result,Player1wins)
    });

    it("Should declare Paper winner against Rock", async function () {
      snapshot = await revertEVM(snapshot)
      await rockPaperScissors.play(Rock,salt1,{value: parseEther('0.01')});
      await rockPaperScissors.connect(wallet2).play(Paper,salt2,{value: parseEther('0.01')});
      await rockPaperScissors.commitReveal(Rock,salt1);
      await rockPaperScissors.connect(wallet2).commitReveal(Paper,salt2);
      const result = await rockPaperScissors.result();
      assert.equal(result,Player2wins)
    });

    it("Should declare Draw when both players play the same move", async function () {
      snapshot = await revertEVM(snapshot)
      await rockPaperScissors.play(Rock,salt1,{value: parseEther('0.01')});
      await rockPaperScissors.connect(wallet2).play(Rock,salt2,{value: parseEther('0.01')});
      await rockPaperScissors.commitReveal(Rock,salt1);
      await rockPaperScissors.connect(wallet2).commitReveal(Rock,salt2);
      const result = await rockPaperScissors.result();
      assert.equal(result,Draw)
    });

    beforeEach(async function() {
      snapshot = await revertEVM(snapshot)
      await rockPaperScissors.play(Rock,salt1,{value: parseEther('0.01')});
      await rockPaperScissors.connect(wallet2).play(Scissors,salt2,{value: parseEther('0.01')});      
    }) 

    it("Should not allow a third player to commit reveal", async function () {

      await expect(rockPaperScissors.connect(wallet3).commitReveal(Rock,salt1)).to.be.revertedWith("You have to be one of the players")
    });

    it("Should not allow players to commit reveal on an expired game", async function () {
      increaseTime(601)
      await expect(rockPaperScissors.commitReveal(Rock,salt1)).to.be.revertedWith("Game expired")
    });
   
    it("Should not allow players to reveal more than once", async function () {
      rockPaperScissors.commitReveal(Rock,salt1)
      await expect(rockPaperScissors.commitReveal(Rock,salt1)).to.be.revertedWith("You've already revealed")
    });
   
    it("Should not allow players to reveal with a different password", async function () {
      await expect(rockPaperScissors.commitReveal(Rock,salt2)).to.be.revertedWith("Bad commit reveal")
    });

    it("Should not allow players to reveal with a different move", async function () {
      await expect(rockPaperScissors.commitReveal(Rock,salt2)).to.be.revertedWith("Bad commit reveal")
    });

    it("Should update the time limit again", async function () {
      const timeLimit = await rockPaperScissors.timeLimit();
      await rockPaperScissors.connect(wallet2).commitReveal(Scissors,salt2);
      const timeLimit2 = await rockPaperScissors.timeLimit();
      assert.isAbove(timeLimit2.toNumber(),timeLimit.toNumber())
    });

    it("Should update player's move when calls commitReveal successfully", async function () {
      await rockPaperScissors.commitReveal(Rock,salt1);
      const move = await rockPaperScissors.playersMove(0);
      assert.equal(move,1)
    });

    it("Should update player2's move when calls commitReveal successfully", async function () {
      await rockPaperScissors.commitReveal(Rock,salt1);
      await rockPaperScissors.connect(wallet2).commitReveal(Scissors,salt2)
      const move = await rockPaperScissors.playersMove(1);
      assert.equal(move,3)
    });

    it("Should emmit an event when both players reveal", async function () {
      await rockPaperScissors.commitReveal(Rock,salt1);
      await expect(rockPaperScissors.connect(wallet2).commitReveal(Scissors,salt2))
      .to.emit(rockPaperScissors, "GameFinished")
      .withArgs("Player1 wins",wallet1.address )
    });

    it("Should change the game status to finished", async function () {
      await rockPaperScissors.commitReveal(Rock,salt1);
      await rockPaperScissors.connect(wallet2).commitReveal(Scissors,salt2)
      const gameStatus = await rockPaperScissors.gameStatus();
      assert.equal(gameStatus,2)
    });

  });

  describe("CollectBets", function () {
    beforeEach(async function() {
      snapshot = await revertEVM(snapshot)
    })  

    it("Should revert if the game is not finished nor expired", async function () {
      await expect(rockPaperScissors.collectBets()).to.be.revertedWith("Game not finished")
    });
    
    it("Should allow to collect bet if the game is finished", async function () {
      await rockPaperScissors.play(Rock,salt1,{value: parseEther('100')});
      await rockPaperScissors.connect(wallet2).play(Paper,salt2,{value: parseEther('100')});
      await rockPaperScissors.commitReveal(Rock,salt1);
      await rockPaperScissors.connect(wallet2).commitReveal(Paper,salt2);
      const balanceBefore = await ethers.provider.getBalance(wallet2.address)
      await rockPaperScissors.collectBets();
      const balanceAfter = await ethers.provider.getBalance(wallet2.address)
      assert.isAbove(balanceAfter,balanceBefore)
    });

    it("Should allow to collect bet if the game is expired", async function () {
      await rockPaperScissors.play(Rock,salt1,{value: parseEther('100')});
      await rockPaperScissors.connect(wallet2).play(Scissors,salt2,{value: parseEther('100')});
      increaseTime(601)
      const balanceBefore = await ethers.provider.getBalance(wallet1.address)
      await rockPaperScissors.collectBets();
      const balanceAfter = await ethers.provider.getBalance(wallet1.address)
      assert.isAbove(balanceAfter,balanceBefore)
    });    

    it("Should emit a GameFinished event if the game is expired and the outcome was not declare yet", async function () {
      await rockPaperScissors.play(Rock,salt1,{value: parseEther('100')});
      await rockPaperScissors.connect(wallet2).play(Scissors,salt2,{value: parseEther('100')});
      increaseTime(601)
      await expect(rockPaperScissors.collectBets())
      .to.emit(rockPaperScissors, "GameFinished")
      .withArgs("Draw",'0x'+'0'.repeat(40) )
    });       

    it("Should returns the bets if the outcome is Draw", async function () {
      await rockPaperScissors.play(Rock,salt1,{value: parseEther('100')});
      await rockPaperScissors.connect(wallet2).play(Rock,salt2,{value: parseEther('100')});
      await rockPaperScissors.commitReveal(Rock,salt1);
      await rockPaperScissors.connect(wallet2).commitReveal(Rock,salt2);
      const balanceBefore1 = await ethers.provider.getBalance(wallet1.address)
      const balanceBefore2 = await ethers.provider.getBalance(wallet2.address)
      await rockPaperScissors.collectBets();
      const balanceAfter1 = await ethers.provider.getBalance(wallet1.address)
      const balanceAfter2 = await ethers.provider.getBalance(wallet2.address)
      const rockPaperScissorsBalance = await ethers.provider.getBalance(rockPaperScissors.address)
      assert.isAbove(balanceAfter1,balanceBefore1)
      assert.isAbove(balanceAfter2,balanceBefore2)
      assert.equal(rockPaperScissorsBalance,0)
    });

    it("Should reset the game once the bets are collected", async function () {
      await rockPaperScissors.play(Rock,salt1,{value: parseEther('100')});
      await rockPaperScissors.connect(wallet2).play(Rock,salt2,{value: parseEther('100')});
      await rockPaperScissors.commitReveal(Rock,salt1);
      await rockPaperScissors.connect(wallet2).commitReveal(Rock,salt2);

      await rockPaperScissors.collectBets();

      const timeLimit = await rockPaperScissors.timeLimit();
      const playersBet = await rockPaperScissors.playersBet(0);
      const playersAddress = await rockPaperScissors.playersAddress(0);
      const playersMoveHash = await rockPaperScissors.playersMoveHash(0);
      const playersMove = await rockPaperScissors.playersMove(0);
      const result = await rockPaperScissors.result();
      const gameStatus = await rockPaperScissors.gameStatus();
      assert.equal(timeLimit,0);
      assert.equal(playersBet,0);
      assert.equal(playersAddress,0);
      assert.equal(playersMoveHash,0);
      assert.equal(playersMove,0);
      assert.equal(result,0);
      assert.equal(gameStatus,0);
    });

  });
});


