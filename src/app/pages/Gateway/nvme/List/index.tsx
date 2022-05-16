import React, { useState } from 'react';
import { TableComposable, Thead, Tr, Th, Tbody, Td, ThProps } from '@patternfly/react-table';
import { Button, Label, Modal, ModalVariant } from '@patternfly/react-core';
import styled from 'styled-components';
import InfoCircleIcon from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';

import { NVME } from '@app/interfaces/nvme';
import ActionConfirm from '@app/components/ActionConfirm';
import DynamicForm from '@app/components/DynamicForm';
import { convertRoundUp, sizeOptions } from '@app/utils/size';
import { useSelector } from 'react-redux';
import { RootState } from '@app/store';

interface Data {
  list: NVME[];
  handleDelete: (nqn: string) => void;
  handleStart: (nqn: string) => void;
  handleStop: (nqn: string) => void;
  handleDeleteVolume: (nqn: string, lun: number) => void;
  handleAddVolume: (nqn: string, LUN: number, size_kib: number) => void;
}

const Wrapper = styled.div`
  padding: 2em 0;
  display: flex;

  button:not(:last-child) {
    margin-right: 1em;
  }
`;

export const ISCSIList: React.FC<Data> = ({
  list,
  handleDelete,
  handleStart,
  handleStop,
  handleDeleteVolume,
  handleAddVolume,
}) => {
  const { addingVolume } = useSelector((state: RootState) => ({
    addingVolume: state.loading.effects.iscsi.addLUN,
  }));
  // Delele Modal open
  const [isOpen, setIsOpen] = useState(false);
  const [lunModal, setLunModal] = useState(false);
  const [IQN, setIQN] = useState('');
  const [LUN, setLUN] = useState(0);

  const initialExpandedRepoNames = list.map((repo) => repo.nqn); // Default to all expanded
  const [expandedRepoNames, setExpandedRepoNames] = React.useState<string[]>(initialExpandedRepoNames);
  const setRepoExpanded = (repo: NVME, isExpanding = true) =>
    setExpandedRepoNames((prevExpanded) => {
      const otherExpandedRepoNames = prevExpanded.filter((r) => r !== repo.nqn);
      return isExpanding ? [...otherExpandedRepoNames, repo.nqn] : otherExpandedRepoNames;
    });
  const isRepoExpanded = (repo: NVME) => expandedRepoNames.includes(repo.nqn);

  console.log(initialExpandedRepoNames, 'initialExpandedRepoNames');

  const columnNames = {
    nqn: 'NQN',
    service_ip: 'Service IP',
    service_state: 'Service State',
    lun: 'Namespace',
    linstor_state: 'LINSTOR State',
  };

  return (
    <React.Fragment>
      <TableComposable aria-label="Sortable table custom toolbar" isExpandable>
        <Thead>
          <Tr>
            <Th />
            <Th>{columnNames.nqn}</Th>
            <Th>{columnNames.service_ip}</Th>
            <Th>{columnNames.service_state}</Th>
            <Th>{columnNames.lun}</Th>
            <Th>{columnNames.linstor_state}</Th>
            <Td>Action</Td>
          </Tr>
        </Thead>

        {list.map((item, rowIndex) => {
          const isStarted = item.status.service === 'Started';
          return (
            <Tbody key={rowIndex} isExpanded={isRepoExpanded(item)}>
              <Tr>
                <Td
                  expand={
                    item.volumes.length > 2
                      ? {
                          rowIndex,
                          isExpanded: isRepoExpanded(item),
                          onToggle: () => setRepoExpanded(item, !isRepoExpanded(item)),
                        }
                      : undefined
                  }
                />
                <Td dataLabel={columnNames.nqn}>{item.nqn}</Td>
                <Td dataLabel={columnNames.service_ip}>{item.service_ip}</Td>
                <Th dataLabel={columnNames.service_state}>
                  <Label color={isStarted ? 'green' : 'grey'} icon={<InfoCircleIcon />}>
                    {item.status.service}
                  </Label>
                </Th>
                <Th>1</Th>
                <Th dataLabel={columnNames.linstor_state}>
                  <Label color={item.status.state === 'OK' ? 'green' : 'red'} icon={<InfoCircleIcon />}>
                    {item.status.state}
                  </Label>
                </Th>
                <Td isActionCell>
                  <Wrapper>
                    <Button
                      isDisabled={item.starting || item.stopping}
                      variant="primary"
                      onClick={() => (isStarted ? handleStop(item.nqn) : handleStart(item.nqn))}
                    >
                      {item.starting && 'Starting...'}
                      {item.stopping && 'Stopping...'}
                      {!item.starting && !item.stopping && isStarted && 'Stop'}
                      {!item.starting && !item.stopping && !isStarted && 'Start'}
                    </Button>

                    <Button variant="danger" isDisabled={item.deleting} onClick={() => setIsOpen(true)}>
                      {item.deleting ? 'Deleting...' : 'Delete'}
                    </Button>

                    <Button
                      variant="primary"
                      onClick={() => {
                        setIQN(item.nqn);
                        setLUN(item.volumes[item.volumes.length - 1].number + 1); // TODO: LUN number should be dynamic
                        setLunModal(true);
                      }}
                    >
                      Add Volume
                    </Button>
                    <Button
                      variant="danger"
                      isDisabled={item.deleting}
                      onClick={() => {
                        handleDeleteVolume(item.nqn, item.volumes[item.volumes.length - 1].number);
                      }}
                    >
                      {item.deleting ? 'Deleting...' : 'Delete Volume'}
                    </Button>

                    <ActionConfirm
                      onConfirm={() => {
                        handleDelete(item.nqn);
                        setIsOpen(false);
                      }}
                      onCancel={() => setIsOpen(false)}
                      isModalOpen={isOpen}
                    />
                  </Wrapper>
                </Td>
              </Tr>
              {item.volumes
                .filter((v) => v.number > 1)
                .map((volume, volumeIndex) => (
                  <Tr key={volumeIndex} isExpanded={isRepoExpanded(item)}>
                    <Td />
                    <Td dataLabel={columnNames.nqn}></Td>
                    <Td dataLabel={columnNames.service_ip}></Td>
                    <Th dataLabel={columnNames.service_state}>
                      <Label color={isStarted ? 'green' : 'grey'} icon={<InfoCircleIcon />}>
                        {item.status.service}
                      </Label>
                    </Th>
                    <Th>{volume.number}</Th>
                    <Th dataLabel={columnNames.linstor_state}>
                      <Label color={item.status.state === 'OK' ? 'green' : 'red'} icon={<InfoCircleIcon />}>
                        {item.status.state}
                      </Label>
                    </Th>
                    <Td isActionCell>
                      <Wrapper>
                        <Button
                          variant="danger"
                          isDisabled={item.deleting}
                          onClick={() => {
                            handleDeleteVolume(item.nqn, volume.number);
                          }}
                        >
                          {item.deleting ? 'Deleting...' : 'Delete Volume'}
                        </Button>
                      </Wrapper>
                    </Td>
                  </Tr>
                ))}
            </Tbody>
          );
        })}
      </TableComposable>
      <Modal isOpen={lunModal} variant={ModalVariant.small} title="Add LUN" onClose={() => setLunModal(false)}>
        <DynamicForm
          initialVal={[]}
          submitting={addingVolume}
          handleSubmitData={(data) => {
            const size = convertRoundUp(data['size']['unit'], data['size']['number']);
            handleAddVolume(IQN, LUN, size);
            setLunModal(false);
          }}
          formItems={[
            {
              id: '1',
              name: 'size',
              label: 'Size',
              type: 'size',
              validationInfo: {
                isRequired: true,
                invalidMessage: 'Size must be a number',
              },
              extraInfo: {
                options: sizeOptions.map((e) => ({ ...e, isDisabled: false })),
              },
            },
          ]}
          handleCancelClick={() => setLunModal(false)}
          propertyForm={true}
        />
      </Modal>
    </React.Fragment>
  );
};
