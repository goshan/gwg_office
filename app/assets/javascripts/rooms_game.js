if ($('#rooms_game').length != 0){
  print_console('进入对战服务器，等待其他玩家');
  init_player_id();
  init_template();
  var domain = $('#socket_domain').text();
  open_socket(domain);
  on_hero_status_select();
  on_hero_deploy();
  on_ready();
  on_hero_clicked();
  on_move();
  on_search_attack_scope();
//  on_skill();
  on_standby();
  on_cancel();
}

