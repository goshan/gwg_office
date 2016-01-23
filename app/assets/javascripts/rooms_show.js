if ($("#rooms_show").length != 0){
	var domain = $('#socket_domain').text();
	var socket = new WebSocket(domain);
	socket.onmessage = function(res){ 
		console.log(res.data);

		json = JSON.parse(res.data);
		if (json['action'] == "user enter room"){
			var room_id = $('#current_room_id').text();
			var current_user_id = $('#current_user_id').text();
			if (room_id == json['room_id'] && current_user_id != json['user_id']){
			  $('#room_players table').append("<tr id='room_player_id_"+json['user_id']+"'><td>"+json['user_id']+"</td><td>"+json['user_name']+"</td><td>"+json['user_win_cnt']+"</td><td>"+json['user_lose_cnt']+"</td></tr>")
			}

			if ($('#room_players tr').length == 2){
				$('#start_game_button').removeClass('hidden');
			}
		}
		else if (json['action'] == "user leave room"){
			var room_id = $('#current_room_id').text();
			if (room_id == json['room_id']){
				$('#room_player_id_'+json['user_id']).remove();
			}
		}
		else if (json['action'] == "user start game"){
			var room_id = $('#current_room_id').text();
			console.log(room_id);
			if (room_id == json['room_id']){
				window.location.assign("/rooms/"+room_id+"/game");
			}
		}
	}

	socket.onopen = function(event){ 
		var current_user_id = $('#current_user_id').text();
		var room_id = $('#current_room_id').text();
		var request = JSON.stringify({engin: "socket", action: "register", user_id: current_user_id});
		socket.send(request);

		request = JSON.stringify({engin: "room", action: "enter", room_id: room_id});
		socket.send(request);
	}

	$('#leave_room_button').on('click', function(){
		var room_id = $('#current_room_id').text();
		request = JSON.stringify({engin: "room", action: "leave", room_id: room_id});
		socket.send(request);
	});

	$('#start_game_button').on('click', function(){
		var room_id = $('#current_room_id').text();
		var request = JSON.stringify({engin: "room", action: "start_game", room_id: room_id});
		socket.send(request);
	});
}
