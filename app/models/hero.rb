class Hero < ActiveRecord::Base
	attr_accessor :pos, :x, :y, :player_id, :current_health, :current_attack_value, :current_attack_length, :current_defense_value, :current_speed, :skill_used, :turn_acted

	enum :attack_type => {
		:logic => 0, 
		:data => 1, 
		:think => 2
	}

	enum :defense_type => {
		:execute => 0,
		:plan => 1, 
		:weather => 3
	}

	DAMAGE = {
		:logic => {
			:execute => 1, 
			:plan => 1.5, 
			:weather => 0.8
		},
		:data => {
			:execute => 1.5, 
			:plan => 1.3, 
			:weather => 0.8
		},
		:think => {
			:execute => 0.8, 
			:plan => 0.7, 
			:weather => 1.3
		}
	} 

	ATTACK_DESC = {
		:logic => "逻辑，对执行100%，对计划150%，对心情80%",
		:data => "数据，对执行150%，对计划130%，对心情80%",
		:think => "想法，对执行80%，对计划70%，对心情130%"
	}

	DEFENSE_DESC = {
		:execute => "执行，逻辑伤害100%，数据伤害150%，想法伤害80%",
		:plan => "计划，逻辑伤害150%，数据伤害130%，想法伤害70%",
		:weather => "心情，逻辑伤害80%，数据伤害80%，想法伤害130%"
	}

	DAMAGE_SEED = [0.5, 1.2]

	def self.original_damage(attacker, defenser)
		(attacker.attack_value * DAMAGE[attacker.attack_type.to_sym][defenser.defense_type.to_sym] - defenser.defense_value).round
	end

	def self.damage(attacker, defenser)
		((attacker.current_attack_value * DAMAGE[attacker.attack_type.to_sym][defenser.defense_type.to_sym] - defenser.current_defense_value) * rand(DAMAGE_SEED[0]..DAMAGE_SEED[1])).round
	end

	def picked!(player_id, pos)
		self.player_id = player_id
		self.pos = pos
		self.current_health = self.health
		self.current_attack_value = self.attack_value
		self.current_attack_length = self.attack_length
		self.current_defense_value = self.defense_value
		self.current_speed = self.speed
		self.skill_used = false
		self.turn_acted = false
	end

	def attack_desc
		ATTACK_DESC[self.attack_type.to_sym]
	end

	def defense_desc
		DEFENSE_DESC[self.defense_type.to_sym]
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
			:pos => self.pos,
			:player_id => self.player_id
		}

		if status
			json.merge!({
				:x => self.x, 
				:y => self.y, 
				:current_health => self.current_health,
				:current_attack_value => self.current_attack_value,
				:current_attack_length => self.current_attack_length,
				:attack_desc => self.attack_desc,
				:current_defense_value => self.current_defense_value, 
				:defense_desc => self.defense_desc,
				:current_speed => self.current_speed, 
				:skill_used => self.skill_used, 
				:turn_acted => self.turn_acted
			})
		end

		json
	end
end
