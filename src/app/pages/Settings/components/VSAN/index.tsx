// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { Dispatch, RootState } from '@app/store';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Switch, Modal } from 'antd';

export const VSAN = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  const dispatch = useDispatch<Dispatch>();

  const { vsanMode } = useSelector((state: RootState) => ({
    vsanMode: state?.setting?.KVS?.vsanMode,
  }));

  useEffect(() => {
    setChecked(vsanMode as boolean);
  }, [vsanMode]);

  const handleOk = () => {
    dispatch.setting.exitVSANMode();
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  if (vsanMode) {
    return (
      <div style={{ padding: 10 }}>
        <span style={{ marginRight: 8 }}>VSAN Mode:</span>
        <Switch
          checked={checked}
          onChange={(val) => {
            setChecked(val);
            setIsModalOpen(true);
          }}
        />

        <Modal title={checked ? '' : 'Exit VSAN Mode'} open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
          <p>Are you certain that you want to exit VSAN Mode?</p>
        </Modal>
      </div>
    );
  }

  return null;
};
