namespace :analyze do
  desc "print damages between heroes for theory"
  task :damages => :environment do
    heroes = Hero.all
    heroes.each do |attacker|
      puts "#{attacker.name} --> "
      heroes.each do |defenser|
        puts "\t#{defenser.name}: #{Hero.original_damage(attacker, defenser)}"
      end
    end
  end
end
