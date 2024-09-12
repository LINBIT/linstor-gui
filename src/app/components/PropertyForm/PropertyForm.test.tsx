import React from 'react';
import { render } from 'enzyme';

import PropertyEditor from '.';

describe('PropertyEditor tests', () => {
  test('should render PropertyEditor component', () => {
    const wrapper = render(<PropertyEditor type="node" />);
    expect(wrapper.text()).toContain('Property Editor');
  });
});
