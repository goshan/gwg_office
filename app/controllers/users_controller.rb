class UsersController < ApplicationController
	skip_before_filter :check_signed_in, :only => [:new, :create]
	def new
		@user = User.new
	end

	def create
		@user = User.find_by_nick_name params[:user][:nick_name]
		unless @user
			@user = User.new user_params
			@user.save!

			sign_in @user
		end

		redirect_to root_path
	end



	private
	def user_params
		params.require(:user).permit(:nick_name)
	end
end
