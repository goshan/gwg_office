class GameController < WebSocket::Controller
	@@room_game_engins = {}

	def before_filter
		current_room = nil
		Room.find_all.each do |room|
			if room.status == Room::STATUS_GAMING && room.include_user?(current_user)
				current_room = room
				params[:room_id] = room.id
				params[:game_id] = room.game_id
				break
			end
		end
		unless current_room
			send_message({:status => "error", :error => "user not in a started game"})
			return false
		end

		return true
	end

	def enter_game
		game = Game.find_by_id params[:game_id]
		unless game
			game = Game.new
			game.save!
			room = Room.find_by_id params[:room_id]
			room.game_id = game.id
			room.save!
		end
		if game.join(params[:user_id])
			if game.players.count == 2
				game_message(game, {:action => "get ready"})
			end
		else
			send_message({:status => "error", :error => "you have not had position"})
		end
	end

	def get_players
		game = Game.find_by_id params[:game_id]
		return send_message({:status => "error", :error => "you have not joined game"}) unless game
		players = []
		game.players.each do |key, player|
			players << player.to_json.merge({:self => player.id == params[:user_id]})
		end
		send_message({:action => "get players list", :status => game.status, :players => players})
	end

	# show all heroes for picking, not used in 1.0 version
	def get_heroes
		heroes = []
		Hero.all.each do |hero|
			heroes << hero.to_json
		end
		heroes << Hero.first.to_json
		send_message({:action => "get heroes list", :status => game.status, :heroes => heroes})
	end

	def assign_heroes
		game = Game.find_by_id params[:game_id]

		player = game.get_player current_user
		Hero.all.each do |hero|
			hero.picked! current_user.id, hero.id
			player.using_heroes[hero.id] = hero
		end
		# for there are only 4 heroes, using first hero twice
		hero = Hero.first
		hero.picked! current_user.id, 0
		player.using_heroes[0] = hero  # id was set to be "d1" to be different with "1"
		game.save!

		heroes = game.players[current_user.id].heroes_json
		send_message({:action => "assign heroes", :status => game.status, :heroes => heroes})
	end

	def check_hero
		hero_pos = params[:hero_pos].to_i
		game = Game.find_by_id params[:game_id]

		player = game.get_player current_user
		hero = player.using_heroes[hero_pos]
		send_message({:action => "check hero info", :status => game.status, :hero => hero.to_json(true)})
	end

	def deploy_hero
		hero_pos = params[:hero_pos].to_i
		x = params[:x].to_i
		y = params[:y].to_i
		game = Game.find_by_id params[:game_id]

		player = game.get_player current_user
		hero = player.using_heroes[hero_pos]
		hero.x = x
		hero.y = y
		game.save!

		send_message({:action => "player deployed hero", :status => game.status, :hero => hero.to_json(true)})
	end

	def ready
		game = Game.find_by_id params[:game_id]
		player = game.get_player current_user
		
		# check all heroes deployed
		if player.all_heroes_deployed?
			player.ready!
			game.save!
		else
			send_message({:status => "error", :error => "deploy all heores first"})
		end

		# check all player ready
		if game.all_players_ready?
			game.status = :gaming
			game_message(game, {:action => "ready for fight", :players => game.players_json})

			first_player = game.players.values[0]
			second_player = game.players.values[1]
			game.change_turn! first_player, second_player
			game.save!

			msg = "首先由#{first_player.nick_name}先行动"
			game_message(game, {:action => "notice", :msg => msg})
			send_message({:action => "alert", :msg => "请选择英雄行动"}, first_player.id)
		end
	end

	def move
		hero_pos = params[:hero_pos].to_i
		x = params[:x].to_i
		y = params[:y].to_i
		game = Game.find_by_id params[:game_id]

		player = game.get_player current_user
		hero = player.using_heroes[hero_pos]
		hero.x = x
		hero.y = y
		game.save!

		game_message(game, {:action => "update hero", :hero => hero.to_json(true), :show_menu => true})
	end

	def standby
		hero_pos = params[:hero_pos].to_i
		game = Game.find_by_id params[:game_id]

		player = game.get_player current_user
		hero = player.using_heroes[hero_pos]
		hero.acted!
		game_message(game, {:action => "update hero", :hero => hero.to_json(true)})
		
		player.check_turn_over!
		# change turn
		unless player.is_in_turn
			other = game.get_other_player current_user
			game.change_turn! other, player
			turn_change_update(other, player, game)
		end
		game.save!
	end

	def attack
		attack_hero_pos = params[:attack_hero_pos].to_i
		defense_hero_pos = params[:defense_hero_pos].to_i
		game = Game.find_by_id params[:game_id]
		attack_player = game.get_player current_user
		defense_player = game.get_other_player current_user
		attacker = attack_player.using_heroes[attack_hero_pos]
		defenser = defense_player.using_heroes[defense_hero_pos]
		
		# check attack scope
		if attacker.current_attack_length < (attacker.x-defenser.x).abs + (attacker.y-defenser.y).abs
			game_message(game, {:status => "error", :error => "out of attack scope"})
			return
		end
		damage = Hero.damage attacker, defenser
		defenser.current_health -= damage
		game_message(game, {:action => "notice", :msg => "#{attack_player.nick_name}的#{attacker.name}攻击#{defense_player.nick_name}的#{defenser.name}造成#{damage}点伤害"})
		defenser.check_alive!
		unless defenser.alive
			game_message(game, {:action => "notice", :msg => "#{defense_player.nick_name}的#{defenser.name}阵亡"})
		end
		attacker.acted!
		game_message(game, {:action => "update hero", :hero => attacker.to_json(true)})
		game_message(game, {:action => "update hero", :hero => defenser.to_json(true)})

		# check game over
		if defense_player.lose?
			attack_player.win_game
			defense_player.lose_game
			send_message({:action => "win", :msg => ""}, attack_player.id)
			send_message({:action => "lose", :msg => ""}, defense_player.id)
			game.destroy
			return
		end

		attack_player.check_turn_over!
		# change turn
		unless attack_player.is_in_turn
			game.change_turn! defense_player, attack_player
			turn_change_update(defense_player, attack_player, game)
		end
		game.save!
	end

	private
	
	def game_message game, json
		json.merge!({:status => game.status, :turn => game.turn})
		game.players.each do |key, player|
			send_message json, player.id
		end
	end

	def turn_change_update(acting_player, acted_player, game)
		acting_player.using_heroes.each do |hero_id, hero|
			if hero.alive
				game_message(game, {:action => "update hero", :hero => hero.to_json(true), :show_menu => false})
			end
		end
		acted_player.using_heroes.each do |hero_id, hero|
			if hero.alive
				game_message(game, {:action => "update hero", :hero => hero.to_json(true), :show_menu => false})
			end
		end

		msg = "#{acted_player.nick_name}的回合结束轮到#{acting_player.nick_name}行动"
		game_message(game, {:action => "notice", :msg => msg})
		send_message({:action => "alert", :msg => "请选择英雄行动"}, acting_player.id)
	end

end
