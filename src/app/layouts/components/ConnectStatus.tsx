import React, { useCallback } from 'react';
import { Spinner } from '@patternfly/react-core';

import { useRequest } from 'ahooks';

import { useTranslation } from 'react-i18next';

import CONNECTED_SVG from '@app/assets/awesome-plug.svg';
import DISCONNECTED_SVG from '@app/assets/disconnected-icon.svg';

import './ConnectStatus.css';
import { useHistory } from 'react-router-dom';

const ConnectStatus: React.FC = () => {
  const { error, loading } = useRequest('/v1/controller/config');
  const { t } = useTranslation('common');
  const history = useHistory();

  const navigateToControllerDetail = useCallback(() => {
    history.push('/controller');
  }, [history]);

  if (loading) {
    return <Spinner isSVG size="sm" />;
  }

  return (
    <div className="connect__status">
      {error ? (
        <>
          <img className="connected__img" src={DISCONNECTED_SVG} /> <span>{t('disconnected')}</span>
        </>
      ) : (
        <>
          <img className="connected__img" src={CONNECTED_SVG} /> <span>{t('connected')}</span>
        </>
      )}
    </div>
  );
};

export default ConnectStatus;
