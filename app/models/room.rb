class Room < CacheModel
	attr_accessor :id, :name, :status, :players, :sockets

	STATUS_WAITING = "waiting"
	STATUS_GAMING = "gaming"

	def initialize
		@status = STATUS_WAITING
		@players = []
	end

	def join_user(user)
		existed = nil
		self.players.each do |player|
			if player.id == user.id
				existed = true
				break
			end
		end

		if existed
			puts "[Model Error] room has included this player"
		else
			@players << user
			self.save!
		end
	end

	def unjoin_user(user)
		deleted = nil
		self.players.each_with_index do |player, index|
			if player.id == user.id
				self.players.delete_at index
				deleted = true
			end
		end

		if deleted
			self.save!
		else
			puts "[Model Error] room not include this player"
		end
	end

	def include_user?(user)
		@players.include? user
	end

	# for cache transport func
	def to_cache
		JSON.generate({:id => @id, :name => @name, :status => @status, :players => @players.map{|p| p.id}})
	end

	def self.from_cache(str)
		json = JSON.parse str, {:symbolize_names => true}
		players = json[:players].map{|p_id| User.find_by_id(p_id)}
		room = Room.new
		room.id = json[:id]
		room.name = json[:name]
		room.status = json[:status]
		room.players = players
		room.sockets = json[:sockets]
		room
	end
end
