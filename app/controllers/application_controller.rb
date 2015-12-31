class ApplicationController < ActionController::Base
  include SessionsHelper
  
  before_filter :check_signed_in

  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception
  
  def check_signed_in
	  return redirect_to sign_up_path unless signed_in?
  end
end
