if ($("#rooms_index").length != 0){
	var domain = $('#socket_domain').text();
	var socket = new WebSocket('ws://'+domain+':4040');
	socket.onmessage = function(res){ 
		console.log(res.data);

		json = JSON.parse(res.data);
		if (json['action'] == "user enter room"){
			window.location.reload();
		}
		else if (json['action'] == "user leave room"){
			window.location.reload();
		}
		else if (json['action' == "user start game"]){
			window.location.reload();
		}
	}

	socket.onopen = function(event){ 
		var current_user_id = $('#current_user_id').text();
		var request = JSON.stringify({engin: "socket", action: "register", user_id: current_user_id});
		socket.send(request);
	}
}
