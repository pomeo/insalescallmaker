#========================
#CONFIG
#========================
set :application, "callmaker.salesapps.ru"
#========================
#CONFIG
#========================
require           "capistrano-offroad"
offroad_modules   "defaults", "supervisord"
set :repository,  "git@github.com:pomeo/insalescallmaker.git"
set :deploy_to,   "/home/ubuntu/www/callmaker"
set :supervisord_start_group, "callmaker"
set :supervisord_stop_group,  "callmaker"
#========================
#ROLES
#========================
role :app,        "ubuntu@#{application}"

namespace :deploy do
  desc "Change node.js port"
  task :chg_port do
    run "sed -i 's/3000/10000/g' #{current_path}/app.js"
  end
end

after "deploy:create_symlink", "deploy:npm_install", "deploy:chg_port", "deploy:restart"
