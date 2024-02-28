import { RootState } from '@app/store';
import React from 'react';
import { useSelector } from 'react-redux';

export const GrafanaDashboard = () => {
  const { dashboardEnabled, dashboardURL } = useSelector((state: RootState) => ({
    dashboardEnabled: state.setting?.KVS?.dashboardEnabled,
    dashboardURL: state.setting?.KVS?.dashboardURL,
  }));
  if (!dashboardEnabled) {
    return null;
  }
  return <iframe style={{ width: '100%', height: '100%' }} title="dashboard" src={dashboardURL as string} />;
};
