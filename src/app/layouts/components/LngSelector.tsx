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
  { key: 'en', text: 'English' },
  { key: 'de', text: 'Deutsch (German)' },
  { key: 'zh', text: '中文 (Chinese)' },
  { key: 'ja', text: '日本語 (Japanese)' },
  { key: 'tr', text: 'Türkçe (Turkish)' },
  { key: 'es', text: 'Español (Spanish)' },
  { key: 'fr', text: 'Français (French)' },
  { key: 'ru', text: 'Русский (Russian)' },
];

const LngSelector: React.FC = () => {
  const [selected, setSelected] = useState('English');
  const { i18n } = useTranslation();

  useEffect(() => {
    const savedLangKey = localStorage.getItem('selectedLanguageKey');
    const savedLangText = localStorage.getItem('selectedLanguageText');
    if (savedLangKey && savedLangText) {
      i18n.changeLanguage(savedLangKey);
      setSelected(savedLangText);
    }
  }, [i18n]);

  const handleLanguageChange = (lang: { key: string; text: string }) => {
    i18n.changeLanguage(lang.key);
    setSelected(lang.text);
    localStorage.setItem('selectedLanguageKey', lang.key);
    localStorage.setItem('selectedLanguageText', lang.text);
  };

  const menuItems: MenuProps['items'] = items.map((e) => ({
    key: e.key,
    label: e.text,
    onClick: () => handleLanguageChange(e),
  }));

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']}>
      <span className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
        {selected} <DownOutlined />
      </span>
    </Dropdown>
  );
};

export default LngSelector;
