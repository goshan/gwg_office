class RoomsController < ApplicationController
	def index
		@rooms = Room.find_all
	end

	def create
		room = Room.new
		room.name = "#{current_user.nick_name}的房间"
		room.save!
		room.join_user current_user
		redirect_to room_path(room.id)
	end
	
	def show
		@room = Room.find_by_id params[:id]
		raise ActionController::RoutingError.new("not joined to this room") unless @room.include_user? current_user
	end

	def join
		room = Room.find_by_id params[:id]
		raise ActionController::RoutingError.new("same user in the same room") if room.include_user? current_user
		room.join_user current_user
		redirect_to room_path(room.id)
	end

	def unjoin
		room = Room.find_by_id params[:id]
		raise ActionController::RoutingError.new("user not in this room") unless room.include_user? current_user
		room.unjoin_user current_user
		redirect_to rooms_path
	end

	def game
		@room = Room.find_by_id params[:id]
		raise ActionController::RoutingError.new("user not in this room") unless @room.include_user? current_user
		@room.start_game
		
		@map = []
		file = File.new Rails.root.join "lib", "maps", "map.gcm"
		while line = file.gets
			line = line[0..-3].split ""
			@map << line
		end
		file.close
	end
end
