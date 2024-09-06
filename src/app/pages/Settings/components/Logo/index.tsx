// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import SVG from 'react-inlinesvg';
import styled from '@emotion/styled';
import { useSelector } from 'react-redux';
import isSvg from 'is-svg';

import { RootState } from '@app/store';
import SVGFileUpload from './SVGUploader';

// For setting Logo related stuff
const Logo: React.FC = () => {
  return (
    <div>
      <SVGFileUpload />
    </div>
  );
};

export default Logo;
