class CacheModel
	def self.find_all
		CacheUtil.read_all CacheUtil.class_to_type(self)
	end

	def self.find_by_id(id)
		CacheUtil.read CacheUtil.class_to_type(self), id
	end

	def save!
		CacheUtil.write CacheUtil.class_to_type(self.class), self
	end

	def destroy
		CacheUtil.delete CacheUtil.class_to_type(self.class), self.id
	end

	def to_cache
		self.inspect
	end

	def self.from_cache(str)
		self.new
	end
end
