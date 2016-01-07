class SocketUtil

	SOCKET_FILTER = {
		:room => ["enter", "leave", "start_game"], 
		:gamemanage => ["enter_game", "get_players"]
	}

	class << self

		def parse_message(msg, ws)
			begin
				json = JSON.parse msg, {:symbolize_names => true}
			rescue JSON::ParserError
				response = JSON.generate({:status => 'error', :error => "json format error"})
				ws.send(response)
				return
			end

			unless json[:engin] && json[:action]
				response = JSON.generate({:status => 'error', :error => "engin or action missing"})
				ws.send(response)
				return
			end
			engin = json[:engin].to_sym

			if json[:engin] == "socket" && json[:action] == "register"
				SocketManager.bind_socket json[:user_id].to_i, ws
			elsif SOCKET_FILTER.keys.include?(engin) && SOCKET_FILTER[engin].include?(json[:action])
				json[:user_id] = SocketManager.user_by_socket ws
				if "#{json[:engin].capitalize}Engin".constantize.send("before_filter", json)
					"#{json[:engin].capitalize}Engin".constantize.send(json[:action], json)
				end
			else
				response = JSON.generate({:status => 'error', :error => "unsupport engin or action"})
				ws.send(response)
			end
		end

		def send_message(json, user_id)
			msg = JSON.generate json
			ws = SocketManager.socket_by_user user_id
			if ws
				ws.send msg
				puts "send message to user: #{user_id} with signature: #{ws.signature}: #{json}"
			else
				puts "send message failed for no socket found. user: #{user_id}, json: #{json}"
			end
		end

		def broadcast_message(json)
			msg = JSON.generate json
			SocketManager.all_sockets.each do |ws|
				ws.send msg
			end
			puts "broadcast to all sockets: #{json}"
		end
	end
	
end
