pragma solidity 0.4.24;

import './SafeMath.sol';

/** @title Leader Board. */
contract LeaderBoard {
    bool public paused = false;
    mapping (address => uint256) balances;
    mapping (address => string) slogans;
    address public Manager;
    address[10] public board;

    /**
      * constructor
      */
    constructor() public {
        Manager = msg.sender;
    }

    /**
      * @dev shift board.
      * @param left Left index.
      * @param right Right index.
      */
    function _shift(uint8 left, uint8 right) internal {
        for (uint i = left; i < right; i++) {
            if (board[i+1] == address(0)) {
                continue;
            }
            board[i] = board[i+1];
        }
    }

    /**
      * @dev updateBoard
      */
    function updateBoard () internal {
        uint8 shift_left = 0;
        for (uint8 i = 0; i < 10; i++) {
            if (board[i] == address(0)) {
                if (i == 9) { // idx 9 is top 1
                    board[i] = msg.sender;
                    break;
                }
                continue;
            } else if (board[i] == msg.sender) {
                shift_left = i;
            } else if (balances[board[i]] > balances[msg.sender]) {
                if (i == 0) {
                    break;
                }
                _shift(shift_left, i-1);
                board[i-1] = msg.sender;
                break;
            } else if (i == 9) {
                // new top 1
                _shift(shift_left, 9);
                board[9] = msg.sender;
                break;
            }
        }
    }

    /**
      * @dev receive payment
      */
    function () public payable NotPaused {
        require(msg.value > 0);
        emit LogPurchase(msg.sender, msg.value);
        balances[msg.sender] = SafeMath.add(balances[msg.sender], msg.value);  // convert
        updateBoard();
    }

    /**
      * @dev set slogan
      * @param str Slogan text.
      */
    function setSlogan(string str) public NotPaused {
        require(bytes(str).length < 120);
        emit LogSlogan();
        slogans[msg.sender] = str;
    }

    /**
      * @dev get user's balance
      * @param _owner User Account.
      * @return User's balance.
      */
    function balanceOf(address _owner) public view returns (uint256){
        return balances[_owner];
    }

    /**
      * @dev get user's slogan
      * @param _owner User Account.
      * @return User's slogan.
      */
    function sloganOf(address _owner) public view returns (string){
        return slogans[_owner];
    }

    /**
      * @dev get contract's balance
      * @return contact's balance.
      */
    function contractBalance() public view returns(uint256) {
        return address(this).balance;
    }

    /**
      * @dev get contract's balance
      * @return contact's balance.
      */
    function withdraw(uint _amount) public OnlyManager returns(bool) {
        //require(address(this).balance >= _amount);
        emit LogWithdraw(msg.sender, _amount);
        Manager.transfer(_amount);
        return true;
    }

    /**
      * @dev get contract's owner
      * @return manager address.
      */
    function getManager() public view returns(address) {
        return Manager;
    }


    /**
      * @dev mortal design pattern
      *  destroy the contract and remove it from the blockchain
      */
    function kill() public OnlyManager {
        selfdestruct(Manager);
    }

    /**
     * @dev circuit breaker design pattern
     * called by the owner to pause, triggers stopped state
     */
    function pause() public OnlyManager NotPaused {
        paused = true;
        emit LogPause();
    }

    /**
     * @dev called by the owner to unpause, returns to normal state
     */
    function unpause() public OnlyManager Paused {
        paused = false;
        emit LogUnpause();
    }

    /**
     * @dev events
     */
    event LogPurchase(address indexed _owner, uint256 _value);
    event LogWithdraw(address indexed _owner, uint256 _value);
    event LogSlogan();
    event LogPause();
    event LogUnpause();

    /**
      * @dev restricting access design pattern
      */
    modifier OnlyManager {require(msg.sender == Manager);_;}
    modifier NotPaused() {require(!paused); _;}
    modifier Paused() {require(paused); _;}
}
