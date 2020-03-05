export DIGITALOCEAN_ACCESS_TOKEN=934f1afde35a326c05246e635930858b10e6fc9f9714bd0a6b729aecd7033516
export IFACE=eth1
export VOLUME_SIZE=500gb

function create_machine() {
  docker-machine create -d digitalocean --digitalocean-private-networking $@
}

function exec_doctl() {
  doctl -t $DIGITALOCEAN_ACCESS_TOKEN $@
}

function create_nfs_volume() {
  target_worker nfs
  exec_doctl compute droplet volume create --region nyc3 --fs-type ext4 --size $VOLUME_SIZE registry-storage
#  docker-machine ssh worker-nfs "curl -sSL -o /usr/bin/docker-volume-plugin-dostorage https://github.com/omallo/docker-volume-plugin-dostorage/releases/download/v0.4.0/docker-volume-plugin-dostorage_linux_amd64; chmod +x /usr/bin/docker-volume-plugin-dostorage; docker-volume-plugin-dostorage --access-token=$DIGITALOCEAN_ACCESS_TOKEN &"
#  docker volume create -d dostorage storage
}

function get_internal_ip() {
  exec_doctl compute droplet list | grep $1 | cut -f 1 -d " " | xargs doctl -t $DIGITALOCEAN_ACCESS_TOKEN compute droplet get --format PrivateIPv4 | tail -n 1
}
