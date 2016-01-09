class GameManager
	attr_accessor :players, :status, :turn, :round

	def initialize
		@status = :waiting
		@players = {}
		@turn = 0
		@round = 0
	end

	def join(user_id)
		user = User.find_by_id user_id
		user.ready!
		if @players.count < 2
			@players[user.id] = user
		end
		
		if @players.count == 2
			self.notice_message({:action => "get ready", :status => "deploying"})
		end

		return @players.count > 2 ? false : true
	end

	def assign_heroes(user_id)
		player = @players[user_id]
		Hero.all.each do |hero|
			hero.picked! hero.id
			player.using_heroes[hero.id] = hero
		end
		# for there are only 4 heroes, using first hero twice
		hero = Hero.first
		hero.picked! 0
		player.using_heroes[0] = hero  # id was set to be "d1" to be different with "1"

		@players[user_id].using_heroes.values.map{|e| e.to_json}
	end

	def stop
		@status = :end
		@players = {}
	end

	def notice_message(json)
		players.each do |key, player|
			SocketUtil.send_message json, player.id
		end
	end
end
