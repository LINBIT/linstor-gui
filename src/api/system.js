import request from '@/utils/request'

export async function getSpaceReport() {
  return (await request({
    url: '/v1/space-report',
    method: 'get'
  })).data
}
