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


