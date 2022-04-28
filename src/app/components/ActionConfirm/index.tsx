import React from 'react';
import { Modal, ModalVariant, Button } from '@patternfly/react-core';

const ActionConfirm = ({ onConfirm, onCancel, isModalOpen }) => {
  return (
    <React.Fragment>
      <Modal
        variant={ModalVariant.small}
        title="Confirm"
        isOpen={isModalOpen}
        onClose={onCancel}
        actions={[
          <Button
            key="confirm"
            variant="danger"
            onClick={() => {
              onConfirm();
            }}
          >
            Confirm
          </Button>,
          <Button key="cancel" variant="link" onClick={onCancel}>
            Cancel
          </Button>,
        ]}
      >
        Are you sure you want to delete this?
      </Modal>
    </React.Fragment>
  );
};

export default ActionConfirm;
