var dbAddress = 'http://localhost:5984/couchroom';
var dbSend = 'http://localhost:5984/couchroom/_design/couchroom/_update/send?content='

var username = '';
var password = '';

var lastSeq = 0;

function startGettingMessages() {
	$.ajax({
		type: "GET",
		url: dbAddress + '/_design/couchroom/_view/recent-messages?descending=true&limit=10',
		async: true,
		headers: {
	    "Authorization": "Basic " + btoa(username + ":" + password)
	  },
	  success: function (output, status, xhr){
	  	response = JSON.parse(xhr.responseText);
	  	response.rows.forEach(function(el) {
	  		printMessage(el.value.author, el.value.timestamp, el.value.content);
	  	});
	  	lastKey = response.rows[response.rows.length - 1].key;
	  },
	  error: function(xhr, status, error) {
	  	response = JSON.parse(xhr.responseText);
	  	alert('Error: ' + response.error);
	  }
	});
	$.ajax({
		type: 'GET',
		url: dbAddress + '/_changes',
		async: true,
		headers: {
	    "Authorization": "Basic " + btoa(username + ":" + password)
	  },
	  success: function (output, status, xhr){
	  	response = JSON.parse(xhr.responseText);
	  	lastSeq = response.last_seq;
	  },
	  error: function(xhr, status, error) {
	  	response = JSON.parse(xhr.responseText);
	  	alert('Error: ' + response.error);
	  }
	});
	getNewMessage();
}

function getNewMessage() {
	setInterval(function() {
	$.ajax({
			type: 'GET',
			url: dbAddress + '/_changes?since=' + lastSeq,
			async: true,
			headers: {
		    "Authorization": "Basic " + btoa(username + ":" + password)
		  },
		  success: function (output, status, xhr){
		  	response = JSON.parse(xhr.responseText);
		  	if(response.results[0]) {
		  		var docId = response.results[0].id;
		  		lastSeq = lastSeq + 1;
			  	$.ajax({
						type: 'GET',
						url: dbAddress + '/' + docId,
						async: true,
						headers: {
					    "Authorization": "Basic " + btoa(username + ":" + password)
					  },
					  success: function (output, status, xhr){
					  	response = JSON.parse(xhr.responseText);
					  	$('#feed').append($('<li>').text(response.author + '@' + response.timestamp + ': ' + response.content));
					  	getNewMessage();
					  },
					  error: function(xhr, status, error) {
					  	if(error != 'Object Not Found') {
					  		response = JSON.parse(xhr.responseText);
					  		alert('Error: ' + response.error);
					  	}
					  }
					});
			  }
		  },
		  error: function(xhr, status, error) {
		  	response = JSON.parse(xhr.responseText);
		  	alert('Error: ' + response.error);
		  }
		});
	}, 1000);
}

function printMessage(author, timestamp, content) {
	$('#feed').prepend($('<li>').text(author + '@' + timestamp + ': ' + content));
}

$('#loadMore').click(function() {
	$.ajax({
		type: "GET",
		url: dbAddress + '/_design/couchroom/_view/recent-messages?descending=true&limit=10&startkey=\"' + lastKey + '\"',
		async: true,
		headers: {
	    "Authorization": "Basic " + btoa(username + ":" + password)
	  },
	  success: function (output, status, xhr){
	  	response = JSON.parse(xhr.responseText);
	  	for(i = 1; i < response.rows.length; i++) {
	  		printMessage(response.rows[i].value.author, response.rows[i].value.timestamp, response.rows[i].value.content);
	  	}
	  	lastKey = response.rows[response.rows.length - 1].key;
	  	if(!response.rows[1]) {
	  		alert('No more messages');
	  	}
	  },
	  error: function(xhr, status, error) {
	  	response = JSON.parse(xhr.responseText);
	  	alert('Error: ' + response.error);
	  }
	});
});

$('#login').click(function() {
	if($('#username').val() != '' && $('#password').val() != '') {
		username = $('#username').val();
		password = $('#password').val()
		$.ajax({
		  type: "GET",
		  url: dbAddress,
		  async: true,
		  headers: {
		    "Authorization": "Basic " + btoa($('#username').val() + ":" + $('#password').val())
		  },
		  success: function (output, status, xhr){
		    $('#uirowbottom').css('display', 'flex');
				$('#response').css('color', '#5f5');
				$('#response').css('background-color', '#666');
				$('#username').css('display', 'none');
				$('#password').css('display', 'none');
				$('#login').css('display', 'none');
		  	$('#response').html('Logged in as ' + username);
		  	startGettingMessages();
		  },
		  error: function(xhr, status, error) {
		  	response = JSON.parse(xhr.responseText);
		  	$('#response').css('background-color', '#ddd');
				$('#response').css('color', 'red');
		  	if(response.error = 'unauthorized') {
		  		$('#response').html(response.reason);
		  	} else {
		  		$('#response').html('Unknown error');
		  	}
		  }
		});
	} else {
		$('#response').css('background-color', '#ddd');
		$('#response').css('color', 'red');
		$('#response').html('Put your credentials in');
	}
});
$('#send').click(function() {
	sendMessage();
});
$('#input').keypress(function (e) {
	var key = e.which;
	if(key == 13) {
		sendMessage();
	}
});

function sendMessage() {
	$.ajax
	({
	  type: "POST",
	  url: dbSend + $('#input').val(),
	  async: true,
	  headers: {
	    "Authorization": "Basic " + btoa(username + ":" + password)
	  },
	  success: function (){
	    $('#input').val('');
	  },
	  error: function(xhr, status, error) {
		  response = JSON.parse(xhr.responseText);
		  alert('Error: ' + response.error);
		}	
	});
}