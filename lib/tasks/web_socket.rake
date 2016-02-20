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
					begin
						WebSocket::Parser.parse_message msg, ws
					rescue Exception => e
						puts "============>> Exception <<============"
						puts e.inspect
						puts e.backtrace
						response = JSON.generate({:status => "error", :error => "invalid request"})
						ws.send(response)
						puts "===============>> End <<==============="
					end
				end

				ws.onclose do 
					WebSocket::Parser.close_socket ws
					puts "user with signature #{ws.signature} disconnected"
				end
			end
		end
	end
end
