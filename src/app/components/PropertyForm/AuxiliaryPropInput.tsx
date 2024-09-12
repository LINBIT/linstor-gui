import React, { useState, useEffect } from 'react';
import { Button, FormGroup, TextInput } from '@patternfly/react-core';

import './AuxiliaryPropInput.css';

type AuxProp = {
  name: string;
  value: string;
  id: string;
};

interface AuxiliaryPropInputProp {
  handleDeleteAuxProp: (id: string) => void;
  initialVal: AuxProp;
  onChange: ({ name, value, id }: AuxProp) => void;
}

const AuxiliaryPropInput: React.FC<AuxiliaryPropInputProp> = ({ initialVal, handleDeleteAuxProp, onChange }) => {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');

  useEffect(() => {
    if (initialVal?.name && initialVal?.value) {
      setName(initialVal.name);
      setValue(initialVal.value);
    }
  }, [initialVal]);

  return (
    <div className="aux">
      <FormGroup label="Auxiliary Prop Name" fieldId="aux-form-name" className="item">
        <TextInput
          value={name}
          onChange={(name) => {
            setName(name);
            onChange({ id: initialVal.id, name, value });
          }}
          id="name_input"
        />
      </FormGroup>

      <FormGroup label="Auxiliary Prop Value" fieldId="aux-form-value" className="item">
        <TextInput
          value={value}
          onChange={(value) => {
            setValue(value);
            onChange({ id: initialVal.id, name, value });
          }}
          id="value_input"
        />
      </FormGroup>

      <Button variant="danger" className="btn" onClick={() => handleDeleteAuxProp(initialVal.id)}>
        Delete
      </Button>
    </div>
  );
};

export default AuxiliaryPropInput;
