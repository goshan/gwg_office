if ($('#rooms_game').length != 0){
	print_console('进入对战服务器，等待其他玩家');
	init_player_id();
	init_template();
	open_socket('ws://0.0.0.0:4040');
//	on_pick_hero();
//	hero_pos_init();
//	on_search_move_scope_or_attacked();
//	on_move();
//	on_search_attack_scope();
//	on_skill();
//	on_standby();
//	on_cancel();
}

