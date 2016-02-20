class RoomController < WebSocket::Controller

	def enter(params)
		room = Room.find_by_id params[:room_id]
		user = User.find_by_id params[:user_id]
		json = {:action => "user enter room", :room_id => room.id, :user_id => user.id, :user_name => user.nick_name, :user_win_cnt => user.win_count, :user_lose_cnt => user.loss_count}
		broadcast_message json
	end

	def leave(params)
		room = Room.find_by_id params[:room_id]
		user = User.find_by_id params[:user_id]
		json = {:action => "user leave room", :room_id => room.id, :user_id => user.id}
		broadcast_message json
	end

	def start_game(params)
		room = Room.find_by_id params[:room_id]
		user = User.find_by_id params[:user_id]
		json = {:action => "user start game", :room_id => room.id}
		broadcast_message json
	end

end
