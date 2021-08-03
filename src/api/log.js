import request from '@/utils/request'

export async function list() {
  return (await request({
    url: '/v1/error-reports',
    method: 'get'
  })).data
}
export async function detail(id) {
  return (await request({
    url: '/v1/error-reports/' + id,
    method: 'get'
  })).data
}

export async function remove(id) {
  return (await request({
    url: '/v1/error-reports/' + id,
    method: 'delete'
  })).data
}

