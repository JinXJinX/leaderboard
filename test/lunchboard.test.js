var LeaderBoard = artifacts.require("./LeaderBoard.sol");

contract('LeaderBoard', function(accounts) {

    const manager = accounts[0]
    const alice = accounts[1]
    const bob = accounts[2]
    const cindy = accounts[3]
    const devon = accounts[4]
    const emptyAddress = '0x0000000000000000000000000000000000000000'

    const eth1 = web3.toWei(1, "ether")
    const eth2 = web3.toWei(2, "ether")
    const eth3 = web3.toWei(3, "ether")

    // base64 lib
    var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}
    var b64encode=function(str){return Base64.encode(str);}
    var b64decode=function(str){return Base64.decode(str);}

    // OpenZeppelin/openzeppelin-solidity
    // https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/test/helpers/expectThrow.js
    async function expectThrow (promise, message) {
      try {
        await promise;
      } catch (error) {
        // Message is an optional parameter here
        if (message) {
          assert(
            error.message.search(message) >= 0,
            'Expected \'' + message + '\', got \'' + error + '\' instead',
          );
          return;
        } else {
          // TODO: Check jump destination to destinguish between a throw
          //       and an actual invalid jump.
          const invalidOpcode = error.message.search('invalid opcode') >= 0;
          // TODO: When we contract A calls contract B, and B throws, instead
          //       of an 'invalid jump', we get an 'out of gas' error. How do
          //       we distinguish this from an actual out of gas event? (The
          //       ganache log actually show an 'invalid jump' event.)
          const outOfGas = error.message.search('out of gas') >= 0;
          const revert = error.message.search('revert') >= 0;
          assert(
            invalidOpcode || outOfGas || revert,
            'Expected throw, got \'' + error + '\' instead',
          );
          return;
        }
      }
      assert.fail('Expected throw not received');
    }

    module.exports = {
      expectThrow,
    };


    it("test init", async() => {
        const lb = await LeaderBoard.deployed()
        const manager_addr = await lb.getManager.call();
        assert.equal(manager, manager_addr, "check contract manager address ");
    });

    it("test rank function", async() => {
        const lb = await LeaderBoard.deployed()

        await lb.sendTransaction({value: eth1, from: alice})
        const top1 = await lb.board.call(9)
        const top2 = await lb.board.call(8)
        assert.equal(top1, alice, "check No.1 is alice on leaderboard")
        assert.equal(top2, emptyAddress, "check No.2 is empty on leaderboard")

        await lb.sendTransaction({value: eth1, from: bob})
        const top1_new = await lb.board.call(9)
        const top2_new = await lb.board.call(8)
        assert.equal(top1_new, bob, "check new No.1 is now bob")
        assert.equal(top2_new, alice, "check new No.2 is alice")

        await lb.sendTransaction({value: eth3, from: cindy})
        const top1_new_new = await lb.board.call(9)
        const top2_new_new = await lb.board.call(8)
        const top3_new_new = await lb.board.call(7)
        assert.equal(top1_new_new, cindy, "check new No.1 now should be cindy")
        assert.equal(top2_new_new, bob, "check new No.2 is alice")
        assert.equal(top3_new_new, alice, "check new No.3 is bob")
    });

    it("test slogan function", async() => {
        const lb = await LeaderBoard.deployed()
        const slogan_1 = b64encode("slogan 1")
        await lb.setSlogan(slogan_1, {from: alice})
        const ali_slogan = await lb.sloganOf.call(alice)
        assert.equal(ali_slogan, slogan_1, "check alice slogan");
    });

    it("test manager only function", async() => {
        const lb = await LeaderBoard.deployed()
        expectThrow(lb.pause({from: alice}))

        await lb.pause({from: manager})
        expectThrow(lb.sendTransaction({value: eth3, from: cindy}))

        // unpause
        await lb.unpause({from: manager})
    });

    it("test event log", async() => {
        const lb = await LeaderBoard.deployed()
        let eventEmitted = false
        await lb.Purchase().watch((err, res) => {
            eventEmitted = true
        })
        await lb.sendTransaction({value: eth1, from: cindy})
        assert.equal(eventEmitted, true, 'Emit a purchase event')

        eventEmitted = false
        await lb.Pause().watch((err, res) => {
            eventEmitted = true
        })
        await lb.pause({from: manager})
        assert.equal(eventEmitted, true, 'Emit a pause event')
    });


});
