pull=$(git pull)
if [[ "$pull" == *"Already Updated"* ]]; then
  yarn start:prod
  exit 0
fi
yarn build
yarn start:prod