import React from 'react';
import { Button, FileUpload } from '@patternfly/react-core';
import SVG from 'react-inlinesvg';
import isSvg from 'is-svg';
import styled from 'styled-components';

import { useDispatch } from 'react-redux';

import { Dispatch } from '@app/store';

const Wrapper = styled.div`
  padding: 2em 0;
`;

const SaveButton = styled.div`
  margin-top: 1rem;
`;

export const SVGFileUpload: React.FunctionComponent = () => {
  const [value, setValue] = React.useState('');
  const [filename, setFilename] = React.useState('');

  const dispatch = useDispatch<Dispatch>();

  const handleFileInputChange = (
    _event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLElement>,
    file: File
  ) => {
    setFilename(file.name);
  };

  const handleClear = (_event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setFilename('');
    setValue('');
  };

  const handleTextOrDataChange = (value: string) => {
    setValue(value);
  };

  const handleSave = () => {
    if (isSvg(value)) {
      dispatch.setting.setLogo({
        logoSvg: value,
      });
    }
  };

  return (
    <Wrapper>
      <FileUpload
        id="customized-preview-file"
        value={value}
        filename={filename}
        onFileInputChange={handleFileInputChange}
        onClearClick={handleClear}
        browseButtonText="Upload"
        type="text"
        onDataChange={handleTextOrDataChange}
        onTextChange={handleTextOrDataChange}
        hideDefaultPreview
        dropzoneProps={{
          accept: '.svg',
          maxSize: 16 * 1024,
        }}
        filenamePlaceholder="SVG file, limit 16KB"
      >
        {isSvg(value) && (
          <div className="pf-u-m-md">
            <SVG src={value} />
          </div>
        )}
      </FileUpload>
      <SaveButton>
        <Button variant="primary" onClick={handleSave}>
          Save
        </Button>
      </SaveButton>
    </Wrapper>
  );
};

export default SVGFileUpload;
