import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseOutlined } from '@ant-design/icons';
import { Modal, Input } from 'antd';
import { useSelector } from 'react-redux';

import FEATHER_INFO from '@app/assets/feather-info.svg';
import brandImg from '@app/assets/brand-dark.svg';
import bgImg from '@app/assets/about_image.png';
import { LINSTORVersionInfo } from './types';
import { RootState } from '@app/store';
import { UIMode } from '@app/models/setting';

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
    <div>
      <img
        className="w-5 h-5 cursor-pointer mr-2"
        title="LINSTOR GUI Info"
        src={FEATHER_INFO}
        onClick={handleModalToggle}
      />
      <div className="flex items-center relative z-50">
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/75">
            <div className="relative w-[70rem] h-[45rem] flex rounded-2xl shadow-2xl overflow-hidden">
              <div
                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-black text-white rounded-full z-10 cursor-pointer"
                onClick={handleModalToggle}
              >
                <CloseOutlined />
              </div>

              {/* Left Side - Black Background */}
              <div className="w-3/5 bg-black text-white p-16 flex flex-col justify-between rounded-l-2xl">
                <div>
                  <img src={brandImg} alt="LINBIT logo" className="w-40 mb-6" />
                  <div className="text-3xl font-semibold mb-6">LINBIT-SDS</div>
                  <dl className="space-y-4 text-white text-lg">
                    <div className="flex justify-between">
                      <dt className="font-bold">{t('linstor_version')}</dt>
                      <dd>{linstorVersion?.version || 'unknown'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-bold">{t('ui_version')}</dt>
                      <dd
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
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-bold">{t('controller_ip')}</dt>
                      <dd>0.0.0.0</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-bold">{t('controller_active_on')}</dt>
                      <dd>{hostName}</dd>
                    </div>
                  </dl>
                </div>
                <p className="text-sm opacity-75 leading-relaxed max-h-40 overflow-y-auto">{t('trademark')}</p>
              </div>

              {/* Right Side - Background Image */}
              <div
                className="w-2/5 bg-cover bg-center rounded-r-2xl flex items-center justify-center p-6"
                style={{ backgroundImage: `url(${bgImg})` }}
              ></div>
            </div>
            {/* VSAN Host Modal，仅DEV可见 */}
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
