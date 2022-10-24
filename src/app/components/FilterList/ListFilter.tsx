import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Toolbar, ToolbarItem, ToolbarContent, ToolbarToggleGroup, ToolbarGroup } from '@patternfly/react-core';
import {
  Button,
  ButtonVariant,
  InputGroup,
  Select,
  SelectOption,
  SelectVariant,
  TextInput,
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import { FilterIcon } from '@patternfly/react-icons';
import { capitalize } from '@app/utils/stringUtils';

interface Prop {
  handleSearch: (node: string) => void;
  handleFilter: (status: string) => void;
  showFilter: boolean;
  showSearch: boolean;
  selected: Array<unknown>;
  toolButtons?: React.ReactNode;
}

const ListFilter: React.FC<Prop> = ({ handleSearch, handleFilter, showFilter, toolButtons, showSearch }) => {
  const [inputVal, setInputVal] = useState('');
  const [statusIsExpanded, setStatusIsExpanded] = useState(false);
  const [statusSelected, setStatusSelected] = useState([]);
  const { t } = useTranslation('common');

  const NODE_STATUS_MAP = [
    'ALL',
    'OFFLINE',
    'CONNECTED',
    'ONLINE',
    'VERSION_MISMATCH',
    'FULL_SYNC_FAILED',
    'AUTHENTICATION_ERROR',
    'UNKNOWN',
    'HOSTNAME_MISMATCH',
    'OTHER_CONTROLLER',
    'AUTHENTICATED',
    'NO_STLT_CONN',
  ];

  const statusOptions = NODE_STATUS_MAP.map((e) => ({
    value: capitalize(e),
    disabled: false,
  }));

  const onInputChange = (newValue) => {
    setInputVal(newValue);
  };

  const onStatusToggle = (isExpanded) => {
    setStatusIsExpanded(isExpanded);
  };

  const onStatusSelect = (event, selection, isPlaceholder) => {
    if (isPlaceholder) clearStatusSelection();
    setStatusSelected(selection);
    setStatusIsExpanded(false);
    handleFilter(selection);
  };

  const clearStatusSelection = () => {
    setStatusSelected([]);
    setStatusIsExpanded(false);
  };

  const toggleGroupItems = (
    <React.Fragment>
      {showSearch && (
        <ToolbarItem>
          <InputGroup>
            <TextInput
              type="search"
              aria-label="search input example"
              onChange={onInputChange}
              value={inputVal}
              placeholder={t('search')}
            />
            <Button
              variant={ButtonVariant.control}
              onClick={() => handleSearch(inputVal)}
              aria-label="search button for search input"
            >
              <SearchIcon />
            </Button>
          </InputGroup>
        </ToolbarItem>
      )}

      {showFilter && (
        <ToolbarGroup variant="filter-group">
          <ToolbarItem>
            <Select
              variant={SelectVariant.single}
              aria-label="Select Input"
              onToggle={onStatusToggle}
              onSelect={onStatusSelect}
              selections={statusSelected}
              isOpen={statusIsExpanded}
            >
              {statusOptions.map((option, index) => (
                <SelectOption isDisabled={option.disabled} key={index} value={option.value} />
              ))}
            </Select>
          </ToolbarItem>
        </ToolbarGroup>
      )}

      {toolButtons ? toolButtons : []}
    </React.Fragment>
  );

  const items = (
    <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
      {toggleGroupItems}
    </ToolbarToggleGroup>
  );

  return (
    <Toolbar id="toolbar-component-managed-toggle-groups" className="pf-m-toggle-group-container">
      <ToolbarContent>{items}</ToolbarContent>
    </Toolbar>
  );
};

export default ListFilter;
