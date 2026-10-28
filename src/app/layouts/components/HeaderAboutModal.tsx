import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseOutlined } from '@ant-design/icons';
import { Modal, Tooltip } from 'antd';
import { Input } from '@app/components/Input';

import { Button } from '@app/components/Button';
import brandImgOnLight from '@app/assets/brand-light.svg';
import brandImgOnDark from '@app/assets/brand-dark.svg';
import bgImg from '@app/assets/about-bg.svg';
import { LINSTORVersionInfo } from './types';
import { UIMode } from '@app/features/settings/types';
import { useSettings } from '@app/features/settings/useSettings';
import { DotsIcon } from '@app/components/SVGIcon';
import { linbitSdsVersion, uiVersion } from './aboutVersion';
import { controllerActiveOn } from './controllerActiveOn';
import { useControllerHa } from '@app/features/node/hooks/useActiveController';

interface HeaderAboutModalProps {
  linstorVersion?: LINSTORVersionInfo;
}

/** Which controller the GUI talks to and where it runs; mounted only while the panel is open, so nothing is fetched before. */
const ControllerRows: React.FC<HeaderAboutModalProps> = ({ linstorVersion }) => {
  const { t } = useTranslation('about');
  const ha = useControllerHa();

  // The base URL the requests go to: LINSTOR_HOST when set, the page's own origin otherwise
  const address = window.localStorage.getItem('LINSTOR_HOST') || window.location.origin;
  const activeOn = controllerActiveOn(linstorVersion, ha.active);

  return (
    <>
      <div className="flex justify-between gap-4 text-base">
        <span className="font-medium">{t('controller_address')}</span>
        <span className="break-all text-right">{address}</span>
      </div>
      {activeOn && (
        <div className="flex justify-between gap-4 text-base">
          <span className="font-medium">{t('controller_active_on')}</span>
          <span>{activeOn}</span>
        </div>
      )}
    </>
  );
};

const HeaderAboutModal: React.FC<HeaderAboutModalProps> = ({ linstorVersion }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hostModal, setHostModal] = useState(false);
  const [host, setHost] = useState(() => {
    return window.localStorage.getItem('HCI_VSAN_HOST') || '';
  });
  const { t } = useTranslation(['about', 'common']);

  const { mode } = useSettings();

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleSetHost = () => {
    window.localStorage.setItem('HCI_VSAN_HOST', host);
    window.location.reload();
  };

  const version = uiVersion(import.meta.env.VITE_VERSION);
  const sdsVersion = linbitSdsVersion(import.meta.env.LINBIT_SDS_VERSION);

  return (
    <div className="flex items-center">
      <Tooltip placement="bottomRight" title={t('common:system_info')}>
        <div>
          <DotsIcon title={t('common:linstor_gui_info')} onClick={handleModalToggle} />
        </div>
      </Tooltip>
      <div className="flex items-center relative z-50">
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center p-4 text-[var(--text-primary)]">
            {/* Narrow: as tall as its content, scrolling inside the screen. */}
            <div className="relative flex max-h-full w-full max-w-[1000px] overflow-y-auto rounded-2xl bg-[var(--bg-page)] shadow-2xl md:h-full md:max-h-[620px] md:overflow-hidden">
              <img src={bgImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
              <div
                className="absolute top-3 right-3 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full md:top-6 md:right-6"
                onClick={handleModalToggle}
              >
                <CloseOutlined />
              </div>

              <div className="relative z-10 w-full rounded-2xl px-6 pt-14 pb-6 md:w-3/5 md:pt-[71px] md:pr-0 md:pb-0 md:pl-[68px]">
                <img src={brandImgOnLight} alt="LINBIT logo" className="w-40 block logo-on-light" />
                <img src={brandImgOnDark} alt="LINBIT logo" className="w-40 block logo-on-dark" />
                <div className="md:pl-[48px]">
                  <div className="mt-6 mb-5 text-[36px] md:mt-8 md:mb-6 md:text-[52px]">LINBIT-SDS</div>
                  <div className="[&>*:not(:last-child)]:mb-3">
                    <div className="flex justify-between gap-4 text-base">
                      <span className="font-medium">{t('linstor_version')}</span>
                      <span>{linstorVersion?.version || 'unknown'}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-base">
                      <span className="font-medium">{t('ui_version')}</span>
                      <span
                        style={{
                          cursor: version.indexOf('DEV') !== -1 && mode === UIMode.HCI ? 'pointer' : 'default',
                          textDecoration: version.indexOf('DEV') !== -1 && mode === UIMode.HCI ? 'underline' : 'none',
                        }}
                        onClick={() => {
                          if (version.indexOf('DEV') !== -1 && mode === UIMode.HCI) {
                            setHostModal(true);
                          }
                        }}
                      >
                        {version}
                      </span>
                    </div>
                    {sdsVersion && (
                      <div className="flex justify-between gap-4 text-base">
                        <span className="font-medium">{t('sds_version')}</span>
                        <span>{sdsVersion}</span>
                      </div>
                    )}
                    <ControllerRows linstorVersion={linstorVersion} />
                  </div>
                  <p className="text-sm opacity-75 leading-relaxed pt-7">{t('trademark')}</p>
                </div>
              </div>
            </div>
            {/* VSAN Host Modal */}
            <Modal
              title={t('common:hci_host')}
              open={hostModal}
              onCancel={() => setHostModal(false)}
              footer={
                <div className="flex justify-end gap-2">
                  <Button type="secondary" onClick={() => setHostModal(false)}>
                    {t('common:cancel')}
                  </Button>
                  <Button type="primary" onClick={handleSetHost}>
                    {t('common:confirm')}
                  </Button>
                </div>
              }
            >
              <span>{t('vsan:debug_host', { name: 'HCI' })}</span>:
              <br />
              <Input
                value={host}
                onChange={(evt) => setHost(evt.target.value)}
                placeholder="https://192.168.0.1:1443"
              />
            </Modal>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderAboutModal;
