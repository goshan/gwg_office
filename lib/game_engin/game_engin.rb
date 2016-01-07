class GameEngin < Engin
	attr_accessor :players, :status, :turn, :round

	def initialize
		@status = :waiting
		@players = {}
		@turn = 0
		@round = 0
	end

	def join(user_id)
		if players[1].nil?
			@players[1] = user_id
			return 1
		end
		
		if players[2].nil?
			self.players[2] = user_id
			self.notice_message({:action => "get ready"})
			return 2
		end

		return 0
	end

	def notice_message(json)
		players.each do |key, player|
			SocketUtil.send_message json, player
		end
	end
end
