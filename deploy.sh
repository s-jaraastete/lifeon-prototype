cd ~/apps/deploy &&
git pull &&
docker compose pull &&
docker compose up -d &&
docker compose ps &&
printf '\n\n===== DEPLOY FINISHED =====\n\n'
