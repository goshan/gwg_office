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
		if (res['action'] == "get ready"){
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
		else if (respond["action"] == "game_status"){
			//update large screen 
			playerTurn = respond["turn"];
			var round = respond["round"];
			var turn = playerTurn == playerID ? "我方行动" : "对方行动";
			var msg = respond["large_screen"];
			$("#notification").text("消息："+msg);
			$("#round").text("回合："+round);
			$("#turn").text("行动："+turn);
			var player_list = "";
			if (respond["player1"]){
				player_list += "|"+(playerID == "1" ? "* " : "  ")+"玩家1|";
			}
			if (respond["player2"]){
				player_list += "|"+(playerID == "2" ? "* " : "  ")+"玩家2|";
			}
			$("#player_list").text("玩家列表："+player_list);

			//update hero
			player1_heros = respond["player1"];
			player2_heros = respond["player2"];
			if (respond["status"] == "playing"){
				$(".moved").removeClass("moved");
				$(".hero").addClass("wait_for_update");
				$(".has_hero").removeClass("has_hero");
				$.each(player1_heros, function(key, value){
					if (!value["turn_move"]){
						$(".hero[hero='"+key+"']").addClass("moved");
					}
					$(".hero[hero='"+key+"']").removeClass("wait_for_update");
					$(".hero[hero='"+key+"']").parent().addClass("has_hero");
					$(".hero[hero='"+key+"'] span").text(value["current_health"]+"/"+value["health"]);
				});
				$.each(player2_heros, function(key, value){
					if (!value["turn_move"]){
						$(".hero[hero='"+key+"']").addClass("moved");
					}
					$(".hero[hero='"+key+"']").removeClass("wait_for_update");
					$(".hero[hero='"+key+"']").parent().addClass("has_hero");
					$(".hero[hero='"+key+"'] span").text(value["current_health"]+"/"+value["health"]);
				});
				$(".wait_for_update").remove();
			}
			else if (respond["status"] == "picking"){
				$("#player1_candidates").text("玩家1");
				$.each(player1_heros, function(key, value){
					$("#player1_candidates").append(
						"<span>"
        					+"<img class='avatar' src='"+value["avatar"]+"'>"
      					+"</span>"
					);
				});
				$("#player2_candidates").text("玩家2");
				$.each(player2_heros, function(key, value){
					$("#player2_candidates").append(
						"<span>"
        					+"<img class='avatar' src='"+value["avatar"]+"'>"
      					+"</span>"
					);
				});
			}
			

			//push notification
			var notice = respond["notice"];
			if (notice){
				alert(notice);
			}

			//update scope
			$(".move_scope").removeClass("move_scope");
			$(".attack_scope").removeClass("attack_scope");
			$(".wait_for_attack").removeClass("wait_for_attack");
		}
		else if (respond["action"] == "get_heros"){
			var json = $.parseJSON(respond["heros"]);
			$.each(json, function(key, value){
				$("#hero_pick").append(
					"<a class='hero_pick' href='#' id='"+key+"'>"
        				+"<img class='avatar' src='"+value["avatar"]+"'>"
        				+"<div class='name'>"+value["name"]+"</div>"
        				+"<div class='info'>"
          					+"<div class='type'>"
            					+value["type"]
            					+ATTACK_TYPES[value["attack_type"]]
            					+ARMOR_UNARMORED[value["armor_type"]]
          					+"</div>"
          					+"<div class='param'>"
            					+"速度："+value["speed"]
            					+"生命："+value["health"]
          					+"</div>"
        				+"</div>"
        				+"<div class='skill'>"+value["skill_name"]+"："+value["skill_description"]+"</div>"
      				+"</a>"
      			);
			});
		}
		else if (respond["action"] == "disable_hero"){
			var json = $.parseJSON(respond["hero_id"]);
			//hide list item
			$(".hero_pick[id='"+json+"']").addClass('disabled');
		}
		else if (respond["action"] == "game_start"){
			$("#cover").hide();
			$("#hero_pick").hide();
			$(".candidate_heros").hide();
			var index = -5;
			$.each (player1_heros, function(key, value){
				$(".hero[player='1'][hero='"+index+"']").attr("hero", key).append("<span class='health'>"+value["current_health"]+"/"+value["health"]+"</span><img src='"+value["avatar"]+"'/>");
				index += 1;
			});
			index = -5;
			$.each (player2_heros, function(key, value){
				$(".hero[player='2'][hero='"+index+"']").attr("hero", key).append("<span class='health'>"+value["current_health"]+"/"+value["health"]+"</span><img src='"+value["avatar"]+"'/>");
				index += 1;
			});

			var notice = respond["notice"];
			if (notice){
				alert(notice);
			}
		}
		else if (respond["action"] == "move"){
			$('embed').remove();
			$('body').append('<embed src="/mp3/move.wav" autostart="true" hidden="true" loop="false">');

			var player_id = respond["player_id"];
			var hero_id = respond["hero_id"];
			var x = respond["x"];
			var y = respond["y"];

			$(".hero[hero='"+hero_id+"']").parent().removeClass("has_hero").removeClass("wait_for_move");
			$(".hero[hero='"+hero_id+"']").remove();
			var value;
			if (player_id == 1){
				value = player1_heros[hero_id];
			}
			else {
				value = player2_heros[hero_id];
			}
			$("tr[pos='"+y+"'] td[pos='"+x+"']").addClass("has_hero").append("<a class=hero player='"+player_id+"' hero='"+hero_id+"' href='#'><span class='health'>"+value["current_health"]+"/"+value["health"]+"</span><img src='"+value["avatar"]+"'/></a>");
			$(".move_scope").removeClass("move_scope");
			show_menu($("tr[pos='"+y+"'] td[pos='"+x+"']"));
		}
		else if (respond["action"] == "game_over"){
			var result = respond["result"];
			if (result == "winner"){
				$('embed').remove();
				$('body').append('<embed src="/mp3/winner.mp3" autostart="true" hidden="true" loop="false">');
				alert("游戏结束！你胜利啦！");
			}
			else {
				$('embed').remove();
				$('body').append('<embed src="/mp3/loser.mp3" autostart="true" hidden="true" loop="false">');
				alert("游戏结束！你失败啦！");
			}
			

			
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



