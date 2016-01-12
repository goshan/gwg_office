// ================ prepare game ==============//
function init_map(){
	var player_pos = $('#players_status .player_info[player='+current_player_id+']').attr('pos');
	var init_class;
	var remove_class;
	if (player_pos == "1"){
		init_class = 'A';
		remove_class = 'B';
	}
	else if (player_pos == "2"){
		init_class = 'B';
		remove_class = 'A';
	}
	$('#map .'+init_class).removeClass(init_class).addClass('I');
	$('#map .'+remove_class).removeClass(remove_class).addClass('O');
}

function remove_init_flag(){
	$('#map .I').removeClass('I').addClass('O');
}

function get_pos($grid){
	var x = new Number($grid.attr("pos"));
	var y = new Number($grid.parent().attr("pos"));
	return {x: x, y: y};
}

function get_grid(pos){
	return $('#map tr[pos='+pos['y']+'] td[pos='+pos['x']+']');
}

function update_hero(hero){
	var player_id = hero["player_id"];
	var hero_pos = hero["pos"];
	var x = hero["x"];
	var y = hero["y"];

	$(".hero[player='"+player_id+"'][hero='"+hero_pos+"']").parent().removeClass("has_hero").removeClass("wait_for_move");
	$(".hero[player='"+player_id+"'][hero='"+hero_pos+"']").remove();
	var hero_in_map = template_to_html('hero_in_map_template', hero);
	$("tr[pos='"+y+"'] td[pos='"+x+"']").addClass("has_hero").append(hero_in_map);
}

function clear_map_heroes(){
	$(".has_hero").removeClass("wait_for_move");
	$(".hero").remove();
}

function soundeffect(type){
	$('embed').remove();
	$('body').append('<embed src="/mp3/'+type+'.wav" autostart="true" hidden="true" loop="false">');
}
// ================ end ==============//



// ================ do the game ==============//
function show_move_scope($hero){
	if ($("#menu").hasClass("hidden")){
		if ($hero.attr("player") == current_player_id){
			$(".wait_for_move").removeClass("wait_for_move");
			$(".move_scope").removeClass("move_scope");
			$hero.parent().addClass("wait_for_move");

			var hero_pos = new Number($hero.attr("hero"));
			var speed = new Number($hero.children('.speed').text());
			gen_move_scope($hero.parent(), speed);
		}
		else{
			soundeffect('alert');
			alert("不能操作对方英雄");
		}
	}
}

function gen_move_scope($hero, speed){
	for (var i=0; i<speed; i++){
		$.each($(".wait_for_move, .candidate"), function(i, e){
			var pos = get_pos($(e));
			var x = pos['x'];
			var y = pos['y'];

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

function move_hero(hero_pos, pos){
	var x = pos['x'];
	var y = pos['y'];
	send_message({engin: "game", action: "move", hero_pos: hero_pos, x: x, y: y});
}

function clear_scope(){
	$('.move_scope').removeClass('move_scope');
	$('.attack_scope').removeClass('attack_scope');
}

function show_menu($grid){
	if ($grid.children(".hero").attr("player") == ""+current_player_id){
		$grid.append($("#menu").removeClass("hidden"));
	}
}
// ================ end ==============//







function on_hero_deploy(){
	$('#map').on('click', '.I', function(e){
		if ($(this).hasClass('has_hero')){
			alert('该位置已经有了部署');
		}
		else if (selected_hero_pos){
			var pos = get_pos($(this));
			send_message({engin: "game", action: "deploy_hero", hero_pos: selected_hero_pos, x: pos['x'], y: pos['y']});
			selected_hero_pos = null;
		}

		e.preventDefault();
	});
}

function on_search_move_scope_or_attack(){
	$("#map").on("click", ".hero", function(e){
		if (current_player_id == current_player_turn){
			var can_search_move = $(".wait_for_move").length == 0;
			if (can_search_move){    //no hero selected
				if ($(this).hasClass("moved")){
					soundeffect('alert');
					alert("已经移动过了");
				}
				else {
					show_move_scope($(this));
				}
			}
			else {     //click hero after selected other hero
				if ($(this).attr("hero") == $(".wait_for_move").children(".hero").attr("hero")){ // clicking hero is selected hero
					var hero_pos = $(".wait_for_move").children(".hero").attr("hero");
					var pos = get_pos($(this).parent());
					move_hero(hero_pos, pos);
				}
				else {
					soundeffect('alert');
					alert("无法移动到目标");
				}
			}
		}

		e.preventDefault();
	});
}

function on_move(){
	$("#map").on("click", '.move_scope', function(e){
		var hero_pos = $(".wait_for_move").children(".hero").attr("hero");
		var pos = get_pos($(this));
		move_hero(hero_pos, pos);

		e.preventDefault();
	});
}

function on_standby(){
	$("#map").on("click", '.standby', function(e){
		var hero_id = $(this).parent().parent().children(".hero").attr("hero");
		var json = JSON.stringify({action: "standby", hero_id: hero_id});
		socket.send(json);

		$("#menu").parent().children(".hero").addClass("moved");
		$("#menu").addClass("hidden");

		e.preventDefault();
	});
}







function on_search_move_scope_or_attack_bak(){
	$("#map").on("click", ".hero", function(e){
		if (current_player_id == current_player_turn){
			var can_search_move = $(".wait_for_move").length == 0;
			var can_attack = $(".wait_for_attack").length != 0;
			if (can_attack){     //attack
				if ($(this).attr("player") == current_player_id){
					soundeffect('alert');
					alert("我去！自己人也打？");
				}
				else {
					if ($(this).parent().hasClass("attack_scope")){   //in attack scope
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
						soundeffect('alert');
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
			soundeffect('alert');
			alert("不是你的回合");
		}
		

		e.preventDefault();
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



function attack($a, $b){
	console.log($a);
	console.log($b);
	var hero_id = $a.attr("hero");
	var goal_id = $b.attr("hero");
	//attack
	var json = JSON.stringify({action: "attack", hero_id: hero_id, goal_id: goal_id});
	socket.send(json);
}
