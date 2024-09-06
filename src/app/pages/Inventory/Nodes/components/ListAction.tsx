// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Modal, ModalVariant, Button } from '@patternfly/react-core';

type ListActionProps = {
  onConfirm: () => void;
  message: string;
  action: string;
};

export const ListAction: React.FC<ListActionProps> = ({ onConfirm, message, action }) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleConfirm = () => {
    onConfirm();
    handleModalToggle();
  };

  return (
    <React.Fragment>
      <Button variant="danger" onClick={handleModalToggle}>
        {action}
      </Button>
      <Modal
        variant={ModalVariant.small}
        title="Warning"
        isOpen={isModalOpen}
        onClose={handleModalToggle}
        actions={[
          <Button key="confirm" variant="danger" onClick={handleConfirm}>
            Confirm
          </Button>,
          <Button key="cancel" variant="link" onClick={handleModalToggle}>
            Cancel
          </Button>,
        ]}
      >
        {message}
      </Modal>
    </React.Fragment>
  );
};
