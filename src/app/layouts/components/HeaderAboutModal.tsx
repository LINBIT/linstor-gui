import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseOutlined } from '@ant-design/icons';
import { Modal, Input, Tooltip } from 'antd';
import { useSelector } from 'react-redux';

import brandImg from '@app/assets/brand-light.svg';
import bgImg from '@app/assets/about-bg.svg';
import { LINSTORVersionInfo } from './types';
import { RootState } from '@app/store';
import { UIMode } from '@app/models/setting';
import { DotsIcon } from '@app/components/SVGIcon';

interface HeaderAboutModalProps {
  linstorVersion?: LINSTORVersionInfo;
}

const HeaderAboutModal: React.FC<HeaderAboutModalProps> = ({ linstorVersion }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hostModal, setHostModal] = useState(false);
  const [host, setHost] = useState(() => {
    return window.localStorage.getItem('HCI_VSAN_HOST') || '';
  });
  const { t } = useTranslation('about');

  const { mode } = useSelector((state: RootState) => ({
    mode: state.setting.mode,
  }));

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleSetHost = () => {
    window.localStorage.setItem('HCI_VSAN_HOST', host);
    window.location.reload();
  };

  const hostName = window ? window.location.host : '';

  const version = import.meta.env.VITE_VERSION ?? 'DEV';

  return (
    <div className="flex items-center">
      <Tooltip placement="bottomRight" title="System Info">
        <div>
          <DotsIcon title="LINSTOR GUI Info" onClick={handleModalToggle} />
        </div>
      </Tooltip>
      <div className="flex items-center relative z-50">
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center text-black">
            <div
              className="relative max-w-[1000px] max-h-[620px] w-full h-full flex rounded-2xl shadow-2xl overflow-hidden"
              style={{ backgroundImage: `url(${bgImg})`, backgroundSize: 'cover' }}
            >
              <div
                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full z-10 cursor-pointer"
                onClick={handleModalToggle}
              >
                <CloseOutlined />
              </div>

              <div className="w-3/5 pt-[71px] pl-[68px] rounded-2xl">
                <img src={brandImg} alt="LINBIT logo" className="w-40 block" />
                <div className="pl-[48px]">
                  <div className="text-[52px] mt-8 mb-6">LINBIT-SDS</div>
                  <div className="[&>*:not(:last-child)]:mb-3">
                    <div className="flex justify-between text-base">
                      <span className="font-medium">{t('linstor_version')}</span>
                      <span>{linstorVersion?.version || 'unknown'}</span>
                    </div>
                    <div className="flex justify-between text-base">
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
                    <div className="flex justify-between text-base">
                      <span className="font-medium">{t('controller_ip')}</span>
                      <span>0.0.0.0</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="font-medium">{t('controller_active_on')}</span>
                      <span>{hostName}</span>
                    </div>
                  </div>
                  <p className="text-sm opacity-75 leading-relaxed pt-7">{t('trademark')}</p>
                </div>
              </div>
            </div>
            {/* VSAN Host Modal */}
            <Modal title="HCI Host" open={hostModal} onOk={handleSetHost} onCancel={() => setHostModal(false)}>
              <span>HCI Host(for debug only)</span>:
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
