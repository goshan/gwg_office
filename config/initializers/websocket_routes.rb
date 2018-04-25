WebSocket::Routes.setup do
  {
    :room => [
      "enter", 
      "leave", 
      "start_game"
    ],

    :game => [
      "enter_game", 
      "get_players", 
      "assign_heroes", 
      "check_hero", 
      "deploy_hero", 
      "ready", 
      "move", 
      "standby", 
      "attack"
    ]
  }
end
