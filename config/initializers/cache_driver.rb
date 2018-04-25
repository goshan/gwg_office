# CacheDriver Config
# to make model save data to file or redis not database

CacheDriver.setup do |config|
  # set cache store type, :file or :redis
  # default is :file
  config.store = :file
end
