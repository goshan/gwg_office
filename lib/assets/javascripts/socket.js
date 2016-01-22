function send_message(json){
	var request = JSON.stringify(json);
	socket.send(request);
}

function open_socket(url){
	socket = new WebSocket(url);

	socket.onopen = function(event){
		send_message({engin: "socket", action: "register", user_id: current_player_id});
		send_message({engin: "game", action: "enter_game"});
		current_status = "waiting";
	};
	
	socket.onmessage = function(event) { 
		var res = $.parseJSON(event["data"]);
		console.log(res);
		if (res['status']){
			current_status = res['status'];
		}
		if (res['turn']){
			current_player_turn = res['turn']
		}
		if (res['round']){
			current_round = res['round'];
		}
		if (res['action'] == "notice"){
			print_console(res['msg']);
		}
		else if (res['action'] == "alert"){
			alert(res['msg']);
		}
		else if (res['action'] == "get ready"){
			print_console('准备就绪，请部署战略');
			send_message({engin: "game", action: "get_players"});
			send_message({engin: "game", action: "assign_heroes"});
		}
		else if (res['action'] == "get players list"){
			set_players(res['players']);
			init_map();
		}
		else if (res['action'] == "assign heroes"){
			set_heroes(current_player_id, res['heroes']);
		}
		else if (res['action'] == "check hero info"){
			show_hero_info(res['hero']);
		}
		else if (res['action'] == "player deployed hero"){
			update_hero(res['hero']);
			check_ready();
		}
		else if (res['action'] == "ready for fight"){
			print_console("双方部署完毕，开始战斗！");
			remove_init_flag();
			clear_map_heroes();
			clear_players_status_heroes();
			_.each(res['players'], function(e){
				set_heroes(e['id'], e['heroes']);
				_.each(e['heroes'], function(h){
					update_hero(h);
				});
			});
		}
		else if (res['action'] == "update hero"){
			clear_scope();
			update_hero(res['hero']);
			if (res['show_menu'] && res['hero']['player_id'] == current_player_id){
				var $grid = get_grid({x: res['hero']['x'], y: res['hero']['y']});
				show_menu($grid);
			}
		}
		else if (res['action'] == "win"){
			soundeffect('winner');
			alert("恭喜你赢得了比赛");
			window.location.assign("/");
		}
		else if (res['action'] == "lose"){
			soundeffect('loser');
			alert("很遗憾你输了");
			window.location.assign("/");
		}
		else if (res['status'] == "error"){
			alert(res['error']);
		}
		else {
			console.log('unknow message');
		}
	}; 

	// 监听Socket的关闭
	socket.onclose = function(event) { 
		console.log('Client notified socket has closed',event); 
	}; 
}


function close_socket(){
	// 关闭Socket.... 
	socket.close();
}



function on_skill(){
	$(".skill").live("click", function(e){
		var hero_id = $(this).parent().parent().children(".hero").attr("hero");
		var player1 = player1_heros[hero_id];
		var player2 = player2_heros[hero_id];
		if ((player1 && player1["skill_used"]) || (player2 && player2["skill_used"])){
			$('embed').remove();
			$('body').append('<embed src="/mp3/alert.wav" autostart="true" hidden="true" loop="false">');
			alert("技能已经释放过了");
		}
		else {
			$('embed').remove();
			$('body').append('<embed src="/mp3/skill.wav" autostart="true" hidden="true" loop="false">');

			var json = JSON.stringify({action: "skill", hero_id: hero_id});
			socket.send(json);
			$("#menu").parent().children(".hero").addClass("moved");
			$("#menu").addClass("hidden");
		}

		e.preventDefault();
	});
}



function on_cancel(){
	$(document).keyup(function(e){
		if (e.which == 27){    //press esc
			var on_search_move = $(".wait_for_move").length != 0;
			var on_search_attack = $(".wait_for_attack").length != 0;
			if (on_search_move){
				$(".wait_for_move").removeClass("wait_for_move");
				$(".move_scope").removeClass("move_scope");
			}
			else if (on_search_attack){
				$(".attack_scope").removeClass("attack_scope");
				$(".wait_for_attack").removeClass("wait_for_attack");
				$("#menu").removeClass("hidden");
			}
		}
		e.preventDefault();
	});
}



