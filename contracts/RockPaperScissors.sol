//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

// import "hardhat/console.sol";

contract RockPaperScissors {
    
    enum Move {None, Rock, Paper, Scissors }
    enum GameStatus {Open,CommitReveal,Finished}
    enum Result {None, Player1, Player2, Draw} 
    
    uint public constant MINBET= 0.01 ether;
    uint public constant TIMEOUT= 10 minutes;
    
    //Storage will be cheaper than using a struct
    uint        public  timeLimit;
    uint[2]     public  playersBet;
    address[2]  public  playersAddress;
    bytes32[2]  public  playersMoveHash;
    Move[2]     public  playersMove;
    Result      public  result;
    GameStatus  public  gameStatus;

    event GameFinished (string,address);


    function play(Move _move, string calldata salt) payable external isNotExpired {
        require(gameStatus == GameStatus.Open,"Game in progress");
        require(msg.value>=MINBET, "Must provide a minimun Bet");
        require(playersAddress[0] != msg.sender,"You can't play against yourself");
        uint8 i;
        if (playersAddress[0] != address(0)) {
            i=1;
            require(msg.value>=playersBet[0], "Must provide a bet at least equal to player's 1");
            gameStatus = GameStatus.CommitReveal;
        }
        
        timeLimit = block.timestamp+TIMEOUT;
        playersBet[i] = msg.value;
        playersAddress[i] = msg.sender;
        playersMoveHash[i] = sha256(abi.encodePacked(salt,_move));
    }
    //revisar porque puede suceder que no se pueda hacer commit reveal de ninguno de los dos en cuyo caso deberia ser un draw
    function commitReveal(Move _move, string calldata salt) external isNotExpired {
        require(gameStatus == GameStatus.CommitReveal,"Not ready for commit reveal");
        require(playersAddress[0] == msg.sender || playersAddress[1] == msg.sender,"You have to be one of the players");
        uint8 i;
        uint8 j = 1;
        if (playersAddress[1] == msg.sender){
            i = 1;
            j = 0; 
        }
        require(playersMove[i] == Move.None, "You've already revealed");
        require(playersMoveHash[i] == sha256(abi.encodePacked(salt,_move)),"Bad commit reveal");
        playersMove[i] = _move;

        if (playersMove[j] == Move.None) {
            timeLimit = block.timestamp+TIMEOUT;
            return;
        }


        gameStatus = GameStatus.Finished;
        if (playersMove[0] == playersMove[1]) {
            emit GameFinished ("Draw",address(0));
            result= Result.Draw;
        } else if ((playersMove[0] == Move.Rock     && playersMove[1] == Move.Scissors) ||
                   (playersMove[0] == Move.Paper    && playersMove[1] == Move.Rock)     ||
                   (playersMove[0] == Move.Scissors && playersMove[1] == Move.Paper)) {
            emit GameFinished ("Player1 wins",playersAddress[0] );
            result= Result.Player1;
        } else {
            emit GameFinished ("Player2 wins",playersAddress[1] );
            result= Result.Player2;
        }
    }

    function collectBets() external {
        
        require(gameStatus == GameStatus.Finished || (timeLimit>0 && block.timestamp>timeLimit ), "Game not finished");
        
        address player1 = playersAddress[0];
        address player2 = playersAddress[1];
        uint bet1 = playersBet[0];
        uint bet2 = playersBet[1];

        if (gameStatus == GameStatus.CommitReveal) {
            if (playersMove[0]== Move.None && playersMove[1]== Move.None) {
                emit GameFinished ("Draw",address(0));
                result = Result.Draw;
            } else if (playersMove[0]== Move.None) {
                emit GameFinished ("Player2 wins",player2);
                result = Result.Player2;
            } else {
                emit GameFinished ("Player1 wins",player1);
                result = Result.Player1;
            }
        }

        if (gameStatus == GameStatus.Open && playersMoveHash[1]== 0x0) {
            emit GameFinished ("Player1 wins",player1);
            result = Result.Player1;
        }

        Result auxResult =  result;
        //to avoid reentrancies

        _reset();


        if (auxResult == Result.Player1) {
            payable(player1).transfer(bet1+bet2);
            return;
        }

        if (auxResult == Result.Player2) {
            payable(player2).transfer(bet1+bet2);
            return;
        }

        if (auxResult == Result.Draw) {
            payable(player1).transfer(bet1);
            payable(player2).transfer(bet2);
        }
        // si no esta inalizado pero ya se revelo
    }

    function _reset() private {
        timeLimit = 0;
        delete playersBet;
        delete playersAddress;
        delete playersMoveHash;
        delete playersMove;
        result = Result.None;
        gameStatus = GameStatus.Open;
    }

    modifier isNotExpired() {
        require(timeLimit==0 || timeLimit >= block.timestamp, "Game expired");
        _;
    } 
}
