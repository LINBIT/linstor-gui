import request from '@/utils/request'

export async function getAll(listOpts = {}) {
  return (await request({
    url: '/v1/nodes',
    method: 'get',
    params: listOpts
  })).data
}

export async function create(node = {}) {
  return (await request({
    url: '/v1/nodes',
    method: 'post',
    data: node
  })).data
}

export async function modify(nodeName, config = {}) {
  return (await request({
    url: `/v1/nodes/${nodeName}`,
    method: 'put',
    data: config
  })).data
}

export async function deleteNode(nodeName) {
  return (await request({
    url: `/v1/nodes/${nodeName}`,
    method: 'delete'
  })).data
}

export async function lost(nodeName) {
  return (await request({
    url: `/v1/nodes/${nodeName}/lost`,
    method: 'delete'
  })).data
}

export async function restore(nodeName) {
  return (await request({
    url: `/v1/nodes/${nodeName}/restore`,
    method: 'put'
  })).data
}

export async function reconnect(nodeName) {
  return (await request({
    url: `/v1/nodes/${nodeName}/reconnect`,
    method: 'put'
  })).data
}

export async function metrics() {
  return (await request({
    url: `/metrics`,
    method: 'get',
    responseType: 'text'
  })).data
}

