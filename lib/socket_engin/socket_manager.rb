class SocketManager

	@@player_socket = {}
	@@signature_player = {}

	class << self
		def bind_socket(user_id, ws)
			@@player_socket[user_id] = ws
			@@signature_player[ws.signature] = user_id
		end

		def unbind_socket(ws)
			user_id = @@signature_player[ws.signature]
			@@player_socket.delete user_id
			@@signature_player.delete ws.signature
		end

		def unbind_user(user_id)
			@@signature = @@player_socket[user_id].signature
			@@player_socket.delete user_id
			@@signature_player.delete signature
		end

		def all_sockets
			@@player_socket.values
		end

		# transport between user and socket
		def socket_by_user(user_id)
			@@player_socket[user_id]
		end

		def user_by_socket(ws)
			@@signature_player[ws.signature]
		end
	end
end
