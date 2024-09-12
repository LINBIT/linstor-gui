import React, { useCallback, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { headerCol, ICell } from '@patternfly/react-table';

import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons';

import FilterList from '@app/components/FilterList';
import PageBasic from '@app/components/PageBasic';
import service from '@app/requests';
import PropertyForm from '@app/components/PropertyForm';
import { omit } from '@app/utils/object';

const NodeList: React.FunctionComponent = () => {
  const { t } = useTranslation(['node', 'common']);
  const [fetchList, setFetchList] = useState(false);
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [initialProps, setInitialProps] = useState<Record<string, unknown>>();
  const history = useHistory();
  const [alertList, setAlertList] = useState<alertList>([]);
  const [currentNode, setCurrentNode] = useState();

  const { loading: updatingNode, run: handleUpdateNode } = useRequest(() => ({
    url: '/v1/controller/config',
  }));

  const columns = [{ title: t('binding_ip'), cellTransforms: [headerCol()] }, { title: t('active_on') }, { title: '' }];

  const cells = (item) => {
    const net_interface = item.net_interfaces?.find((e) => e.is_active);

    return [
      item?.name,
      net_interface?.address,
      net_interface?.satellite_port,
      item?.type,
      {
        title: (
          <div>
            {item?.connection_status === 'ONLINE' ? (
              <CheckCircleIcon color="green" />
            ) : (
              <ExclamationCircleIcon color="red" />
            )}

            <span> {item?.connection_status}</span>
          </div>
        ),
      },
      { ...item?.props },
    ] as ICell[];
  };

  const toolButtons = useMemo(() => {
    return [
      {
        title: t('common:property'),
        onClick: (event, rowId, rowData, extra) => {
          const node = rowData.cells[0];
          console.log('clicked on Some action, on row: ', rowData.cells[0]);
          const currentData = omit(rowData.cells[5] ?? {}, 'CurStltConnName');
          console.log(currentData, 'currentData');
          setInitialProps(currentData);
          setPropertyModalOpen(true);
          setCurrentNode(node);
        },
      },
    ];
  }, [t]);

  return (
    <PageBasic title={t('controller_list')} alerts={alertList}>
      <PropertyForm
        initialVal={initialProps}
        openStatus={propertyModalOpen}
        type="node"
        handleSubmit={handleUpdateNode}
        handleClose={() => setPropertyModalOpen(!propertyModalOpen)}
      />
    </PageBasic>
  );
};

export default NodeList;
