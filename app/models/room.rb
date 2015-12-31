class Room < CacheModel
	attr_accessor :id, :name, :status, :players, :sockets

	STATUS_WAITING = "waiting"
	STATUS_GAMING = "gaming"

	def initialize
		@status = STATUS_WAITING
		@players = []
	end

	def join_user(user)
		@players << user
		self.save!
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
