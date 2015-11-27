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
set :supervisord_start_group, "app"
set :supervisord_stop_group,  "app"
#========================
#ROLES
#========================
set  :gateway,    "#{application}" # main server
role :app,        "10.3.10.1"      # container

after "deploy:create_symlink",
      "deploy:npm_install",
      "deploy:restart"
