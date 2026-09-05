# Shared Bash helpers for the runner-side deployment steps.
state="${RUNNER_TEMP:?}/waps-deploy"
valid_remote_dir() {
  [[ "$1" =~ ^/tmp/waps-deploy\.[A-Za-z0-9]{8}$ ]]
}

ssh_options=(
  -F /dev/null -i "$state/key"
  -o "UserKnownHostsFile=$state/known_hosts" -o GlobalKnownHostsFile=/dev/null
  -o StrictHostKeyChecking=yes -o BatchMode=yes -o IdentitiesOnly=yes
  -o ConnectTimeout=15 -o ServerAliveInterval=15 -o ServerAliveCountMax=3
)

remote() {
  ssh "${ssh_options[@]}" -p "$OCI_SSH_PORT" "$OCI_USER@$OCI_HOST" "$@"
}
