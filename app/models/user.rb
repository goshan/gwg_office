class User < ActiveRecord::Base
	attr_accessor :using_heroes

	def self.auth_with_salt (id)
		return nil if id == nil
		user = find_by_id(id)
		return user
	end

	def ready!
		self.using_heroes = {}
	end
end
