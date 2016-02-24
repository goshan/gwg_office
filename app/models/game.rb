class Game < CacheRecord
	attr_accessor :id, :players, :status, :turn, :round

	def initialize
		@status = :waiting
		@players = {}
		@turn = 0
		@round = 0
	end

	def to_cache
		JSON.generate({:id => @id, :status => @status, :turn => @turn, :round => @round, :players => @players.values.map{|p| p.to_json(true)}})
	end

	def self.from_cache(str)
		json = JSON.parse str, {:symbolize_names => true}
		game = Game.new
		game.id = json[:id]
		game.status = json[:status]
		game.turn = json[:turn]
		game.round = json[:round]
		json[:players].each do |p|
			user = User.find_by_id p[:id]
			user.is_ready = p[:is_ready]
			user.is_in_turn = p[:is_in_turn]
			user.using_heroes = {}
			p[:heroes].each do |i, h|
				hero = Hero.find_by_id h[:id]
				hero.pos = h[:pos]
				hero.x = h[:x]
				hero.y = h[:y]
				hero.player_id = h[:player_id]
				hero.current_health = h[:current_health]
				hero.current_attack_value = h[:current_attack_value]
				hero.current_attack_length = h[:current_attack_length]
				hero.current_defense_value = h[:current_defense_value]
				hero.current_speed = h[:current_speed]
				hero.skill_used = h[:skill_used]
				hero.turn_acted = h[:turn_acted]
				hero.alive = h[:alive]
				user.using_heroes[i.to_s.to_i] = hero
			end
			game.players[user.id] = user
		end
		game
	end

	def join(user_id)
		user = User.find_by_id user_id
		user.init!
		if @players.count < 2
			@players[user.id] = user
		end
		
		if @players.count == 2
			self.status = :deploying
		end

		self.save!

		return @players.count > 2 ? false : true
	end

	def get_player(user)
		@players[user.id]
	end

	def get_other_player(user)
		@players.each do |player_id, player|
			unless player_id == user.id
				return player
			end
		end
	end

	def all_players_ready?
		all_ready = true
		@players.each do |id, p|
			unless p.ready?
				all_ready = false
				break;
			end
		end
		all_ready
	end

	def players_json
		players = []
		@players.each do |id, p|
			players << p.to_json(true)
		end
		players
	end

	def change_turn!(acting_player, acted_player)
		self.round += 1
		acting_player.refresh_hero_act!
		acting_player.is_in_turn = true
		acted_player.refresh_hero_act!
		acted_player.is_in_turn = false
		self.turn = acting_player.id
	end
end
