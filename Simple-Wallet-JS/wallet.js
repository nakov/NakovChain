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

    const secp256k1 = new elliptic.ec('secp256k1');

    // Attach AJAX "loading" event listener
    $(document).on({
        ajaxStart: function() { $("#loadingBox").fadeIn(200) },
        ajaxStop: function() { $("#loadingBox").fadeOut(200) }
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
		let keyPair = secp256k1.genKeyPair();
		saveKeysInSession(keyPair);
		
		$('#textareaCreateWalletResult').text(
			"Generated random private key: " + sessionStorage['privKey'] + "\n" +
			"Extracted public key: " + sessionStorage['pubKey'] + "\n" +
			"Extracted blockchain address: " + sessionStorage['address']
		);
    }
	
	function saveKeysInSession(keyPair) {
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

        let keyPair = secp256k1.keyFromPrivate(userPrivateKey);
		saveKeysInSession(keyPair);
		
		$('#textareaOpenWalletResult').text(
			"Decoded existing private key: " + sessionStorage['privKey'] + "\n" +
			"Extracted public key: " + sessionStorage['pubKey'] + "\n" +
			"Extracted blockchain address: " + sessionStorage['address']
		);
    }
	
	async function displayBalance() {
        try {
            let address = $('#textBoxAccountAddress').val();
            let nodeUrl = $('#currentNodeUrl').val();
            let [balances, transactions] = await Promise.all([
                $.get(`${nodeUrl}/address/${address}/balance`),
                $.get(`${nodeUrl}/address/${address}/transactions`)
            ]);

            $('#textareaAccountBalanceResult').text(
                "Safe balance: " + balances.safeBalance + "\n" +
                "Confirmed balance: " + balances.confirmedBalance + "\n" +
                "Pending balance: " + balances.pendingBalance + "\n" +
                "\n" +
                "Transactions: " + JSON.stringify(transactions)
            );
        }
        catch (error) {
            console.log(error);
            $('#textareaAccountBalanceResult').text(
                "Error: " + JSON.stringify(error)
            );
        }
    }
	
	function signTransaction() {
        let transaction = {
            from: sessionStorage['address'],
            to: $('#recipientAddress').val(),
            value: parseInt($('#transferValue').val()),
            fee: parseInt($('#miningFee').val()),
            dateCreated: new Date().toISOString(),
            data: $('#tranData').val(),
            senderPubKey: sessionStorage['pubKey']
        };
        let transactionJSON = JSON.stringify(transaction);
        transaction.transactionDataHash = new Hashes.SHA256().hex(transactionJSON);
        transaction.senderSignature = signData(
            transaction.transactionDataHash, sessionStorage['privKey']);
        $('#textareaSignedTransaction').val(JSON.stringify(transaction));
    }

    function signData(data, privKey) {
        let keyPair = secp256k1.keyFromPrivate(privKey);
        let signature = keyPair.sign(data);
        return [signature.r.toString(16), signature.s.toString(16)];
    }
	
	async function sendSignedTransaction() {
        try {
            let nodeUrl = $('#currentNodeUrl').val();
            let transactionJSON = $('#textareaSignedTransaction').val();
            let result = await $.ajax({
                type: 'POST',
                url: `${nodeUrl}/transactions/send`,
                data: transactionJSON,
                contentType: 'application/json'
            });
            $('#textareaSendTransactionResult').text(
                JSON.stringify(result)
            );
        }
        catch (error) {
            console.log(error);
            $('#textareaSendTransactionResult').text(
                "Error: " + JSON.stringify(error)
            );
        }
    }

	function logout() {
        sessionStorage.clear();
        showView("viewHome");
    }
});