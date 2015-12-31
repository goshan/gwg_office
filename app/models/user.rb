class User < ActiveRecord::Base
	def self.auth_with_salt (id)
		return nil if id == nil
		user = find_by_id(id)
		return user
	end
end
