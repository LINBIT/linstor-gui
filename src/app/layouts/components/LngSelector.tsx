// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState, useEffect } from 'react';
import { Dropdown, MenuProps } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import './LngSelector.css';

const items = [
  { key: 'en', text: 'English', short: 'EN' },
  { key: 'de', text: 'Deutsch (German)', short: 'DE' },
  { key: 'zh', text: '中文 (Chinese)', short: 'CN' },
  { key: 'ja', text: '日本語 (Japanese)', short: 'JP' },
  { key: 'tr', text: 'Türkçe (Turkish)', short: 'TR' },
  { key: 'es', text: 'Español (Spanish)', short: 'ES' },
  { key: 'fr', text: 'Français (French)', short: 'FR' },
  { key: 'ru', text: 'Русский (Russian)', short: 'RU' },
];

const LngSelector: React.FC = () => {
  const [selected, setSelected] = useState('EN');
  const { i18n } = useTranslation();

  useEffect(() => {
    const savedLangKey = localStorage.getItem('selectedLanguageKey');
    if (savedLangKey) {
      const item = items.find((item) => item.key === savedLangKey);
      if (item) {
        i18n.changeLanguage(savedLangKey);
        setSelected(item.short);
      }
    }
  }, [i18n]);

  const handleLanguageChange = (lang: { key: string; text: string; short: string }) => {
    i18n.changeLanguage(lang.key);
    setSelected(lang.short);
    localStorage.setItem('selectedLanguageKey', lang.key);
  };

  const menuItems: MenuProps['items'] = items.map((e) => ({
    key: e.key,
    label: e.text,
    onClick: () => handleLanguageChange(e),
  }));

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']}>
      <span className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
        <span className="w-[24px] h-[24px] flex items-center justify-center text-lg">{selected}</span> <DownOutlined />
      </span>
    </Dropdown>
  );
};

export default LngSelector;
