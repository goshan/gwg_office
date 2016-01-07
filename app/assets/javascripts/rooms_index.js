if ($("#rooms_index").length != 0){
	var socket = new WebSocket("ws://0.0.0.0:4040");
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
		var room_id = $('#current_room_id').text();
		var request = JSON.stringify({engin: "socket", action: "register", user_id: current_user_id});
		socket.send(request);
	}
}
