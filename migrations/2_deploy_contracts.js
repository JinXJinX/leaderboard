var LeaderBoard = artifacts.require("./LeaderBoard.sol");

module.exports = function(deployer) {
  deployer.deploy(LeaderBoard);
};
