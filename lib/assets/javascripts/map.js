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
	hero['moved_class'] = hero['turn_acted'] ? 'moved' : ''

	$(".hero[player='"+player_id+"'][hero='"+hero_pos+"']").parent().removeClass("has_hero").removeClass("wait_for_move").removeClass("wait_for_attack");
	$(".hero[player='"+player_id+"'][hero='"+hero_pos+"']").remove();
	if (hero['alive']) {
		var hero_in_map = template_to_html('hero_in_map_template', hero);
		$("tr[pos='"+y+"'] td[pos='"+x+"']").addClass("has_hero").append(hero_in_map);
	}
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

			var speed = new Number($hero.children('.speed').text());
			gen_move_scope(speed);
		}
		else{
			soundeffect('alert');
			alert("不能操作对方英雄");
		}
	}
}

function gen_move_scope(speed){
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

function show_attack_scope($hero){
	if ($hero.attr('player') == current_player_id){
		$(".wait_for_attack").removeClass("wait_for_attack");
		$(".attack_scope").removeClass("attack_scope");
		$hero.parent().addClass("wait_for_attack");

		var attack_length = new Number($hero.children('.attack_length').text());
		gen_attack_scope(attack_length);
	}
	else{
		soundeffect('alert');
		alert("不能操作对方英雄");
	}
}

function gen_attack_scope(attack_length){
	for (var i=0; i<attack_length; i++){
		$.each($(".wait_for_attack, .candidate"), function(i, e){
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
				if (!$e.hasClass("X") && !$e.hasClass("wait_for_attack")){
					$e.addClass("attack_scope candidate");
				}
			});
		});
	}
	$(".candidate").removeClass("candidate");
}

function move_hero(hero_pos, pos){
	var x = pos['x'];
	var y = pos['y'];
	soundeffect('move');
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

function attack($attacker, $defenser){
	var attack_hero_pos = $attacker.attr('hero');
	var defense_hero_pos = $defenser.attr('hero');
	var attack_type = $attacker.children('.attack_type').text();
	soundeffect('attack_'+attack_type);
	send_message({engin: "game", action: "attack", attack_hero_pos: attack_hero_pos, defense_hero_pos: defense_hero_pos});
	$('.wait_for_attack').removeClass("wait_for_attack");
}
// ================ end ==============//







// ================ bind listener ==============//
function on_hero_deploy(){
	$('#map').on('click', '.I', function(e){
		if (current_status == "deploying"){
			if ($(this).hasClass('has_hero')){
				alert('该位置已经有了部署');
			}
			else if (selected_hero_pos){
				var pos = get_pos($(this));
				send_message({engin: "game", action: "deploy_hero", hero_pos: selected_hero_pos, x: pos['x'], y: pos['y']});
				selected_hero_pos = null;
			}
		}

		e.preventDefault();
	});
}

function on_hero_clicked(){   // search move scope or attack
	$("#map").on("click", ".hero", function(e){
		if (current_status == "gaming"){
			if (current_player_id == current_player_turn){
				var click_hero_player_id = $(this).attr('player');
				var can_search_move = $(".wait_for_move").length == 0;
				var can_attack = $(".wait_for_attack").length != 0;
				if (can_attack){  // after search attack scope, waiting for selecting attack object
					if ($(this).attr("player") == current_player_id){
						soundeffect('alert');
						alert("我去！自己人也打？");
					}
					else{   // attack heroes of other player
						if ($(this).parent().hasClass("attack_scope")){   //in attack scope
							var $attacker = $('.wait_for_attack').children('.hero');
							var $defenser = $(this);
							attack($attacker, $defenser);
							$("#menu").addClass("hidden");
						}
						else {
							soundeffect('alert');
							alert("对方不在攻击范围内");
						}
					}
				}
				else if (can_search_move){    //still not searched move scope
					if ($(this).attr("player") == current_player_id){
						if ($(this).hasClass("moved")){
							soundeffect('alert');
							alert("已经移动过了");
						}
						else {
							show_move_scope($(this));
						}
					}
				}
				else {     //click hero after searched move scope
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
		}

		e.preventDefault();
	});
}

function on_move(){
	$("#map").on("click", '.move_scope', function(e){
		if (current_status == "gaming"){
			var hero_pos = $(".wait_for_move").children(".hero").attr("hero");
			var pos = get_pos($(this));
			move_hero(hero_pos, pos);
		}

		e.preventDefault();
	});
}

function on_standby(){
	$("#map").on("click", '.standby', function(e){
		if (current_status == "gaming"){
			var hero_pos = $(this).parent().parent().children(".hero").attr("hero");
			send_message({engin: "game", action: "standby", hero_pos: hero_pos});

			$("#menu").addClass("hidden");
		}

		e.preventDefault();
	});
}

function on_search_attack_scope(){
	$("#menu").on("click", '.attack', function(e){
		if (current_status == "gaming"){
			var $hero = $(this).parent().parent().children(".hero");
			show_attack_scope($hero);
			$("#menu").addClass("hidden");
		}

		e.preventDefault();
	});
}
// ================ end ==============//







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


