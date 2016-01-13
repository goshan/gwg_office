class GameEngin < Engin
	@@room_game_engins = {}

	class << self
		def before_filter(params)
			user = User.find_by_id params[:user_id]
			current_room = nil
			Room.find_all.each do |room|
				if room.status == Room::STATUS_GAMING && room.include_user?(user)
					current_room = room
					params[:room_id] = room.id
					break
				end
			end
			unless current_room
				SocketUtil.send_message({:status => "error", :error => "user not in a started game"}, params[:user_id])
				return false
			end

			return true
		end

		def enter_game(params)
			unless @@room_game_engins[params[:room_id]]
				@@room_game_engins[params[:room_id]] = GameManager.new
			end
			game_engin = @@room_game_engins[params[:room_id]]
			game_engin.notice_message({:status => "error", :error => "you have not had position"}) unless game_engin.join(params[:user_id])
		end

		def get_players(params)
			players = []
			game_engin = @@room_game_engins[params[:room_id]]
			game_engin.players.each do |key, player|
				players << player.to_json.merge({:self => player.id == params[:user_id]})
			end
			SocketUtil.send_message({:action => "get players list", :status => game_engin.status, :players => players}, params[:user_id])
		end

		# show all heroes for picking, not used in 1.0 version
		def get_heroes(params)
			heroes = []
			Hero.all.each do |hero|
				heroes << hero.to_json
			end
			heroes << Hero.first.to_json
			SocketUtil.send_message({:action => "get heroes list", :status => "deploying", :heroes => heroes}, params[:user_id])
		end

		def assign_heroes(params)
			game_engin = @@room_game_engins[params[:room_id]]
			heroes = game_engin.assign_heroes params[:user_id]
			SocketUtil.send_message({:action => "assign heroes", :status => game_engin.status, :heroes => heroes}, params[:user_id])
		end

		def check_hero(params)
			game_engin = @@room_game_engins[params[:room_id]]
			hero = game_engin.check_hero params[:player_id].to_i, params[:hero_pos].to_i
			SocketUtil.send_message({:action => "check hero info", :status => game_engin.status, :hero => hero.to_json(true)}, params[:user_id])
		end

		def deploy_hero(params)
			game_engin = @@room_game_engins[params[:room_id]]
			hero = game_engin.deploy_hero params[:user_id], params[:hero_pos].to_i, params[:x].to_i, params[:y].to_i
			SocketUtil.send_message({:action => "player deployed hero", :status => game_engin.status, :hero => hero.to_json(true)}, params[:user_id])
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
	end
end
