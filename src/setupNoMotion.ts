// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

// Imported first by setupTests, before antd loads. rc-motion (antd's
// animations) decides once, from the style properties an element knows,
// whether the browser animates. jsdom knows transition and animation since
// 27 but never fires transitionend/animationend, so a closed Modal or Popover
// would wait forever to leave. Hidden, as they were before, nothing animates.
const style = document.createElement('div').style;
for (const property of ['animation', 'WebkitAnimation', 'transition', 'WebkitTransition']) {
  for (let proto = Object.getPrototypeOf(style); proto; proto = Object.getPrototypeOf(proto)) {
    if (Object.prototype.hasOwnProperty.call(proto, property)) {
      delete proto[property];
      break;
    }
  }
}
