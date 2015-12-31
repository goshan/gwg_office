module SessionsHelper

	def signed_in?
		return !current_user.nil?
	end

	def is_current_user?(user)
		if(user == nil || current_user == nil)
			return false;
		end
		return user.id == current_user.id
	end

	def sign_in(user)
		cookies.permanent.signed[:remember_token] = [user.id, "TODO_salt"]
	end

	def sign_out
		cookies.delete(:remember_token)
	end

	def current_user
		user_from_remember_token
	end

	private
	def user_from_remember_token
		User.auth_with_salt(remember_token[0])
	end

	def remember_token
		cookies.signed[:remember_token] || [nil, nil]
	end

end
