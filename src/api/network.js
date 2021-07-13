import request from '@/utils/request'

export async function getAll(listOpts = {}) {
  return (await request({
    url: '/v1/nodes',
    method: 'get',
    params: listOpts
  })).data.flatMap(it => {
    return it.net_interfaces.map(item => {
      item.node_name = it.name
      return item
    })
  })
}

export async function remove(nodeName, networkName) {
  return (await request({
    url: `/v1/nodes/${nodeName}/net-interfaces/${networkName}`,
    method: 'delete'
  })).data
}

export async function create(nodeName, data) {
  return (await request({
    url: `/v1/nodes/${nodeName}/net-interfaces`,
    method: 'post',
    data: data
  })).data
}

export async function modify(nodeName, networkName, data) {
  return (await request({
    url: `/v1/nodes/${nodeName}/net-interfaces/${networkName}`,
    method: 'put',
    data: data
  })).data
}

