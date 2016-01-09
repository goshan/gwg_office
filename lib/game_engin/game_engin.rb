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
			@@room_game_engins[params[:room_id]].players.each do |key, player|
				rate = player.win_count+player.loss_count == 0 ? 'new' : "#{player.win_count*1.00/(player.win_count+player.loss_count)*100}%"
				players << {:id => player.id, :name => player.nick_name, :rate => rate}
			end
			SocketUtil.send_message({:action => "get players list", :status => "deploying", :players => players}, params[:user_id])
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
			heroes = @@room_game_engins[params[:room_id]].assign_heroes params[:user_id]
			SocketUtil.send_message({:action => "assign heroes", :status => "deploying", :heroes => heroes}, params[:user_id])
		end

		def stop_game(params)
			game_engin = @@room_game_engins[params[:room_id]]
			game_engin.notice_message({:action => "game end with exception"})
			game_engin.stop
			@@room_game_engins.delete params[:room_id]
		end
	end
end