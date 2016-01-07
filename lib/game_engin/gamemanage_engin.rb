class GamemanageEngin < Engin
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
				@@room_game_engins[params[:room_id]] = GameEngin.new
			end
			game_engin = @@room_game_engins[params[:room_id]]
			game_engin.notice_message({:status => "error", :error => "you have not had position"}) if game_engin.join(params[:user_id]) == 0
		end

		def get_players(params)
			user = User.find_by_id params[:user_id]
			players = []
			@@room_game_engins[params[:room_id]].players.each do |key, player_id|
				puts player_id
				player = User.find_by_id player_id
				rate = player.win_count+player.loss_count == 0 ? 'new' : "#{player.win_count*1.00/(player.win_count+player.loss_count)*100}%"
				players << {:id => player.id, :name => player.nick_name, :rate => rate, :self => player.id == user.id}
			end
			SocketUtil.send_message({:action => "get players list", :players => players}, user.id)
		end
	end
end
