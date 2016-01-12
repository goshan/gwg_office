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
		user.init!
		if @players.count < 2
			@players[user.id] = user
		end
		
		if @players.count == 2
			self.status = :deploying
			self.notice_message({:action => "get ready"})
		end
		puts user.ready?

		return @players.count > 2 ? false : true
	end

	def assign_heroes(user_id)
		player = @players[user_id]
		Hero.all.each do |hero|
			hero.picked! user_id, hero.id
			player.using_heroes[hero.id] = hero
		end
		# for there are only 4 heroes, using first hero twice
		hero = Hero.first
		hero.picked! user_id, 0
		player.using_heroes[0] = hero  # id was set to be "d1" to be different with "1"

		@players[user_id].heroes_json
	end

	def check_hero(user_id, hero_pos)
		player = @players[user_id]
		player.using_heroes[hero_pos]
	end

	def deploy_hero(user_id, hero_pos, x, y)
		player = @players[user_id]
		hero = player.using_heroes[hero_pos]
		hero.x = x
		hero.y = y
		hero
	end

	def ready(user_id)
		player = @players[user_id]
		# check all heroes deployed
		all_deployed = true
		player.using_heroes.each do |hero_pos, hero|
			unless hero.x && hero.y
				all_deployed = false
				break;
			end
		end
		if all_deployed
			player.ready!
		end

		# check all player ready
		all_ready = true
		@players.each do |id, p|
			unless p.ready?
				all_ready = false
				break;
			end
		end
		if all_ready
			self.status = :gaming
			self.turn = self.players.first.first
			self.round = 1
			players = []
			@players.each do |id, p|
				players << p.to_json(true)
			end
			self.notice_message({:action => "ready for fight", :players => players})
		end
	end

	def move_hero(user_id, hero_pos, x, y)
		player = @players[user_id]
		hero = player.using_heroes[hero_pos]
		hero.x = x
		hero.y = y
		self.notice_message({:action => "user moved hero", :hero => hero.to_json(true)})
	end

	def stop
		@status = :end
		@players = {}
	end

	def notice_message(json)
		json.merge!({:status => self.status, :turn => self.turn})
		players.each do |key, player|
			SocketUtil.send_message json, player.id
		end
	end
end
