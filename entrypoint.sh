pull=$(git pull)
if [[ "$pull" == *"Already up to date."* ]]; then
  yarn start:prod
  exit 0
fi
yarn install
yarn build
yarn start:prod
