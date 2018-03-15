$(document).ready(function() {
    $('#linkHome').click(function() { showView("viewHome") });
    $('#linkCreateNewWallet').click(function() { showView("viewCreateNewWallet") });
    $('#linkOpenExistingWallet').click(function() { showView("viewOpenExistingWallet") });
    $('#linkAccountBalance').click(function() { showView("viewAccountBalance") });
    $('#linkSendTransaction').click(function() { showView("viewSendTransaction") });

    $('#buttonGenerateNewWallet').click(generateNewWallet);
    $('#buttonOpenExistingWallet').click(openExistingWallet);
    $('#buttonDisplayBalance').click(displayBalance);
    $('#buttonSignTransaction').click(signTransaction);
    $('#buttonSendSignedTransaction').click(sendSignedTransaction);
    $('#linkLogout').click(logout);

    showView("viewHome");

    // Attach AJAX "loading" event listener
    $(document).on({
        ajaxStart: function() { $("#loadingBox").show() },
        ajaxStop: function() { $("#loadingBox").hide() }    
    });
    
    function showView(viewName) {
        // Hide all views and show the selected view only
        $('main > section').hide();
        $('#' + viewName).show();
        if (sessionStorage.address) {
            // Logged in -> show user panel and links
            $('#currentAccountAddress').val(sessionStorage['address']);
            $('#panelAccountInfo').show();
            $('#linkSendTransaction').show();
            $('#linkLogout').show();
        } else {
            // Not logged in -> hide user panel and links
            $('#panelAccountInfo').hide();
            $('#linkSendTransaction').hide();
            $('#linkLogout').hide();
        }
    }
    
    function showInfo(message) {
        $('#infoBox>p').html(message);
        $('#infoBox').show();
        $('#infoBox>header').click(function(){ $('#infoBox').hide(); });
    }

    function showError(errorMsg) {
        $('#errorBox>p').html("Error: " + errorMsg);
        $('#errorBox').show();
        $('#errorBox>header').click(function(){ $('#errorBox').hide(); });
    }
    
    function generateNewWallet() {
		let ec = new elliptic.ec('secp256k1');
		let keyPair = ec.genKeyPair();
		saveKeys(keyPair);
		
		$('#textareaCreateWalletResult').text(
			"Generated random private key: " + sessionStorage['privKey'] + "\n" +
			"Extracted public key: " + sessionStorage['pubKey'] + "\n" +
			"Extracted blockchain address: " + sessionStorage['address']
		);
    }
	
	function saveKeys(keyPair) {
		sessionStorage['privKey'] = keyPair.getPrivate().toString(16);
		let pubKey = keyPair.getPublic().getX().toString(16) + 
			(keyPair.getPublic().getY().isOdd() ? "1" : "0");
		sessionStorage['pubKey'] = pubKey;
		let ripemd160 = new Hashes.RMD160();
        sessionStorage['address'] = ripemd160.hex(pubKey);
        $('#currentAccountAddress').val(sessionStorage['address']);

        $('#panelAccountInfo').show();
        $('#linkSendTransaction').show();
        $('#linkLogout').show();
    }
	
	function openExistingWallet() {
		let userPrivateKey = $('#textBoxPrivateKey').val();
		if (!userPrivateKey) {
            $('#textareaOpenWalletResult').text("Please enter a private key.");
		    return;
        }

		let ec = new elliptic.ec('secp256k1');
        let keyPair = ec.keyFromPrivate(userPrivateKey);
		saveKeys(keyPair);
		
		$('#textareaOpenWalletResult').text(
			"Decoded existing private key: " + sessionStorage['privKey'] + "\n" +
			"Extracted public key: " + sessionStorage['pubKey'] + "\n" +
			"Extracted blockchain address: " + sessionStorage['address']
		);
    }
	
	async function displayBalance() {
        try {
            let address = $('#textBoxAccountAddress').val();
            let baseUrl = $('#currentNodeUrl').val();
            let balances =
                await $.get(`${baseUrl}/address/${address}/balance`);
            let transactions =
                await $.get(`${baseUrl}/address/${address}/transactions`);
            $('#textareaAccountBalanceResult').text(
                "Safe balance: " + balances.safeBalance + "\n" +
                "Confirmed balance: " + balances.confirmedBalance + "\n" +
                "Pending balance: " + balances.pendingBalance + "\n" +
                "\n" +
                "Transactions: " + JSON.stringify(transactions)
            );
        }
        catch (error) {
            $('#textareaAccountBalanceResult').text(
                "Error: " + JSON.stringify(error)
            );
        }
    }
	
	function signTransaction() {
      let privateKey = window.prompt("To sign a transaction you have to write down your private key");
      
      if(privateKey) {
        let ec = new elliptic.ec('secp256k1')
        let keyPair = ec.keyFromPrivate(privateKey)
        let publicKey = keyPair.getPublic().getX().toString(16) + (keyPair.getPublic().getY().isOdd() ? "1" : "0")

        let from = $('input[name="senderAddress"]').val()
        let to = $('input[name="recipientAddress"]').val()
        let value = $('input[name="transferAmount"]').val()
        let senderPubKey = publicKey
        let senderSignature = [""]
        let dateCreated = new Date().toString()

        let transaction = {
            from:from,
            to:to,
            value:value,
            senderPubKey:senderPubKey,
            senderSignature:senderSignature,
            dateCreated:dateCreated
        };

        let transactionJson = JSON.stringify(transaction)

        let signedTransaction = [from,publicKey]

        $('#textareaSignedTransaction').val(signedTransaction)
      }
      else {
          window.alert("Invalid private key")
      }
    }
	
	function sendSignedTransaction() {
        let nodeUrl = $('#textBoxNodeAccountBalance').val()
        let url = nodeUrl + '/transactions/new'
        let signedTransaction =  $('#textareaSignedTransaction').val()

        let from = $('input[name="senderAddress"]').val()
        let to = $('input[name="recipientAddress"]').val()
        let value = $('input[name="transferAmount"]').val()
        let senderPubKey = sessionStorage['pubKey']
        let senderSignature = signedTransaction.split(',')
        let dateCreated = "2018-02-01T23:23:56.337Z"

        let signatureArray = [senderSignature[0], senderSignature[1]]
        let transaction = {
            from:from,
            to:to,
            value: Number(value),
            senderPubKey:senderPubKey,
            senderSignature: signatureArray,
            dateCreated:dateCreated
        }

        jsonReqeust = JSON.stringify(transaction)

        $.ajax({
            url: url,
            method: 'post',
            dataType: 'json',
            data: jsonReqeust,
            contentType: "application/json",
            success: function(data) {
                $('#textareaSendTransactionresult').val(data.responseJSON.transactionHash)
            },
            error: function(err){
                $('#textareaSendTransactionresult').val(err.responseJSON.error)
            }
         })
        // fetch(url, {
        //     method: "post",
        //     headers: {
        //         'Accept': 'application/json',
        //         'Content-Type': 'application/json'
        //       },
            
        //  body: transaction
        // })
        // .then((response) => {
        //     console.log(response)
        // })
    }

	function logout() {
        sessionStorage.clear();
        showView("viewHome");
    }
});