// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRequest } from 'ahooks';
import { Button, Pagination, PaginationVariant, ToolbarItem } from '@patternfly/react-core';
import { ICell } from '@patternfly/react-table';

import ListFilter from './ListFilter';
import ListTable from './ListTable';

interface Props {
  url: string;
  columns: Array<ICell>;
  cells: (item: any) => Array<ICell>;
  actions: Array<unknown>;
  toolButtons?: Array<unknown>;
  /** if need to fetch list */
  fetchList?: boolean;
  showFilter?: boolean;
  showSearch?: boolean;
  filerField?: string;
  filterFunc?: (data: any) => boolean;
  customHandler?: (data) => Array<any>;
  statsUrl?: string;
  noSelect?: boolean;
}

const FilterList: React.FC<Props> = ({
  fetchList,
  url,
  filerField,
  filterFunc,
  customHandler,
  actions,
  toolButtons = [],
  showFilter = false,
  showSearch = false,
  statsUrl,
  ...rest
}) => {
  const [dataList, setDataList] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selected, setSelected] = useState([]);

  const {
    data,
    run,
    error = false,
    loading,
  } = useRequest(
    (search?: string, page?: number, perPage?: number) => {
      let actualUrl = '';
      let query = '';
      if (typeof search === 'undefined' || search === '') {
        actualUrl = url;
        if (typeof page !== 'undefined' && typeof perPage !== 'undefined') {
          actualUrl = `${actualUrl}?limit=${perPage}&offset=${(page - 1) * perPage}`;
        }
      } else {
        const pathArr = url.split('/');
        if (Array.isArray(pathArr)) {
          query = pathArr[pathArr.length - 1].replace('-', '_');
        }
        actualUrl = `${url}?${query}=${search}`;
      }

      return {
        url: actualUrl,
      };
    },
    {
      manual: true,
    }
  );

  // count
  const { data: statsData } = useRequest(`${statsUrl}`);

  useEffect(() => {
    (async function () {
      // fetch again
      await run('', page, perPage);
      // reset selected
      setSelected([]);
    })();
  }, [run, fetchList, page, perPage]);

  useEffect(() => {
    if (data?.length) {
      let dataHandled = data;
      if (filterFunc) {
        dataHandled = data.filter(filterFunc);
      }
      if (customHandler) {
        dataHandled = customHandler(dataHandled);
      }
      setDataList(dataHandled);
    } else {
      setDataList([]);
    }
  }, [customHandler, data, filterFunc]);

  const handleFilter = (status: string) => {
    const newDataList =
      status === 'ALL' ? data : data.filter((e: { [x: string]: string }) => e?.[filerField as string] === status); // TODO
    setDataList(newDataList);
  };

  const handleSelectChange = (data) => {
    setSelected(data.filter((e: { selected: boolean }) => e.selected));
  };

  const toolButtonsResolve = useMemo(() => {
    return toolButtons.map((e: any) => {
      if (e.alwaysShow || selected.length) {
        return (
          <React.Fragment key={e.label}>
            <ToolbarItem variant="separator" />
            <ToolbarItem>
              <Button variant={e?.variant} onClick={() => e.onClick(selected)}>
                {e?.label}
              </Button>
            </ToolbarItem>
          </React.Fragment>
        );
      } else {
        return null;
      }
    });
  }, [selected, toolButtons]);

  const handleClear = useCallback(() => {}, []);

  return (
    <>
      <ListFilter
        handleSearch={(search) => run(search, 1, 10)}
        handleFilter={handleFilter}
        showFilter={showFilter}
        showSearch={showSearch}
        toolButtons={toolButtonsResolve}
        selected={selected}
      />
      <ListTable
        handleSelectChange={handleSelectChange}
        listData={dataList}
        loading={loading}
        error={error}
        actions={actions}
        onClear={handleClear}
        {...rest}
      />
      {!(error && !loading) && (
        <Pagination
          itemCount={statsData?.count}
          widgetId="pagination-options-menu-bottom"
          perPage={perPage}
          page={page}
          variant={PaginationVariant.bottom}
          onSetPage={(e, newPage) => {
            setPage(newPage);
          }}
          onPerPageSelect={(e, newPerPage, newPage) => {
            setPage(newPage);
            setPerPage(newPerPage);
          }}
        />
      )}
    </>
  );
};

export default FilterList;
