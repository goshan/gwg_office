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

	def in_turn?
		self.is_in_turn
	end

	def acting!
		self.is_in_turn = true
	end
	
	def heroes_json
		self.using_heroes.values.map{|e| e.to_json(true)}
	end

	def to_json(with_hero = nil)
		rate = self..win_count+self.loss_count == 0 ? 'new' : "#{self.win_count*1.00/(self.win_count+self.loss_count)*100}%"
		json = {
			:id => self.id, 
			:name => self.nick_name, 
			:rate => rate
		}
		if with_hero
			json.merge!({:heroes => self.using_heroes.values.map{|e| e.to_json(true)}})
		end
		json
	end
end
