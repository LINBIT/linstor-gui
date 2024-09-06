// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Dropdown, DropdownToggle, DropdownItem } from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';

import { useTranslation } from 'react-i18next';

import './LngSelector.css';

const items = [
  {
    key: 'en',
    text: 'English',
  },
  {
    key: 'de',
    text: 'German',
  },
  {
    key: 'zh',
    text: 'Chinese',
  },
  {
    key: 'ja',
    text: 'Japanese',
  },
  {
    key: 'tr',
    text: 'Turkish',
  },
  {
    key: 'es',
    text: 'Spanish',
  },
  {
    key: 'fr',
    text: 'French',
  },
  {
    key: 'ru',
    text: 'Russian',
  },
];

const LngSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState('English');

  const { i18n } = useTranslation();

  const handleLanguageChange = (lang: { key: string; text: string }) => {
    i18n.changeLanguage(lang.key);
    setSelected(lang.text);
  };

  const dropdownItems = items.map((e) => (
    <DropdownItem
      key={e.key}
      component="button"
      onClick={() => {
        handleLanguageChange(e);
      }}
    >
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
