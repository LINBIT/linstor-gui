// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import SVG from 'react-inlinesvg';

import connectedIcon from '@app/assets/icons/connected.svg';
import disconnectedIcon from '@app/assets/icons/disconnected.svg';
import faultyResourceIcon from '@app/assets/icons/faulty-resource.svg';
import lockIcon from '@app/assets/icons/lock.svg';
import logIcon from '@app/assets/icons/log.svg';
import unlockedIcon from '@app/assets/icons/unlocked.svg';
import userIcon from '@app/assets/icons/user.svg';
import dotsIcon from '@app/assets/icons/dots.svg';

type IconProps = {
  className?: string;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
  onClick?: () => void;
  color?: string;
  title?: string;
};

const createIcon = (src: string) => {
  return React.forwardRef<SVGSVGElement, IconProps>(
    ({ className = '', style, width = 30, height = 30, onClick, color, title }, ref) => {
      // Extract color from className if present
      const colorFromClassName = className.match(/text-\[([^\]]+)\]/)?.[1];
      const finalColor = color || colorFromClassName;

      return (
        <SVG
          src={src}
          width={width}
          height={height}
          className={`inline-block ${className}`}
          style={{
            cursor: onClick ? 'pointer' : undefined,
            color: finalColor,
            ...style,
          }}
          onClick={onClick}
          innerRef={ref}
          title={title}
        />
      );
    },
  );
};

export const ConnectedIcon = createIcon(connectedIcon);
ConnectedIcon.displayName = 'ConnectedIcon';

export const DisconnectedIcon = createIcon(disconnectedIcon);
DisconnectedIcon.displayName = 'DisconnectedIcon';

export const FaultyResourceIcon = createIcon(faultyResourceIcon);
FaultyResourceIcon.displayName = 'FaultyResourceIcon';

export const LockIcon = createIcon(lockIcon);
LockIcon.displayName = 'LockIcon';

export const LogIcon = createIcon(logIcon);
LogIcon.displayName = 'LogIcon';

export const UnlockedIcon = createIcon(unlockedIcon);
UnlockedIcon.displayName = 'UnlockedIcon';

export const UserIcon = createIcon(userIcon);
UserIcon.displayName = 'UserIcon';

export const DotsIcon = createIcon(dotsIcon);
DotsIcon.displayName = 'DotsIcon';
