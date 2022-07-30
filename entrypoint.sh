pull=$(git pull)
if [[ "$pull" == *"Already up to date."* ]]; then
  yarn start:prod
  exit 0
fi
if [[ "$pull" == *"error: Your local changes to the following files would be overwritten by merge:"* ]]; then
  git fetch
  git reset --hard origin/main
fi
yarn install
yarn build
yarn start:prod
