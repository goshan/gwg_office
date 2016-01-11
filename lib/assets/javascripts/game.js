var player1_heros;
var player2_heros;
var playerTurn;

var ATTACK_TYPES = ["普通", "穿刺", "魔法"];
var ARMOR_UNARMORED = ["无甲", "中甲", "重甲"];

function init_player_id(){
	current_player_id = $('#current_user_id').text();
}

function print_console(msg){
	$('#console').append('<div>'+msg+'</div>');
}

function set_players(players){
	_.each(players, function(e, i){
		$('#players_status .player_info[pos='+(i+1)+']').attr('player', e['id']).children('.player_header').children('.player_name').text(e['name']+"("+e['rate']+")");
		if (e['self']){
			current_player_id = e['id'];
		}
	});
}

function set_heroes(player_id, heroes){
	$('#players_status .player_info[player='+player_id+'] .hero_status').remove();
	_.each(heroes, function(e, i){
		e['current_health'] = e['health'];
		var hero_status = template_to_html('hero_status_template', e);
		$('#players_status .player_info[player='+player_id+']').append(hero_status);
	});
}

function show_hero_info(hero){
	$('#notification .top .info .team').text("阵营: "+(hero['player_id'] == current_player_id ? "我方" : "敌方"));
	$('#notification .top .avatar img').attr('src', hero['avatar']);
	$('#notification .top .info .name').text(hero['name']);
	$('#notification .top .info .desc').text(hero['desc']);
	$('#notification .top .info .current_health').text("体力: "+hero['current_health']);
	$('#notification .top .info .current_speed').text("速度: "+hero['current_speed']);
	$('#notification .top .info .current_attack_length').text("攻击范围: "+hero['current_attack_length']);
	$('#notification .bottom .current_attack').text("攻击: "+hero['current_attack_value']+" 类型: "+hero['attack_desc']);
	$('#notification .bottom .current_defense').text("防御: "+hero['current_defense_value']+" 类型: "+hero['defense_desc']);
}

function check_ready(){
	var deployed_hero_cnt = $('#map .hero[player='+current_player_id+']').length;
	if (deployed_hero_cnt >= 5){
		$('#players_status .player_info[player='+current_player_id+'] .ready').removeClass('hidden');
	}
}

function clear_players_status_heroes(){
	$('#players_status .player_info .hero_status').remove();
}







function on_hero_status_select(){
	$('#players_status').on('click', '.hero_status', function(e){
		var player_id = $(this).parent().attr('player');
		var pos = $(this).attr('pos');
		send_message({engin: "game", action: "check_hero", player_id: player_id, hero_pos: pos})
		if (player_id == current_player_id && current_status == "deploying"){
			selected_hero_pos = pos;
		}
		
		e.preventDefault();
	});
}

function on_ready(){
	$('#players_status').on('click', '.ready', function(e){
		print_console("部署完毕，等待对手");
		send_message({engin: "game", action: "ready"})
		$('#players_status .ready').addClass('hidden');

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
