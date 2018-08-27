var App = (function () {
    let init, initPost, initWeb3, initContract, bindEvents, loadUserCard, _get_item_callback, buyToken, bindLogs;
    let web3Provider = null,
        contracts = {};

    let is_user_on_board = false;

    let purchase_item_data = [
        {"name": "Coin", "price": 0.01},
        {"name": "Small bag of money", "price": 0.1},
        {"name": "Bag of money", "price": 1},
        {"name": "Trea$ure box", "price": 10},
    ]

    let leaderBoardInstance;

    init = function() {
        loadPurchaseItemTemp();
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

    _display_text = function (idx, field, text) {
        let item_div = $('#item-' + idx),
            item_addr = item_div.find(".item-" + field);
        item_addr.slideUp("slow", function () {
            item_addr.text(text);
            item_addr.slideDown();
        });
    }

    _get_item_callback = function (idx, addr) {
        let item_div = $('#item-' + idx),
            item_addr = item_div.find(".item-address"),
            item_slogan = item_div.find(".item-slogan"),
            item_bal = item_div.find(".item-balance");

        if (addr === "0x0000000000000000000000000000000000000000") {
            // skip empty slot
            return;
        }

        // reset border
        item_div.css("border-style", "");
        item_div.css("border-color", "");

        if (addr === web3.eth.accounts[0]) {
            is_user_on_board = true;
            item_div.css("border-style", "solid");
            item_div.css("border-color", "#2f89fc");
        }

        _display_text(idx, "address", addr);
        _getUserBal(addr, idx);
        _getUserSlogan(addr, idx);
    }

    _getUserBal = function (addr, idx) {
        leaderBoardInstance.balanceOf.call(addr).then(function (amount) {
            amount = amount.toNumber();
            _display_text(idx, "balance", web3.fromWei(amount + "", "ether") + " ETH");
        });
    }

    _getUserSlogan = function (addr, idx) {
        leaderBoardInstance.sloganOf.call(addr).then(function (str) {
            _display_text(idx, "slogan", b64decode(str));
        });
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
        let lst = [];
        for (let i = 9; i > -1 ; i--) {
            lst.push(leaderBoardInstance.board.call(i).then(function (addr) {
                _get_item_callback(10-i, addr);
            }));
        }

        Promise.all(lst).then(function() {
            if (!is_user_on_board) {
                loadUserCard();
            } else {
                 $('#user-acct-container').hide();
            }
        })
    }

    loadUserCard = function () {
        let container = $('#user-acct-container'),
            item_temp = $('#item-template'),
            addr = web3.eth.accounts[0],
            item_div = item_temp.find(".item-div"),
            item_addr = item_temp.find(".item-address");

        item_div.attr("id", "item-" + 0);
        item_temp.find(".item-idx").text("..");
        item_addr.text(addr);
        _getUserBal(addr, 0);
        _getUserSlogan(addr, 0);

        item_div.css("border-style", "solid");
        item_div.css("border-color", "#2f89fc");

        container.html("");
        container.show();
        container.append("<div class='dotdotdot'></div>");
        container.append(item_temp.html());
    }

    loadPurchaseItemTemp = function () {
        let container = $('#purchase-item-list'),
            item_temp = $('#purchase-item-template');
        container.text("");

        purchase_item_data.forEach(function (data) {
            item_temp.find(".purchase-item-name").text(data["name"]);
            item_temp.find(".purchase-item-price").text(data["price"]);
            container.append(item_temp.html());
        });
    }

    $(document).on("click", ".purchase-item", function () {
        var item = $(this),
            price = parseFloat(item.find(".purchase-item-price").text());
        buyToken(price);
    })

    buyToken = function (ether) {
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
            // close modal;
            $("#slogan-modal").modal("hide");
        });
    }

    bindLogs = function () {
        // update board when new purchase happended
        leaderBoardInstance.contract.LogPurchase().watch(function(error, result){
                if (!error) {
                    console.log(result);
                    console.log("addr: " + result.args._owner);
                    console.log("value: " + result.args._value.toNumber());
                    loadList();
                }
            }
        )
        // update board when slogan edited
        leaderBoardInstance.contract.LogSlogan().watch(function(error, result){
                if (!error) {
                    loadList();
                }
            }
        )
    }

    return {
        init: init,
    }
})();
