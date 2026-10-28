// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@app/utils/logger';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Form, Modal, Tooltip, notification } from 'antd';
import { Input } from '@app/components/Input';
import { Select } from '@app/components/Select';

import { Button } from '@app/components/Button';
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
import { Checkbox } from '@app/components/Checkbox';
import { variablesOnly } from '@app/utils/mutation';

interface DataType {
  key: string;
  size: string;
  type: string;
  /** hostname -> device path, built from the disk entries below. */
  nodeDevices: Record<string, string>;
}

/** What the wrapped Checkbox hands its onChange. */
type CheckboxEvent = { target: { checked: boolean } };

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

const getDiskEntries = (disks: Disk[] | undefined, nodes: Node[] | undefined): DiskEntry[] => {
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
  const { t } = useTranslation();
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

  const handleRowChange = (row: number, event: CheckboxEvent) => {
    nodes?.data.forEach((n, col) => {
      if (n.hostname in entries[row].nodeDevices) {
        handleChange(row, col, event);
      }
    });
  };

  const handleChange = (row: number, col: number, event: CheckboxEvent) => {
    const nodeName = nodes?.data?.[col]?.hostname;
    const disk = nodeName ? entries[row].nodeDevices[nodeName] : undefined;

    if (!nodeName || !disk) {
      return;
    }

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
      for (let i = 0; i < (nodes?.data?.length ?? 0); i++) {
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

  const baseColumns: NonNullable<TableProps<DataType>['columns']> = [
    {
      title: '',
      key: 'name',
      render: (_, record) => {
        return (
          <span>
            {record.size} {record.type}
          </span>
        );
      },
    },
    {
      title: t('vsan:all'),
      key: 'all',
      render: (_, record) => (
        <Checkbox
          onChange={(evt) => {
            handleRowChange(Number(record.key), evt);
          }}
          checked={getRowCheckboxState(Number(record.key))}
        />
      ),
    },
  ];

  const nodeColumns: NonNullable<TableProps<DataType>['columns']> = (nodes?.data ?? []).map((n, index) => {
    return {
      title: n.hostname,
      dataIndex: 'name',
      key: n.hostname,
      render: (_, d) => (
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
  });

  const columns = [...baseColumns, ...nodeColumns];

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
    mutationFn: variablesOnly(createPool),
    onSuccess: () => {
      api.success({
        title: t('vsan:create_success'),
      });

      setCreateFormModal(false);
      form.resetFields();
      setCheckboxStates([[]]);
      refetch();
    },
    onError: (err: ErrorMessage) => {
      api.error({
        title: err?.message,
        description: err?.detail || err?.explanation,
        duration: 0,
      });
    },
  });

  const onFinish = async () => {
    try {
      const values = await form?.validateFields();
      logger.debug(physicalStoragePoolRequest, 'physicalStoragePoolRequest');
      logger.debug(values);

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
      logger.debug('Failed:', error);
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
        {t('common:create')}
      </Button>

      <Modal
        title={t('common:create')}
        open={createFormModal}
        onCancel={handleCancel}
        width={800}
        footer={
          <div className="flex justify-end gap-2">
            <Button type="secondary" onClick={handleCancel}>
              {t('common:cancel')}
            </Button>
            <Button type="primary" onClick={handleOk} loading={createMutation.isPending}>
              {add_to_existing ? 'Add' : 'Create'}
            </Button>
          </div>
        }
      >
        <Table columns={columns} dataSource={data} pagination={false} />
        <br />
        <Form<FormType>
          size="large"
          layout="vertical"
          form={form}
          onFinish={onFinish}
          initialValues={{
            providerKind: 'LVM_THIN',
          }}
        >
          <Form.Item
            tooltip={t('vsan:sp_name_tooltip')}
            name="poolName"
            label={t('storage_pool:storage_pool_name')}
            required
            rules={[
              {
                required: true,
                message: t('common:name_required'),
              },
              {
                min: 3,
                message: t('common:name_min_3'),
              },
              {
                max: 48,
                message: t('common:name_max_48'),
              },
              {
                pattern: /^([A-Za-z_][A-Za-z0-9_-]+)$/,
                message:
                  'Name must start with a letter or an underscore, and can only contain letters, numbers, hyphens, and underscores!',
              },
            ]}
          >
            {add_to_existing ? (
              <Select options={spOption} placeholder={t('resource:please_select_storage_pool')} />
            ) : (
              <Input placeholder={t('common:please_input_pool_name')} />
            )}
          </Form.Item>

          <Form.Item
            label={t('common:add_create_new_pool')}
            tooltip={t('vsan:add_to_existing_tooltip')}
            name="add_to_existing"
            valuePropName="checked"
          >
            <Checkbox>{t('vsan:add_to_existing_pool')}</Checkbox>
          </Form.Item>

          <Form.Item
            label={t('common:storage_pool_type')}
            name="providerKind"
            tooltip={
              <div>
                <p>{t('vsan:lvm_help')}</p>
                <p>{t('vsan:lvm_thin_help')}</p>
                <p>{t('vsan:lvm_vdo_help')}</p>
              </div>
            }
            required
            rules={[
              {
                required: true,
                message: t('storage_pool:type_required'),
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
