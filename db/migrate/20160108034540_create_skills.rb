class CreateSkills < ActiveRecord::Migration
	def change
		create_table :skills do |t|
			t.string :name, :null => false
			t.string :desctiption, :null => false
			t.string :json_method, :null => false
			
			t.timestamps null: false
		end
	end
end
