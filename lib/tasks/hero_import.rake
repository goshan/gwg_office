namespace :hero_import do
	desc "init ver"
	task :init => :environment do
		Hero.create!(
			:name => "程序", 
			:avatar => "programmer.png", 
			:description => "臭搬砖的", 
			:attack_type => Hero.attack_types[:logic], 
			:attack_length => 1, 
			:attack_value => 20, 
			:defense_type => Hero.defense_types[:execute], 
			:defense_value => 6, 
			:health => 85, 
			:speed => 6
		)
		Hero.create!(
			:name => "设计", 
			:avatar => "designer.png", 
			:description => "乱切图的", 
			:attack_type => Hero.attack_types[:think], 
			:attack_length => 2, 
			:attack_value => 18, 
			:defense_type => Hero.defense_types[:execute], 
			:defense_value => 5, 
			:health => 65, 
			:speed => 8
		)
		Hero.create!(
			:name => "产品", 
			:avatar => "pm.png", 
			:description => "瞎改需求的", 
			:attack_type => Hero.attack_types[:data], 
			:attack_length => 4, 
			:attack_value => 22, 
			:defense_type => Hero.defense_types[:plan], 
			:defense_value => 4, 
			:health => 40, 
			:speed => 4
		)
		Hero.create!(
			:name => "运营", 
			:avatar => "operator.png", 
			:description => "逗比写段子的", 
			:attack_type => Hero.attack_types[:think], 
			:attack_length => 1, 
			:attack_value => 13, 
			:defense_type => Hero.defense_types[:weather], 
			:defense_value => 10, 
			:health => 90, 
			:speed => 6
		)
	end
end
