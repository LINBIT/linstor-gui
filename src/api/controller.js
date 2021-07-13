import request from '@/utils/request'

export async function getAll() {
  return (await request({
    url: '/v1/controller/properties',
    method: 'get'
  })).data
}

export async function config() {
  return (await request({
    url: '/v1/controller/config',
    method: 'get'
  })).data
}

export async function modify(data) {
  return (await request({
    url: '/v1/controller/properties',
    method: 'post',
    data: data
  }))
}

