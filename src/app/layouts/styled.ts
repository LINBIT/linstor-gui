// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import styled from '@emotion/styled';
import { Modal } from 'antd';
import SVG from 'react-inlinesvg';

export const ImgIcon = styled.img`
  width: 1rem;
  height: 1rem;
  margin-right: 1rem;
`;

export const ModeSelector = styled.div`
  margin-right: 1rem;
`;

export const SideMenu = styled.div`
  .ant-menu.ant-menu-sub.ant-menu-inline {
    background: none;
  }
`;

export const NoSupport = styled.div`
  display: flex;
  align-items: center;
  font-size: 18px;
  margin-right: 60px;
  font-weight: 600;
  color: white;
`;

export const WarningLogo = styled.img`
  width: 29px;
  height: 28px;
`;

export const Attention = styled.div`
  color: #fff;
  margin-left: 16px;
  margin-right: 16px;
`;

export const OutLink = styled(SVG)`
  width: 24px;
  height: 24px;
  margin-left: 4px;
`;

export const OfficialBuild = styled.div`
  font-weight: 500;
  text-underline-offset: 6px;
  text-decoration: underline;
  text-decoration-color: #f79133;
  text-decoration-thickness: 2px;
  cursor: pointer;
  display: flex;
  align-items: center;

  &:hover {
    color: #f79133;
  }

  &:hover .outlink-svg path {
    fill: #f79133;
  }
`;

export const SupportList = styled.ul`
  margin-top: 8px;
  padding-left: 40px;
  font-weight: normal;
  list-style-type: square;
`;

export const SupportListItem = styled.li`
  margin-bottom: 8px;
  padding-left: 12px;
  text-indent: -6px;
`;

export const Warning = styled(SVG)`
  width: 80px;
  height: 76px;
  margin-right: 24px;
`;

export const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 16px;
  }
  .ant-modal-header {
    border-radius: 16px 16px 0 0;
  }
  .ant-modal-footer {
    border-radius: 0 0 16px 16px;
  }
  .ant-modal-body {
    padding: 24px 0;
  }
`;

export const ModalContent = styled.div`
  display: flex;
`;

export const StyledContent = styled.div`
  font-weight: 500;
  font-size: 24px;
  padding-top: 16px;
  padding-bottom: 0;
`;

export const ForOfficialBuild = styled.div`
  font-weight: 500;
  display: flex;
  width: 280px;
  padding: 4px 8px;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border: 2px solid #f79133;
  border-radius: 4px;

  &:hover {
    color: #f79133;
  }

  &:hover .outlink-svg path {
    fill: #f79133;
  }

  & .outlink-svg {
    margin-left: 6px;
  }
`;
