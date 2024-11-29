// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState, useEffect } from 'react';
import { Dropdown, DropdownToggle, DropdownItem } from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';

import { useTranslation } from 'react-i18next';

import './LngSelector.css';

const items = [
  { key: 'en', text: 'English' },
  { key: 'de', text: 'Deutsch (German)' },
  { key: 'zh', text: '中文 (Chinese)' },
  { key: 'ja', text: '日本語 (Japanese)' },
  { key: 'tr', text: 'Türkçe (Turkish)' },
  { key: 'es', text: 'Español (Spanish)' },
];

const LngSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState('English');

  const { i18n } = useTranslation();

  useEffect(() => {
    // Load the saved language from localStorage, if available
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

    // Save the selected language to localStorage
    localStorage.setItem('selectedLanguageKey', lang.key);
    localStorage.setItem('selectedLanguageText', lang.text);
  };

  const dropdownItems = items.map((e) => (
    <DropdownItem key={e.key} component="button" onClick={() => handleLanguageChange(e)}>
      {e.text}
    </DropdownItem>
  ));

  return (
    <Dropdown
      onSelect={() => setIsOpen(!isOpen)}
      toggle={
        <DropdownToggle id="toggle-id" onToggle={() => setIsOpen(!isOpen)} toggleIndicator={CaretDownIcon}>
          {selected}
        </DropdownToggle>
      }
      isOpen={isOpen}
      dropdownItems={dropdownItems}
      className="linbit__drop"
    />
  );
};

export default LngSelector;
