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

		return @players.count > 2 ? false : true
	end

	def assign_heroes(user_id)
		player = @players[user_id]
#		Hero.all.each do |hero|
#			hero.picked! user_id, hero.id
#			player.using_heroes[hero.id] = hero
#		end
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
			players = []
			@players.each do |id, p|
				players << p.to_json(true)
			end
			self.notice_message({:action => "ready for fight", :players => players})

			first_player = self.players.values[0]
			second_player = self.players.values[1]
			self.change_turn first_player, second_player
		end
	end

	def move_hero(user_id, hero_pos, x, y)
		player = @players[user_id]
		hero = player.using_heroes[hero_pos]
		hero.x = x
		hero.y = y
		self.notice_message({:action => "update hero", :hero => hero.to_json(true), :show_menu => true})
	end

	def standby_hero(user_id, hero_pos)
		player = @players[user_id]
		hero = player.using_heroes[hero_pos]
		hero.acted!
		self.notice_message({:action => "update hero", :hero => hero.to_json(true)})
		
		player.check_turn_over!
		# change turn
		unless player.is_in_turn
			other = nil
			@players.each do |player_id, player|
				unless player_id == user_id
					other = player
					break
				end
			end
			self.change_turn other, player
		end
	end

	def attack(attack_player_id, attack_hero_pos, defense_hero_pos)
		attack_player = @players[attack_player_id]
		defense_player = nil
		@players.each do |player_id, player|
			unless player_id == attack_player_id
				defense_player = player
				break
			end
		end
		attacker = attack_player.using_heroes[attack_hero_pos]
		defenser = defense_player.using_heroes[defense_hero_pos]
		
		# check attack scope
		if attacker.current_attack_length < (attacker.x-defenser.x).abs + (attacker.y-defenser.y).abs
			self.notice_message({:status => "error", :error => "out of attack scope"})
			return
		end
		damage = Hero.damage attacker, defenser
		defenser.current_health -= damage
		self.notice_message({:action => "notice", :msg => "#{attack_player.nick_name}的#{attacker.name}攻击#{defense_player.nick_name}的#{defenser.name}造成#{damage}点伤害"})
		defenser.check_alive!
		unless defenser.alive
			self.notice_message({:action => "notice", :msg => "#{defense_player.nick_name}的#{defenser.name}阵亡"})
		end
		attacker.acted!
		self.notice_message({:action => "update hero", :hero => attacker.to_json(true)})
		self.notice_message({:action => "update hero", :hero => defenser.to_json(true)})

		# check game over
		if defense_player.lose?
			self.game_over attack_player, defense_player
			return
		end

		attack_player.check_turn_over!
		# change turn
		unless attack_player.is_in_turn
			self.change_turn defense_player, attack_player
		end
	end

	def change_turn(acting_player, acted_player)
		self.round += 1
		acting_player.refresh_hero_act!
		acting_player.is_in_turn = true
		acted_player.refresh_hero_act!
		acted_player.is_in_turn = false
		self.turn = acting_player.id

		acting_player.using_heroes.each do |hero_id, hero|
			if hero.alive
				self.notice_message({:action => "update hero", :hero => hero.to_json(true), :show_menu => false})
			end
		end
		acted_player.using_heroes.each do |hero_id, hero|
			if hero.alive
				self.notice_message({:action => "update hero", :hero => hero.to_json(true), :show_menu => false})
			end
		end

		msg = self.round == 1 ? "首先由#{acting_player.nick_name}先行动" : "#{acted_player.nick_name}的回合结束轮到#{acting_player.nick_name}行动"
		self.notice_message({:action => "notice", :msg => msg})
		SocketUtil.send_message({:action => "alert", :msg => "请选择英雄行动"}, acting_player.id)
	end

	def game_over(winner, loser)
		winner.win_game
		loser.lose_game
		SocketUtil.send_message({:action => "win", :msg => ""}, winner.id)
		SocketUtil.send_message({:action => "lose", :msg => ""}, loser.id)
		self.stop
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
