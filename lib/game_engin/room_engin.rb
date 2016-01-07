class RoomEngin

	class << self
		def enter(params)
			room = Room.find_by_id params[:room_id]
			user = User.find_by_id params[:user_id]
			json = {:action => "user enter room", :room_id => room.id, :user_id => user.id, :user_name => user.nick_name, :user_win_cnt => user.win_count, :user_lose_cnt => user.loss_count}
			SocketUtil.broadcast_message json
		end

		def leave(params)
			room = Room.find_by_id params[:room_id]
			user = User.find_by_id params[:user_id]
			json = {:action => "user leave room", :room_id => room.id, :user_id => user.id}
			SocketUtil.broadcast_message json
		end

		def start_game(params)
			puts params.inspect
			room = Room.find_by_id params[:room_id]
			user = User.find_by_id params[:user_id]
			json = {:action => "user start game", :room_id => room.id}
			SocketUtil.broadcast_message json
		end
	end
end
