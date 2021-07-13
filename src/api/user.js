import request from '@/utils/request'

export async function login(data) {
  return (await request({
    url: '/user/login',
    method: 'post',
    data: data
  })).data
}

export async function getInfo() {
  return (await request({
    url: '/user/info',
    method: 'get'
  })).data
}

export async function logout() {
  return (await request({
    url: '/user/logout',
    method: 'delete'
  })).data
}

export async function permissions() {
  return (await request({
    url: '/users/permissions',
    method: 'get'
  })).data
}

export async function addUser(data) {
  return (await request({
    url: '/users',
    method: 'post',
    data: data
  })).data
}
export async function getUsers() {
  return (await request({
    url: '/users',
    method: 'get'
  })).data
}

export async function removeUser(userId) {
  return (await request({
    url: '/users/' + userId,
    method: 'delete'
  })).data
}
export async function updatePassword(data) {
  return (await request({
    url: '/user/updatePassword',
    data: data,
    method: 'post'
  })).data
}
