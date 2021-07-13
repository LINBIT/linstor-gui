import request from '@/utils/request'

export async function getAll(listOpts = {}) {
  return (await request({
    url: '/v1/view/storage-pools',
    method: 'get',
    params: listOpts
  })).data.filter(el => el.storage_pool_name !== 'DfltDisklessStorPool')
}
export async function remove(nodeName, spName) {
  return (await request({
    url: `/v1/nodes/${nodeName}/storage-pools/${spName}`,
    method: 'delete'
  })).data
}

export async function create(data) {
  const nodeName = data.node_name
  delete data.node_name
  return (await request({
    url: `/v1/nodes/${nodeName}/storage-pools`,
    method: 'post',
    data: data
  })).data
}

export async function modify(nodeName, storagePoolName, data) {
  return (await request({
    url: `/v1/nodes/${nodeName}/storage-pools/${storagePoolName}`,
    method: 'put',
    data: data
  })).data
}

