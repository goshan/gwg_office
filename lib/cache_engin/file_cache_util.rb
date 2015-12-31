class FileCacheUtil < CacheUtil
	CACHE_DIR = Rails.root.join('tmp', 'cache')

	class << self
		def get_count(type)
			dir = CACHE_DIR.join type_to_dir(type)
			Dir.mkdir dir unless Dir.exist? dir

			current_id = 0;
			if File.exist? dir.join('count')
				file = File.new dir.join('count'), 'r'
				current_id = file.read.to_i
				file.close
			end

			current_id
		end

		def set_count(type, count)
			dir = CACHE_DIR.join type_to_dir(type)
			Dir.mkdir dir unless Dir.exist? dir

			file = File.new dir.join('count'), 'w'
			file.puts count
			file.close
		end

		def write(type, data)
			dir = CACHE_DIR.join type_to_dir(type)
			Dir.mkdir dir unless Dir.exist? dir

			current_id = get_count(type)
			if data.id
				if data.id > current_id
					raise "ID out of bounds"
				end
			else
				current_id += 1
				data.id = current_id
				set_count(type, current_id)
			end 
			file = File.new dir.join("#{data.id}.cache"), 'w'
			file.puts "#{Time.now}\t#{data.to_cache}"
			file.close

			data.id
		end

		def read(type, data_id)
			dir = CACHE_DIR.join type_to_dir(type)
			Dir.mkdir dir unless Dir.exist? dir

			file_path = dir.join("#{data_id}.cache")
			return unless File.exist? file_path
			file = File.new file_path, 'r'
			data_str = file.read.split("\t")[1]

			unless data_str
				puts "cache #{type}-#{data_id} data miss"
				return
			end

			type_to_class(type).from_cache data_str
		end

		def read_all(type)
			dir = CACHE_DIR.join type_to_dir(type)
			Dir.mkdir dir unless Dir.exist? dir
			dir_scaner = Dir.new dir

			data = []
			dir_scaner.each do |file_name|
				file = File.new dir.join(file_name), 'r'
				next unless File.file?(file) and File.extname(file) == ".cache"
				data_str = file.read.split("\t")[1]

				unless data_str
					puts "cache #{type}-#{file} data miss"
					next
				end

				data << type_to_class(type).from_cache(data_str)
			end

			data
		end

		def delete(type, data_id)
			dir = CACHE_DIR.join type_to_dir(type)
			return true unless Dir.exist? dir

			file_path = dir.join("#{data_id}.cache")
			return true unless File.exist? file_path
			File.delete file_path
			true
		end
	end
end
