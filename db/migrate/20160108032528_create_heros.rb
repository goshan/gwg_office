class CreateHeros < ActiveRecord::Migration
	def change
		create_table :heros do |t|
			t.string :name, :null => false
			t.string :avatar
			t.string :description
			t.integer :attack_type, :null => false, :defalut => 0
			t.integer :attack_length, :null => false
			t.integer :attack_value, :null => false
			t.integer :defense_type, :null => false
			t.integer :defense_value, :null => false
			t.integer :speed, :null => false
			t.integer :health, :null => false
			t.integer :skill_id

			t.timestamps null: false
		end
	end
end
