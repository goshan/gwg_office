class User < ActiveRecord::Base
	attr_accessor :is_ready, :is_in_turn, :using_heroes

	def self.auth_with_salt (id)
		return nil if id == nil
		user = find_by_id(id)
		return user
	end

	def init!
		self.is_ready = false
		self.is_in_turn = false
		self.using_heroes = {}
	end

	def ready!
		self.is_ready = true
	end

	def ready?
		self.is_ready
	end

	def all_heroes_deployed?
		all_deployed = true
		self.using_heroes.each do |hero_pos, hero|
			unless hero.x && hero.y
				all_deployed = false
				break;
			end
		end
		all_deployed
	end	

	def in_turn?
		self.is_in_turn
	end

	def acting!
		self.is_in_turn = true
	end

	def check_turn_over!
		self.using_heroes.each do |hero_id, hero|
			if !hero.turn_acted
				self.is_in_turn = true
				return
			end
		end
		self.is_in_turn = false
	end

	def refresh_hero_act!
		self.using_heroes.each do |hero_id, hero|
			if hero.alive
				hero.turn_acted = false
			end
		end
	end

	def lose?
		self.using_heroes.each do |hero_id, hero|
			if hero.alive
				return false
			end
		end
		return true
	end

	def win_game
		self.win_count += 1
		self.save!
	end

	def lose_game
		self.loss_count += 1
		self.save!
	end
	
	def heroes_json
		self.using_heroes.values.map{|e| e.to_json(true)}
	end

	def to_json(with_hero = nil)
		rate = self..win_count+self.loss_count == 0 ? 'new' : "#{self.win_count*1.00/(self.win_count+self.loss_count)*100}%"
		json = {
			:id => self.id, 
			:name => self.nick_name, 
			:rate => rate,
			:is_ready => self.is_ready, 
			:is_in_turn => self.is_in_turn
		}
		if with_hero
			json.merge!({:heroes => Hash[self.using_heroes.map{|k, v| [k,v.to_json(true)]}]})
		end
		json
	end
end
