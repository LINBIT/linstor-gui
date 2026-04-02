// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useMutation, useQuery } from '@tanstack/react-query';

import { getResourceDefinition } from '@app/features/resourceDefinition/api';
import { createOrUpdateFile, deleteFile, deployFile, getFile, getFiles, undeployFile } from '../api';

export const useFiles = (includeContent = false) => {
  return useQuery({
    queryKey: ['files', { includeContent }],
    queryFn: () => getFiles(includeContent),
  });
};

export const useFile = (extFileName: string) => {
  return useQuery({
    queryKey: ['file', extFileName],
    queryFn: () => getFile(extFileName),
    enabled: !!extFileName,
  });
};

export const useCreateOrUpdateFile = () => {
  return useMutation({
    mutationFn: ({ extFileName, body }: { extFileName: string; body: Parameters<typeof createOrUpdateFile>[1] }) =>
      createOrUpdateFile(extFileName, body),
  });
};

export const useDeleteFile = () => {
  return useMutation({
    mutationFn: (extFileName: string) => deleteFile(extFileName),
  });
};

export const useDeployFile = () => {
  return useMutation({
    mutationFn: ({ resource, extFileName }: { resource: string; extFileName: string }) =>
      deployFile(resource, extFileName),
  });
};

export const useUndeployFile = () => {
  return useMutation({
    mutationFn: ({ resource, extFileName }: { resource: string; extFileName: string }) =>
      undeployFile(resource, extFileName),
  });
};

export const useResourceDefinitions = () => {
  return useQuery({
    queryKey: ['resourceDefinitions'],
    queryFn: () => getResourceDefinition({}),
  });
};
