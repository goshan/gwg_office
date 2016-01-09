class Hero < ActiveRecord::Base
	attr_accessor :pos, :current_health, :current_attack_value, :current_defense_value, :current_speed, :skill_used, :turn_acted

	enum :attack_type => {
		:logic => 0, 
		:data => 1, 
		:think => 2
	}

	enum :defense_type => {
		:execute => 0,
		:plan => 1, 
		:whether => 3
	}

	DAMAGE = {
		:logic => {
			:execute => 1, 
			:plan => 1.5, 
			:whether => 0.8
		},
		:data => {
			:execute => 1.5, 
			:plan => 1.3, 
			:whether => 0.8
		},
		:think => {
			:execute => 0.8, 
			:plan => 0.7, 
			:whether => 1.3
		}
	} 

	DAMAGE_SEED = [0.5, 1.2]

	def self.original_damage(attacker, defenser)
		(attacker.attack_value * DAMAGE[attacker.attack_type.to_sym][defenser.defense_type.to_sym] - defenser.defense_value).round
	end

	def self.damage(attacker, defenser)
		((attacker.current_attack_value * DAMAGE[attacker.attack_type.to_sym][defenser.defense_type.to_sym] - defenser.current_defense_value) * rand(DAMAGE_SEED[0]..DAMAGE_SEED[1])).round
	end

	def picked!(pos)
		self.pos = pos
		self.current_health = self.health
		self.current_attack_value = self.attack_value
		self.current_defense_value = self.defense_value
		self.current_speed = self.speed
		self.skill_used = false
		self.turn_acted = false
	end

	def to_json(status = nil)
		json = {
			:id => self.id, 
			:avatar => "/assets/images/#{self.avatar}",
			:name => self.name, 
			:desc => self.description, 
			:attack_type => self.attack_type, 
			:attack_value => self.attack_value, 
			:attack_length => self.attack_length, 
			:defense_type => self.defense_type, 
			:defense_value => self.defense_value, 
			:health => self.health, 
			:speed => self.speed, 
			:pos => self.pos
		}

		if status
			json.merge!({
				:current_health => self.current_health,
				:current_attack_value => self.current_attack_value,
				:current_defense_value => self.current_defense_value, 
				:current_speed => self.current_speed, 
				:skill_used => self.skill_used, 
				:turn_acted => self.turn_acted
			})
		end

		json
	end
end
