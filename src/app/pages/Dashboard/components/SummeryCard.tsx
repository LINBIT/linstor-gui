// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useNavigate } from 'react-router-dom';

import './SummeryCard.css';

interface Props {
  title: string;
  value: number;
  icon: React.ReactElement;
  url: string;
}

const SummeryCard: React.FC<Props> = ({ title, value, icon, url }) => {
  const navigate = useNavigate();

  return (
    <div className="summery__card" onClick={() => navigate(url)}>
      <div className="summery__title">
        {icon} <span>{title}</span>
      </div>
      <div>
        <div className="summery__content">{value}</div>
      </div>
    </div>
  );
};

export default SummeryCard;
