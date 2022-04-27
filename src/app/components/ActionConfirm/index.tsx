import React, { useState } from 'react';
import { Modal, ModalVariant, Button } from '@patternfly/react-core';

const ActionConfirm = ({ handleDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <React.Fragment>
      <Button variant="danger" onClick={handleDelete}>
        Delete
      </Button>
      <Modal
        variant={ModalVariant.small}
        title="Small modal header"
        isOpen={isModalOpen}
        onClose={handleModalToggle}
        actions={[
          <Button key="confirm" variant="primary" onClick={handleModalToggle}>
            Confirm
          </Button>,
          <Button key="cancel" variant="link" onClick={handleModalToggle}>
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
