import request from '@/utils/request'

export async function list() {
  return (await request({
    url: '/v1/plugin/export',
    method: 'get'
  })).data
}
export async function createNfs(node, data) {
  return (await request({
    url: '/v1/plugin/nsf/' + node,
    method: 'post',
    data: data
  })).data
}
export async function removeNfs(node, data) {
  return (await request({
    url: '/v1/plugin/nsf/' + node,
    method: 'delete',
    data: data
  })).data
}

export async function createIscsi(node, data) {
  return (await request({
    url: '/v1/plugin/export/' + node,
    method: 'post',
    data: data
  })).data
}
export async function removeIscsi(node, data) {
  return (await request({
    url: '/v1/plugin/export/' + node,
    method: 'delete',
    data: data
  })).data
}
