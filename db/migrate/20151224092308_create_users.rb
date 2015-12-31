class CreateUsers < ActiveRecord::Migration
	def change
		create_table :users do |t|
			t.string :nick_name, null: false
			t.integer :win_count, :default => 0
			t.integer :loss_count, :default => 0
			t.timestamps null: false
		end

		add_index :users, :nick_name, :unique => true
	end
end
