class GameController < WebSocket::Controller
	@@room_game_engins = {}

	def before_filter(params)
		user = User.find_by_id params[:user_id]
		current_room = nil
		Room.find_all.each do |room|
			if room.status == Room::STATUS_GAMING && room.include_user?(user)
				current_room = room
				params[:room_id] = room.id
				params[:game_id] = room.game_id
				break
			end
		end
		unless current_room
			send_message({:status => "error", :error => "user not in a started game"}, params[:user_id])
			return false
		end

		return true
	end

	def enter_game(params)
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
			send_message({:status => "error", :error => "you have not had position"}, params[:user_id])
		end
	end

	def get_players(params)
		game = Game.find_by_id params[:game_id]
		return send_message({:status => "error", :error => "you have not joined game"}) unless game
		players = []
		game.players.each do |key, player|
			players << player.to_json.merge({:self => player.id == params[:user_id]})
		end
		send_message({:action => "get players list", :status => game_engin.status, :players => players}, params[:user_id])
	end

	# show all heroes for picking, not used in 1.0 version
	def get_heroes(params)
		heroes = []
		Hero.all.each do |hero|
			heroes << hero.to_json
		end
		heroes << Hero.first.to_json
		send_message({:action => "get heroes list", :status => "deploying", :heroes => heroes}, params[:user_id])
	end

	def assign_heroes(params)
		game_engin = @@room_game_engins[params[:room_id]]
		heroes = game_engin.assign_heroes params[:user_id]
		send_message({:action => "assign heroes", :status => game_engin.status, :heroes => heroes}, params[:user_id])
	end

	def check_hero(params)
		game_engin = @@room_game_engins[params[:room_id]]
		hero = game_engin.check_hero params[:player_id].to_i, params[:hero_pos].to_i
		send_message({:action => "check hero info", :status => game_engin.status, :hero => hero.to_json(true)}, params[:user_id])
	end

	def deploy_hero(params)
		game_engin = @@room_game_engins[params[:room_id]]
		hero = game_engin.deploy_hero params[:user_id], params[:hero_pos].to_i, params[:x].to_i, params[:y].to_i
		send_message({:action => "player deployed hero", :status => game_engin.status, :hero => hero.to_json(true)}, params[:user_id])
	end

	def ready(params)
		@@room_game_engins[params[:room_id]].ready(params[:user_id])
	end

	def move(params)
		@@room_game_engins[params[:room_id]].move_hero(params[:user_id], params[:hero_pos].to_i, params[:x].to_i, params[:y].to_i)
	end

	def standby(params)
		@@room_game_engins[params[:room_id]].standby_hero(params[:user_id], params[:hero_pos].to_i)
	end

	def attack(params)
		@@room_game_engins[params[:room_id]].attack(params[:user_id], params[:attack_hero_pos].to_i, params[:defense_hero_pos].to_i)
	end

	def stop_game(params)
		game_engin = @@room_game_engins[params[:room_id]]
		game_engin.notice_message({:action => "game end with exception"})
		game_engin.stop
		@@room_game_engins.delete params[:room_id]
	end

	private
	
	def game_message game, json
		json.merge!({:status => game.status, :turn => game.turn})
		game.players.each do |key, player|
			send_message json, player.id
		end
	end

end
