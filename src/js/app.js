var App = (function () {
    var init, initPost, initWeb3, initContract, bindEvents, _get_item_callback, buyToken, bindLogs;
    var web3Provider = null,
        contracts = {};

    let leaderBoardInstance;

    init = function() {
        loadListTemp();
        initWeb3();
        initContract();
        bindEvents();

    }

    initWeb3 = function() {
        // Is there an injected web3 instance?
        if (typeof web3 !== 'undefined') {
            web3Provider = web3.currentProvider;
        } else {
            // If no injected web3 instance is detected, fall back to Ganache
            web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
        }
        web3 = new Web3(web3Provider);
    }

    initContract = function() {
        $.getJSON('LeaderBoard.json', function(data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            var LeaderBoardArtifact = data;
            contracts.LeaderBoard = TruffleContract(LeaderBoardArtifact);

            // Set the provider for our contract
            contracts.LeaderBoard.setProvider(web3Provider);

            contracts.LeaderBoard.deployed().then(function(instance) {
                leaderBoardInstance = instance;
                console.log(leaderBoardInstance.address);
                bindLogs();

                // Use our contract to retrieve and mark the adopted pets
                loadList();
            });

        });
    }

    bindEvents = function() {
        $('#btn-buy-token').click(function () {
            $("#purchase-modal").modal('show');
        });
        $('#btn-update-slogan').click(setSlogan);
        $('#btn-slogan-modal').click(function () {
            let modal = $("#slogan-modal");
            modal.modal('show');
        })
    }

    _display_text = function (item, text) {
        item.slideUp("slow", function () {
            item.text(text);
            item.slideDown();
        });
    }

    _get_item_callback = function (idx, addr) {
        // var listContainer = $('#list-container');
        // var itemTemplate = $('#item-template');
        let item_div = $('#item-' + idx),
            item_addr = item_div.find(".item-address"),
            item_slogan = item_div.find(".item-slogan"),
            item_bal = item_div.find(".item-balance");

        if (addr === "0x0000000000000000000000000000000000000000") {
            // itemTemplate.find(".item-address").text("???");
            // listContainer.append(itemTemplate.html());
            return;
        }

        // console.log("addr: " + addr + " this: " + this._account)
        item_div.css("border-style", "");
        item_div.css("border-color", "");

        // item_addr.slideUp("slow", function () {
        //     item_addr.text(addr);
        //     item_addr.slideDown();
        // });
        _display_text(item_addr, addr);
        // item_div.find(".item-address").text(addr);
        // listContainer.append(itemTemplate.html());
        leaderBoardInstance.balanceOf.call(addr).then(function (amount) {
            amount = amount.toNumber();
            // item_bal.slideUp("slow", function () {
            //     item_bal.text(web3.fromWei(amount + "", "ether") + " ETH");
            //     item_bal.slideDown();
            // });
            _display_text(item_bal, web3.fromWei(amount + "", "ether") + " ETH")

            if (addr === web3.eth.accounts[0]) {
                item_div.css("border-style", "solid");
                item_div.css("border-color", "#2f89fc");
            }
        });

        leaderBoardInstance.sloganOf.call(addr).then(function (str) {
            console.log("get slogan: " + b64decode(str));
            if (str) {
                item_slogan.show();
                _display_text(item_slogan, b64decode(str))
            } else {
                item_slogan.hide();
            }
        });
        // postTemplate.find('.post-title').text(b64_to_utf8(post[0]));
        // postTemplate.find('.post-content').text(b64_to_utf8(post[1]));
        // postTemplate.find('.post-panel').attr('data-id', idx);
        // postTemplate.find('.post-link').attr('href', '/post.html?postid='+idx);
        // postRow.append(postTemplate.html());
    }

    loadListTemp = function () {
        let container = $('#list-container'),
            item_temp = $('#item-template');
        container.text("");
        for (let i = 1; i < 11 ; i++) {
            item_temp.find(".item-div").attr("id", "item-" + i);
            item_temp.find(".item-idx").text(i);
            let img_url;
            if (i < 4) {
                img_url = "images/mountain.jpg"
            } else if (i > 3) {
                img_url = "images/paper.jpg"
            }
            item_temp.find(".item-div").css('background-image', 'url(' + img_url + ')');
            container.append(item_temp.html());
        }
    }

    loadList = function() {
        for (let i = 9; i > -1 ; i--) {
            leaderBoardInstance.board.call(i).then(function (addr) {
                _get_item_callback(10-i, addr);
            });
        }
    }

    $(".purchase-item").click(function () {
        let item = $(this),
            price = item.data("price");
        buyToken(price);
    })

    buyToken = function (ether) {
        console.log("bbb");
        console.log(contracts.LeaderBoard.options)

        console.log(leaderBoardInstance.address);

        var tx = web3.eth.sendTransaction({
                from: this._account,
                to: leaderBoardInstance.address,
                value: web3.toWei(ether, "ether"),
            }, function(err, transactionHash) {
                if (!err)
                console.log(transactionHash);
            })

        $("#purchase-modal").modal('hide');
    }

    setSlogan = function () {
        let str = $("#inp-slogan").val(),
            enc = b64encode(str);

        //TODO check input format, length
        console.log(enc.length);

        leaderBoardInstance.setSlogan(enc).then(function () {
            console.log("done..");
        });
    }

    bindLogs = function () {
        // update board when new purchase happended
        leaderBoardInstance.contract.Purchase().watch(function(error, result){
              if (!error)
                console.log(result);
                console.log("addr: " + result.args._owner);
                console.log("value: " + result.args._value.toNumber());
                loadList();
            }
        )
    }

    function toUnicode(str) {
    	return str.split('').map(function (value, index, array) {
    		var temp = value.charCodeAt(0).toString(16).toUpperCase();
    		if (temp.length > 2) {
    			return '\\u' + temp;
    		}
    		return value;
    	}).join('');
    }

    return {
        init: init,
    }
})();
