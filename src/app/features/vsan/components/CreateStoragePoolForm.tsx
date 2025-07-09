// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Checkbox, Form, Input, Modal, Select, Tooltip, notification } from 'antd';

import { formatBytes } from '@app/utils/size';

import { createPool, getNodesFromVSAN, getPhysicalStorage, getStoragePool } from '../api';

import {
  Disk,
  DiskEntry,
  DiskNode,
  Node,
  PhysicalStoragePoolRequest,
  PhysicalStorageChangeEvent,
  ErrorMessage,
} from '../types';

import { Table } from 'antd';
import type { TableProps } from 'antd';

interface DataType {
  key: string;
  size: string;
  type: string;
}

type FormType = {
  poolName: string;
  add_to_existing: boolean;
  providerKind: string;
};

const getMaxInstances = (nodes: { [node: string]: DiskNode[] }): number => {
  let max = 0;
  for (const key in nodes) {
    const diskNodes = nodes[key];
    max = Math.max(max, diskNodes.length);
  }

  return max;
};

const getDiskEntries = (disks: Disk[], nodes: Node[]): DiskEntry[] => {
  if (!nodes || !disks) {
    return [];
  }
  const entries: DiskEntry[] = [];
  disks.forEach((d) => {
    const max = getMaxInstances(d.nodes);
    for (let i = 0; i < max; i++) {
      const nodeDevices: { [node: string]: string } = {};

      nodes.forEach((n) => {
        if (!(n.hostname in d.nodes) || !(i in d.nodes[n.hostname])) {
          return;
        }
        nodeDevices[n.hostname] = d.nodes[n.hostname][i].device;
      });
      entries.push({
        size: d.size,
        rotational: d.rotational,
        nodeDevices: nodeDevices,
      });
    }
  });
  return entries;
};

type CreateStoragePoolFormProps = {
  refetch: () => void;
};

