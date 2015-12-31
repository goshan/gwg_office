namespace :web_socket do
	desc "start web socket server"
	task :start => :environment do
		EM.run do 
			puts "Begin listen 0.0.0.0:4040"
			EM::WebSocket.start(:host => "0.0.0.0", :port => 4040) do |ws|
				ws.onopen do |handshake|
					puts "user with signature #{ws.signature} connected"
				end

				ws.onmessage do |msg|
					puts "user with signature #{ws.signature} sent message #{msg}"
					SocketUtil.parse_message msg, ws
				end

				ws.onclose do 
					SocketManager.unbind_socket ws
					puts "user with signature #{ws.signature} disconnected"
				end
			end
		end
	end
end
