# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20160108034540) do

  create_table "heros", force: :cascade do |t|
    t.string   "name",          limit: 255, null: false
    t.string   "avatar",        limit: 255
    t.string   "description",   limit: 255
    t.integer  "attack_type",   limit: 4,   null: false
    t.integer  "attack_length", limit: 4,   null: false
    t.integer  "attack_value",  limit: 4,   null: false
    t.integer  "defense_type",  limit: 4,   null: false
    t.integer  "defense_value", limit: 4,   null: false
    t.integer  "speed",         limit: 4,   null: false
    t.integer  "health",        limit: 4,   null: false
    t.integer  "skill_id",      limit: 4
    t.datetime "created_at",                null: false
    t.datetime "updated_at",                null: false
  end

  create_table "skills", force: :cascade do |t|
    t.string   "name",        limit: 255, null: false
    t.string   "desctiption", limit: 255, null: false
    t.string   "json_method", limit: 255, null: false
    t.datetime "created_at",              null: false
    t.datetime "updated_at",              null: false
  end

  create_table "users", force: :cascade do |t|
    t.string   "nick_name",  limit: 255,             null: false
    t.integer  "win_count",  limit: 4,   default: 0
    t.integer  "loss_count", limit: 4,   default: 0
    t.datetime "created_at",                         null: false
    t.datetime "updated_at",                         null: false
  end

  add_index "users", ["nick_name"], name: "index_users_on_nick_name", unique: true, using: :btree

end
