function create_discovery() {
  create_machine discovery
  target discovery
  docker run --name consul -d -it -p $(get_internal_ip discovery):8500:8500 -p $(get_internal_ip discovery):8600:8600 --restart always consul agent -server -bootstrap -ui -client 0.0.0.0 
  set_flags
}

function set_flags() {
  DISCOVERY=consul://$(get_internal_ip discovery):8500
  SWARM_FLAGS="--swarm-discovery $DISCOVERY --engine-opt cluster-store=$DISCOVERY --engine-opt cluster-advertise=$IFACE:2376"
  MANAGER_FLAGS="--swarm --swarm-master $SWARM_FLAGS"
  WORKER_FLAGS="--swarm $SWARM_FLAGS --engine-label host=worker-"
}

function create_manager() {
  create_machine $MANAGER_FLAGS manager
}

function create_worker() {
  create_machine ${WORKER_FLAGS}$1 worker-$1
}

function target() {
  TARGET=$1
  echo "targeting $TARGET"
  eval $(docker-machine env $TARGET)
  INTERNAL_IP=$(get_internal_ip $TARGET)
}
 
function target_worker() {
  target worker-$1
}

function target_swarm() {
  echo targeting swarm
  eval $(docker-machine env --swarm manager)
}

function setup_nfs() {
#  create_worker nfs
#  create_nfs_volume
  docker run -d -it --restart always --privileged -p ${INTERNAL_IP}:2049:2049 --name nfs --env SHARED_DIRECTORY=/nfs -v /mnt/sdb:/nfs itsthenetwork/nfs-server-alpine
}
