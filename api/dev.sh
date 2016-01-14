#DEBUG=sca:* env=dev PORT=12403 nodemon -i node_modules ./index.js

pm2 delete life
pm2 start life.js --watch --ignore-watch="\.log$ test/ .sh$ pub/"

pm2 save
