$(document).ready(function(){
	alert("进入服务器对战！");
	open_socket();
	on_ready();
	on_pick_hero();
	hero_pos_init();
	on_search_move_scope_or_attacked();
	on_move();
	on_search_attack_scope();
	on_skill();
	on_standby();
	on_cancel();
});

var socket;
var playerID;
var player1_heros;
var player2_heros;
var playerTurn;

var ATTACK_TYPES = ["普通", "穿刺", "魔法"];
var ARMOR_UNARMORED = ["无甲", "中甲", "重甲"];


function open_socket(){
	socket = new WebSocket('ws://23.108.76.98:4040');

	// 打开Socket 
	socket.onopen = function(event){  //get player id from server
		var request = JSON.stringify({action: "get_player"});
		socket.send(request);
	};
	
	// 监听消息
	socket.onmessage = function(event) { 
		var respond = $.parseJSON(event["data"]);
		console.log(respond);
		if (respond["action"] == "get_player"){
			playerID = respond["position"];
			$("#notification").text("消息：进入对战服务器");
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
		else if (respond["action"] == "start_pick"){
			var request = JSON.stringify({action: "get_heros"});
			socket.send(request);
			$("#cover").show();
			$("#hero_pick").show();
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

function on_ready(){
	$("#ready").click(function(e){
		var request = JSON.stringify({action: "ready"});
		socket.send(request);
		$(this).hide();

		e.preventDefault();
	});
}

function on_pick_hero(id){
	$(".hero_pick").live("click", function(e){
		if ($(this).hasClass("disabled")){
			$('embed').remove();
			$('body').append('<embed src="/mp3/alert.wav" autostart="true" hidden="true" loop="false">');
			alert("该英雄已经选择过");
		}
		else {
			if (playerTurn == playerID){
				var id = $(this).attr("id");
				var json = JSON.stringify({action: "pick", hero_id: id});
				socket.send(json);
			}
			else {
				$('embed').remove();
				$('body').append('<embed src="/mp3/alert.wav" autostart="true" hidden="true" loop="false">');
				alert("不是你的回合");
			}
		}
	});
}

function close_socket(){
	// 关闭Socket.... 
	socket.close();
}




function hero_pos_init(){
	var playerA_pos = [[39, 1], [36, 1], [33, 1], [36, 3], [33, 3]];
	var playerB_pos = [[7, 14], [5, 15], [5, 18], [9, 15], [9, 18]];
	$.each(playerA_pos, function(i, e){
		$("tr[pos="+e[1]+"] td[pos="+e[0]+"]").addClass("has_hero").append("<a class='hero' player='1' hero='"+(i-5)+"' href='#'></a>");
	});
	$.each(playerB_pos, function(i, e){
		$("tr[pos="+e[1]+"] td[pos="+e[0]+"]").addClass("has_hero").append("<a class='hero' player='2' hero='"+(i-5)+"'href='#'></a>");
	});
}

function on_search_move_scope_or_attacked(){
	$(".hero").live("click", function(e){
		if (playerTurn == playerID){
			var can_search_move = $(".wait_for_move").length == 0;
			var can_attack = $(".wait_for_attack").length != 0;
			if (can_attack){     //attack
				if ($(this).attr("player") == playerID){
					$('embed').remove();
					$('body').append('<embed src="/mp3/alert.wav" autostart="true" hidden="true" loop="false">');
					alert("我去！自己人也打？");
				}
				else {
					if ($(this).parent().hasClass("attack_scope")){
						var hero_id = new Number($(".wait_for_attack").children(".hero").attr("hero"));
						var attack_type;
						if (player1_heros[hero_id]){
							attack_type = player1_heros[hero_id]["attack_type"];
						}
						else if (player2_heros[hero_id]){
							attack_type = player2_heros[hero_id]["attack_type"];
						}
						$('embed').remove();
						$('body').append('<embed src="/mp3/attack_'+attack_type+'.wav" autostart="true" hidden="true" loop="false">');

						attack($(".wait_for_attack").children(".hero"), $(this));
						$("#menu").parent().children(".hero").addClass("moved");
						$("#menu").addClass("hidden");
					}
					else {
						$('embed').remove();
						$('body').append('<embed src="/mp3/alert.wav" autostart="true" hidden="true" loop="false">');
						alert("对方不在攻击范围内");
					}
				}
			}
			else {
				if (can_search_move){    //saerch move
					if ($(this).hasClass("moved")){
						$('embed').remove();
						$('body').append('<embed src="/mp3/alert.wav" autostart="true" hidden="true" loop="false">');
						alert("已经移动过了");
					}
					else {
						if ($("#menu").hasClass("hidden")){
							if ($(this).attr("player") == playerID){
								$(".wait_for_move").removeClass("wait_for_move");
								$(".move_scope").removeClass("move_scope");
								$(this).parent().addClass("wait_for_move");

								var hero_id = new Number($(this).attr("hero"));
								var speed;
								if (player1_heros[hero_id]){
									speed = player1_heros[hero_id]["speed"];
								}
								else if (player2_heros[hero_id]){
									speed = player2_heros[hero_id]["speed"];
								}
								gen_move_scope($(this).parent(), speed);
							}
							else{
								if ($(this))
								$('embed').remove();
								$('body').append('<embed src="/mp3/alert.wav" autostart="true" hidden="true" loop="false">');
								alert("不能操作对方英雄");
							}
						}
					}
				}
				else {     //want to move to hero
					if ($(this).attr("hero") == $(".wait_for_move").children(".hero").attr("hero")){
						var hero_id = $(".wait_for_move").children(".hero").attr("hero");
						var x = new Number($(this).parent().attr("pos"));
						var y = new Number($(this).parent().parent().attr("pos"));

						var json = JSON.stringify({action: "move", hero_id: hero_id, x: x, y: y});
						socket.send(json);
					}
					else {
						$('embed').remove();
						$('body').append('<embed src="/mp3/alert.wav" autostart="true" hidden="true" loop="false">');
						alert("无法移动到目标");
					}
				}
			}
		}
		else {
			$('embed').remove();
			$('body').append('<embed src="/mp3/alert.wav" autostart="true" hidden="true" loop="false">');
			alert("不是你的回合");
		}
		

		e.preventDefault();
	});
}

function on_move(){
	$(".move_scope").live("click", function(e){
		var hero_id = $(".wait_for_move").children(".hero").attr("hero");
		var x = new Number($(this).attr("pos"));
		var y = new Number($(this).parent().attr("pos"));

		var json = JSON.stringify({action: "move", hero_id: hero_id, x: x, y: y});
		socket.send(json);
	});
}

function on_search_attack_scope(){
	$(".attack").live("click", function(e){
		$(this).parent().parent().addClass("wait_for_attack");

		var hero_id = new Number($(this).parent().parent().children(".hero").attr("hero"));
		var scope;
		if (player1_heros[hero_id]){
			scope = player1_heros[hero_id]["scope"];
		}
		else if (player2_heros[hero_id]){
			scope = player2_heros[hero_id]["scope"];
		}
		gen_attack_scope($(this).parent().parent(), scope);
		$("#menu").addClass("hidden");

		e.preventDefault();
	});
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

function on_standby(){
	$(".standby").live("click", function(e){
		var hero_id = $(this).parent().parent().children(".hero").attr("hero");
		var json = JSON.stringify({action: "standby", hero_id: hero_id});
		socket.send(json);

		$("#menu").parent().children(".hero").addClass("moved");
		$("#menu").addClass("hidden");

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







//=========================

function gen_move_scope($hero, speed){
	for (var i=0; i<speed; i++){
		$.each($(".wait_for_move, .candidate"), function(i, e){
			var x = new Number($(e).attr("pos"));
			var y = new Number($(e).parent().attr("pos"));

			var list = [
			$("tr[pos="+(y-1)+"] td[pos="+(x)+"]"),  
			$("tr[pos="+(y+1)+"] td[pos="+(x)+"]"),  
			$("tr[pos="+(y)+"] td[pos="+(x-1)+"]"), 
			$("tr[pos="+(y)+"] td[pos="+(x+1)+"]")
			];

			$.each(list, function(i, $e){
				if ($e.hasClass("O") && !$e.hasClass("has_hero")){
					$e.addClass("move_scope candidate");
				}
			});
		});
	}
	$(".candidate").removeClass("candidate");
}

function gen_attack_scope($hero, scope){
	for (var i=0; i<scope; i++){
		$.each($(".wait_for_attack, .candidate"), function(i, e){
			var x = new Number($(e).attr("pos"));
			var y = new Number($(e).parent().attr("pos"));

			var list = [
			$("tr[pos="+(y-1)+"] td[pos="+(x)+"]"),  
			$("tr[pos="+(y+1)+"] td[pos="+(x)+"]"),  
			$("tr[pos="+(y)+"] td[pos="+(x-1)+"]"), 
			$("tr[pos="+(y)+"] td[pos="+(x+1)+"]")
			];

			$.each(list, function(i, $e){
				if (!$e.hasClass("X")){
					$e.addClass("attack_scope candidate");
				}
			});
		});
	}
	$(".candidate").removeClass("candidate");
	$hero.removeClass("candidate attack_scope");
}

function show_menu($hero){
	if ($hero.children(".hero").attr("player") == ""+playerID){
		$hero.append($("#menu").removeClass("hidden"));
	}
}

function attack($a, $b){
	console.log($a);
	console.log($b);
	var hero_id = $a.attr("hero");
	var goal_id = $b.attr("hero");
	//attack
	var json = JSON.stringify({action: "attack", hero_id: hero_id, goal_id: goal_id});
	socket.send(json);
}