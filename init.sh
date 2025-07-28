#!/bin/bash
set -e

read -p "Enter the new app name: " APP_NAME
if [[ -z "$APP_NAME" ]]; then
  echo "❌ App name is required. Exiting."
  exit 1
fi

# Replace placeholder app name
sed -i "s/helloworld/$APP_NAME/g" package.json .github/workflows/deploy.yaml docker-compose.yml

# Reset version to 1.0.0 in all package.json files
sed -i -r 's/"version": "[[:digit:]]+\.[[:digit:]]+\.[[:digit:]]+"/"version": "1.0.0"/g' package.json packages/*/package.json

# Reinstall deps and clean up
yarn
rm CHANGELOG.md init.sh

# Commit and create first release
git add -A
git commit -m "chore: init $APP_NAME"
yarn release --first-release

# Reminder for secrets
cat <<EOF

✅ Initialized app: $APP_NAME

🚨 Remember to set the following GitHub secrets for this repo:
  - PAT
  - VPS_HOST
  - VPS_PORT
  - VPS_SSH_KEY
  - VPS_SSH_PASSPHRASE
  - VPS_USER

EOF
