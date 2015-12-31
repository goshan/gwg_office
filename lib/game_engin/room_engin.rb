class RoomEngin

	class << self
		def enter(params)
			room = Room.find_by_id params[:room_id]
			entered_user = User.find_by_id params[:current_user_id]
			room.players.each do |player|
				unless player.id == params[:current_user_id].to_i
					SocketUtil.send_message({:action => "user enter room", :room_id => room.id, :user_id => entered_user.id, :user_name => entered_user.nick_name, :user_win_cnt => entered_user.win_count, :user_lose_cnt => entered_user.loss_count}, player.id)
				end
			end
		end

		def leave
		end
	end
end