const CreateStoragePoolForm = ({ refetch }: CreateStoragePoolFormProps) => {
  const [form] = Form.useForm<FormType>();
  const [api, contextHolder] = notification.useNotification();
  const [createFormModal, setCreateFormModal] = useState(false);
  const [checkboxStates, setCheckboxStates] = useState<boolean[][]>([]);
  const [physicalStoragePoolRequest, setPhysicalStoragePoolRequest] = useState<PhysicalStoragePoolRequest>({
    poolName: '',
    diskPaths: new Map<string, Set<string>>(),
    nodes: new Set<string>(),
    providerKind: 'LVM_THIN',
  });

  const { data: storagePool } = useQuery({
    queryKey: ['getStoragePool'],
    queryFn: () => getStoragePool(),
  });

  const { data: disks } = useQuery({
    queryKey: ['getPhysicalStorage'],
    queryFn: () => getPhysicalStorage(),
  });

  const { data: nodes } = useQuery({
    queryKey: ['getNodesFromVSAN'],
    queryFn: () => getNodesFromVSAN(),
  });

  const add_to_existing = Form.useWatch('add_to_existing', form);
  const entries = getDiskEntries(disks?.data, nodes?.data);

  const handleRowChange = (row, event) => {
    nodes?.data.forEach((n, col) => {
      if (n.hostname in entries[row].nodeDevices) {
        handleChange(row, col, event);
      }
    });
  };

  const handleChange = (row, col, event) => {
    const nodeName = nodes?.data?.[col].hostname;
    const disk = entries[row].nodeDevices[nodeName];

    onCheckedChanged({ nodeName, disk, checked: event.target.checked });

    setCheckboxStates((prevState) => {
      const updatedCheckboxStates = { ...prevState };
      if (!(row in updatedCheckboxStates)) {
        updatedCheckboxStates[row] = [];
      }
      updatedCheckboxStates[row][col] = event.target.checked;
      return updatedCheckboxStates;
    });
  };

  const getRowCheckboxState = (row: number): boolean => {
    let res = false;
    let max = 0;
    const ids: number[] = [];
    nodes?.data?.forEach((n, col) => {
      if (n.hostname in entries[row].nodeDevices) {
        max++;
        ids.push(col);
      }
    });
    if (row in checkboxStates) {
      if (checkboxStates[row].length < max) return false;
      for (let i = 0; i < nodes?.data?.length; i++) {
        if (checkboxStates[row][i] || !ids.includes(i)) {
          res = true;
        } else {
          res = false;
          break;
        }
      }
    }
    return res;
  };

  const getCheckboxState = (row: number, col: number): boolean => {
    if (row in checkboxStates && col in checkboxStates[row]) {
      return checkboxStates[row][col];
    }
    return false;
  };

  const columns: TableProps<DataType>['columns'] = [
    {
      title: '',
      key: 'name',
      render: (text, record) => {
        return (
          <span>
            {record.size} {record.type}
          </span>
        );
      },
    },
    {
      title: 'All',
      key: 'all',
      render: (text, record) => (
        <Checkbox
          onChange={(evt) => {
            handleRowChange(Number(record.key), evt);
          }}
          checked={getRowCheckboxState(Number(record.key))}
        />
      ),
    },
  ].concat(
    nodes?.data?.map((n, index) => {
      return {
        title: n.hostname,
        dataIndex: 'name',
        key: 'name',
        render: (text, d) => (
          <Tooltip
            title={
              n.hostname in d.nodeDevices
                ? d.nodeDevices[n.hostname].startsWith('/dev/')
                  ? d.nodeDevices[n.hostname] + ' on ' + n.hostname
                  : '/dev/' + d.nodeDevices[n.hostname] + ' on ' + n.hostname
                : undefined
            }
          >
            <Checkbox
              disabled={!(n.hostname in d.nodeDevices)}
              onChange={(evt) => {
                handleChange(Number(d.key), index, evt);
              }}
              checked={getCheckboxState(Number(d.key), index)}
            />
          </Tooltip>
        ),
      };
    }),
  );

  const onCheckedChanged = (ev: PhysicalStorageChangeEvent) => {
    const req = { ...physicalStoragePoolRequest };
    const nodeName = ev.nodeName;

    const deviceName = ev.disk.startsWith('/dev/') ? ev.disk : '/dev/' + ev.disk;
    if (ev.checked) {
      if (!req.diskPaths.has(nodeName)) {
        req.diskPaths.set(nodeName, new Set());
      }
      req.diskPaths.get(nodeName)?.add(deviceName);

      req.nodes.add(nodeName);
    } else {
      req.diskPaths.get(nodeName)?.delete(deviceName);
      if (req.diskPaths.get(nodeName)?.size === 0) {
        req.diskPaths.delete(nodeName);
        req.nodes.delete(nodeName);
      }
    }

    setPhysicalStoragePoolRequest(req);
  };

  const data: DataType[] = entries.map((e, i) => {
    return {
      key: i.toString(),
      size: formatBytes(e.size / 1024),
      type: e.rotational ? ' HDD' : ' SSD',
      nodeDevices: e.nodeDevices,
    };
  });

  const spOption = storagePool?.data
    ?.filter((e) => e.providerKind != 'DISKLESS')
    ?.map((e) => ({
      label: e.name,
      value: e.name,
    }));

  useEffect(() => {
    if (add_to_existing) {
      form.setFieldValue('poolName', spOption?.[0]?.value);
    }
  }, [add_to_existing, form, spOption]);

  const createMutation = useMutation({
    mutationFn: createPool,
    onSuccess: () => {
      api.success({
        message: 'Create successfully',
      });

      setCreateFormModal(false);
      form.resetFields();
      setCheckboxStates([[]]);
      refetch();
    },
    onError: (err: ErrorMessage) => {
      api.error({
        message: err?.message,
        description: err?.detail || err?.explanation,
        duration: 0,
      });
    },
  });

  const onFinish = async () => {
    try {
      const values = await form?.validateFields();
      console.log(physicalStoragePoolRequest, 'physicalStoragePoolRequest');
      console.log(values);

      setPhysicalStoragePoolRequest({
        ...physicalStoragePoolRequest,
        poolName: values.poolName,
        providerKind: values.providerKind,
      });

      const diskPathsObj: Record<string, string[]> = {};

      physicalStoragePoolRequest.diskPaths.forEach((value, key) => {
        diskPathsObj[key] = Array.from(value);
      });

      const currentPool = {
        poolName: values.poolName,
        providerKind: values.providerKind,
        diskPaths: diskPathsObj,
        nodes: Array.from(physicalStoragePoolRequest.nodes),
      };

      createMutation.mutate(currentPool);
    } catch (error) {
      console.log('Failed:', error);
    }
  };

  const vdoPossible = (): boolean => {
    let checkedCt = 0;
    let sizeCt = 0;
    physicalStoragePoolRequest.diskPaths.forEach((paths, key) => {
      paths.forEach((p) => {
        disks?.data.forEach((disk) => {
          if (disk.nodes[key]) {
            disk.nodes[key].forEach((diskPath) => {
              if (diskPath.device === p) {
                checkedCt++;
                if (disk.size >= 10 * Math.pow(2, 30)) {
                  //from GiB to Byte
                  sizeCt++;
                }
              }
            });
          }
        });
      });
    });
    return checkedCt != 0 && checkedCt === sizeCt;
  };

  const handleOk = () => {
    onFinish();
  };

  const handleCancel = () => {
    form.resetFields();
    setCheckboxStates([[]]);
    setCreateFormModal(false);
  };

  return (
    <>
      {contextHolder}
      <Button type="primary" onClick={() => setCreateFormModal(true)}>
        Create
      </Button>

      <Modal
        title="Create"
        open={createFormModal}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={add_to_existing ? 'Add' : 'Create'}
        width={800}
        okButtonProps={{
          loading: createMutation.isLoading,
        }}
      >
        <Table columns={columns} dataSource={data} pagination={false} />
        <br />
        <Form<FormType>
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          size="large"
          layout="horizontal"
          form={form}
          onFinish={onFinish}
          initialValues={{
            providerKind: 'LVM_THIN',
          }}
        >
          <Form.Item
            tooltip="The name of a resource group has to be at least 3 characters long and can not be longer than 48 characters.
Valid characters are a-z, A-Z, and 0-9 as well as _ and -
Be aware that the name cannot start or end with - and cannot start with a number."
            name="poolName"
            label="Storage Pool Name"
            required
            rules={[
              {
                required: true,
                message: 'Name is required!',
              },
              {
                min: 3,
                message: 'Name must be at least 3 characters!',
              },
              {
                max: 48,
                message: 'Name must be at most 48 characters!',
              },
              {
                pattern: /^([A-Za-z_][A-Za-z0-9_-]+)$/,
                message:
                  'Name must start with a letter or an underscore, and can only contain letters, numbers, hyphens, and underscores!',
              },
            ]}
          >
            {add_to_existing ? (
              <Select options={spOption} placeholder="Please select storage pool" />
            ) : (
              <Input placeholder="Please input pool name" />
            )}
          </Form.Item>

          <Form.Item
            label="Add or create new pool"
            tooltip="You can choose whether to create a new storage pool from the selected disks or to add them to an existing storage pool."
            name="add_to_existing"
            valuePropName="checked"
          >
            <Checkbox>Add to existing pool</Checkbox>
          </Form.Item>

          <Form.Item
            label="Storage Pool Type"
            name="providerKind"
            tooltip={
              <div>
                <p>LVM: Simply allocate storage using LVM, the Logical Volume Manager.</p>
                <p>
                  LVM Thin: Instead of allocating all blocks on a backing device immediately, only create a block when
                  it is written. This is known as thin provisioning and is our recommendation for LINSTOR storage pools.
                </p>
                <p>
                  LVM+VDO: VDO offers additional deduplication and compression features for LVM volumes. At least 10 GiB
                  per disk are neccessary for VDO.
                </p>
              </div>
            }
            required
            rules={[
              {
                required: true,
                message: 'Storage pool type is required!',
              },
            ]}
          >
            <Select
              options={[
                {
                  label: 'LVM_THIN',
                  value: 'LVM_THIN',
                },
                {
                  label: 'LVM',
                  value: 'LVM',
                },
                {
                  label: 'LVM+VDO',
                  value: 'LVM+VDO',
                  disabled: !vdoPossible(),
                },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export { CreateStoragePoolForm };
