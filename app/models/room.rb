class Room < CacheRecord
  attr_accessor :id, :name, :status, :players, :sockets, :game_id

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
      self.class.unjoin_all_rooms user
      self.players << user
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
      if self.empty?
        self.destroy
      else
        self.save!
      end
    else
      puts "[Model Error] room not include this player"
    end
  end

  def include_user?(user)
    @players.include? user
  end

  def empty?
    self.players.blank?
  end

  def self.unjoin_all_rooms(user)
    self.find_all.each do |room|
      room.unjoin_user user if room.include_user? user
    end
  end

  def start_game
    self.status = STATUS_GAMING
    self.save!
  end

  # for cache transport func
  def to_cache
    JSON.generate({:id => @id, :name => @name, :status => @status, :game_id => @game_id, :players => @players.map{|p| p.id}})
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
    room.game_id = json[:game_id]
    room
  end
end
