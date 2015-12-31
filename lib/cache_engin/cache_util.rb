class CacheUtil

	class << self
		def write(type, data)
			puts "[CACHE] save #{type} to cache: #{data}"
			FileCacheUtil.write type, data
		end

		def read(type, data_id)
			puts "[CACHE] get #{type} from cache: #{data_id}"
			FileCacheUtil.read type, data_id
		end
		
		def read_all(type)
			puts "[CACHE] get #{type} from cache: all"
			FileCacheUtil.read_all type
		end

		def delete(type, data_id)
			puts "[CACHE] delete #{type} from cache: #{data_id}"
			FileCacheUtil.delete type, data_id
		end

		# type --> :room
		# class --> Room
		# dir --> 'rooms'
		def type_to_class(type)
			type.to_s.capitalize.constantize
		end

		def class_to_type(clazz)
			cla_str = clazz.name
			(cla_str[0].downcase + cla_str[1..-1]).to_sym
		end

		def type_to_dir(type)
			type.to_s + 's'
		end
	end
end
