import request from '@/utils/request'
import lodash from 'lodash'

export async function create(data = {}) {
  return (await request({
    url: '/v1/resource-groups',
    method: 'post',
    data: data
  }))
}

export async function getAll(listOpts = {}) {
  const list = (await request({
    url: '/v1/resource-groups',
    method: 'get',
    params: listOpts
  })).data
  /* for (let i = 0; i < list.length; i++) {
    const data = list[i]
    const result = await listVolume(data.name)
    data.volume = result
  }*/
  return list
}

export async function rgList(listOpts = {}, filterRec = true) {
  return Array.from(await getAll())
  // .filter(el => {
  //   if (filterRec) {
  //     return el.name !== 'DfltRscGrp'
  //   }
  //   return true
  // })
    .map(it => {
      return {
        props: it.props,
        name: it.name,
        description: it.description,
        place_count: it.select_filter.place_count || 0,
        storage_pool_list: it.select_filter.storage_pool_list || [],
        diskless_on_remaining: it.select_filter.diskless_on_remaining || false,
        layer_list: it.select_filter.layer_stack || [],
        provider_list: it.select_filter.provider_list || [],

        do_not_place_with: it.select_filter.not_place_with_rsc || [],
        do_not_place_with_regex: it.select_filter.not_place_with_rsc_regex || '',
        replicas_on_different: it.select_filter.replicas_on_different || [],
        replicas_on_same: it.select_filter.replicas_on_same || [],

        one_key_deploy: false,
        rd_name: '', // Not Impl
        volume_size: 0, //  Not Impl
        definition_only: false,
        data_copy_mode: it.props ? it.props['DrbdOptions/Net/protocol'] : 'C'
      }
    })
}

export async function remove(rsc_grp_name) {
  return (await request({
    url: '/v1/resource-groups/' + rsc_grp_name,
    method: 'delete'
  })).data
}

export async function update(rsc_grp_name, data) {
  return (await request({
    url: '/v1/resource-groups/' + rsc_grp_name,
    method: 'put',
    data: data
  })).data
}

export async function createSpawn(rsc_grp_name, data = {}) {
  return (await request({
    url: '/v1/resource-groups/' + rsc_grp_name + '/spawn',
    method: 'post',
    data: data
  })).data
}

export async function createVolume(rsc_grp_name, data = {}) {
  return (await request({
    url: '/v1/resource-groups/' + rsc_grp_name + '/volume-groups',
    method: 'post',
    data: data
  })).data
}

export async function listVolume(rsc_grp_name, listOpts = {}) {
  return (await request({
    url: '/v1/resource-groups/' + rsc_grp_name + '/volume-groups',
    method: 'get',
    params: listOpts
  })).data
}

export async function resourcesList(listOpts = {}) {
  return (await request({
    url: '/v1/view/resources',
    method: 'get',
    params: listOpts
  })).data
}

export async function resourcesDetailList() {
  return Array.from(await resourcesList())
    .map(it => {
      let failStr = 'OK'
      let stateStr
      {
        const conn = lodash.get(it, 'layer_object.drbd.connections', {})
        let count = 0
        let fail = false
        for (const nodeName in conn) {
          count++
          if (!(conn[nodeName].connected || false)) {
            fail = true
            if (failStr !== '') {
              failStr += ','
            }
            failStr += `${nodeName} ${conn[nodeName].message}`
          }
        }
        fail = count === 0 ? true : fail
        failStr = fail ? failStr : 'OK'
      }

      const flags = it.flags || []

      if (flags.includes('DELETE')) {
        stateStr = 'DELETING'
      } else if (flags.includes('INACTIVE')) {
        stateStr = 'INACTIVE'
      } else if (it.state.in_use) { // TODO
        stateStr = 'InUse'
      } else {
        stateStr = 'Unused'
        const disk_state = lodash.get(it, 'volumes[0].state.disk_state', '')
        if (disk_state === 'Diskless') {
          if (flags.includes('TIE_BREAKER')) {
            return null
          }
          stateStr = disk_state
        } else if (disk_state !== '') {
          stateStr = disk_state
        }
      }
      return {
        'name': it.name,
        'node': it.node_name,
        'port': lodash.get(it, 'layer_object.drbd.drbd_resource_definition.port', ''),
        'usage': lodash.get(it, 'state.in_use', false) ? 'InUse' : 'Unused',
        'conns': failStr,
        'state': stateStr,
        'created_on': it.create_timestamp,
        props: it.props,
        all_data: it
      }
    }).filter(el => el !== null)
}

export async function resourcesDefinitions(listOpts = {}) {
  return (await request({
    url: '/v1/resource-definitions',
    method: 'get',
    params: listOpts
  })).data
}

export async function resourcesDefinitionsAll(listOpts = {}) {
  const list = (await request({
    url: '/v1/resource-definitions',
    method: 'get',
    params: listOpts
  })).data
  // for (let i = 0; i < list.length; i++) {
  //   const data = list[i]
  //   const result = await volumeDefinitions(data.name)
  //   data.volumeDefinition = result
  // }
  return list
}

export async function volumeDefinitions(rsc_dfn_name) {
  const list = (await request({
    url: '/v1/resource-definitions/' + rsc_dfn_name + '/volume-definitions',
    method: 'get'
  })).data
  return list
}

export async function createResourcesDefinitions(data = {}) {
  return (await request({
    url: '/v1/resource-definitions',
    method: 'post',
    data: data
  }))
}

export async function removeResourcesDefinitions(rsc_name) {
  return (await request({
    url: '/v1/resource-definitions/' + rsc_name,
    method: 'delete'
  }))
}

export async function updateResourcesDefinitions(rsc_name, data) {
  return (await request({
    url: '/v1/resource-definitions/' + rsc_name,
    method: 'put',
    data: data
  }))
}

export async function autoPlaceResourcesDefinitions(rsc_name, data = {}) {
  return (await request({
    url: '/v1/resource-definitions/' + rsc_name + '/autoplace',
    method: 'post',
    data: data
  }))
}

export async function createVolumeDefinitions(rsc_name, data = {}) {
  return (await request({
    url: '/v1/resource-definitions/' + rsc_name + '/volume-definitions',
    method: 'post',
    data: data
  }))
}

export async function updateVolumeDefinitions(rsc_name, volNr, data = {}) {
  return (await request({
    url: '/v1/resource-definitions/' + rsc_name + '/volume-definitions/' + volNr,
    method: 'put',
    data: data
  }))
}

export async function deleteResource(name, node) {
  return (await request({
    url: '/v1/resource-definitions/' + name + '/resources/' + node,
    method: 'delete'
  }))
}

export async function activateResource(name, node) {
  return (await request({
    url: '/v1/resource-definitions/' + name + '/resources/' + node + '/activate',
    method: 'POST'
  }))
}

export async function deactivateResource(name, node) {
  return (await request({
    url: '/v1/resource-definitions/' + name + '/resources/' + node + '/deactivate',
    method: 'POST'
  }))
}

export async function createResource(name, node, data) {
  return (await request({
    url: '/v1/resource-definitions/' + name + '/resources/' + node,
    method: 'POST',
    data: data
  }))
}

export async function updateResource(name, node, data) {
  return (await request({
    url: '/v1/resource-definitions/' + name + '/resources/' + node,
    method: 'PUT',
    data: data
  }))
}
export async function updateVolumes(name, node, volNr, data) {
  return (await request({
    url: `/v1/resource-definitions/${name}/resources/${node}/volumes/${volNr}`,
    method: 'PUT',
    data: data
  }))
}
