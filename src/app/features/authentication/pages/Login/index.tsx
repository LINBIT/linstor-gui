// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Alert } from 'antd';
import { AuthForm } from '@app/features/authentication';
import logo from '@app/assets/login-logo.svg';
import loginBg from '@app/assets/login-bg.svg';
import { useKVStore } from '@app/hooks';
import { useDispatch } from 'react-redux';
import { Dispatch } from '@app/store';

interface LoginProps {
  redirectTo?: string;
}

export const Login = ({ redirectTo }: LoginProps) => {
  const store = useKVStore();

  const dispatch = useDispatch<Dispatch>();

  const hideTip = () => {
    dispatch.setting.saveKey({
      hideDefaultCredential: true,
    });
  };

  const hideDefaultCredential = store?.hideDefaultCredential;

  return (
    <main className="flex h-screen w-full flex-col md:flex-row">
      {/* Desktop left panel - hidden on mobile */}
      <div className="hidden md:block md:w-[487px] relative overflow-hidden bg-[#eee]">
        <img src={loginBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
      </div>

      {/* Login form container */}
      <div className="flex-1 flex bg-white justify-center items-center p-4 md:pl-[118px] md:pt-[220px] md:justify-start md:items-start">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center md:justify-start mb-8 md:mb-5">
            <img src={logo} alt="logo" className="h-10 md:h-12 w-auto" />
          </div>

          {/* Form content */}
          <div className="px-4 md:pl-[37px]">
            <h3 className="text-lg font-normal text-gray-800 text-center md:text-left mb-6 md:mb-0">
              Log into to Your Account
            </h3>

            {/* Alert for default credentials */}
            {!hideDefaultCredential && (
              <>
                <br />
                <Alert
                  message="Default credential: admin/admin"
                  type="info"
                  closable
                  className="w-[368px] mt-6 md:mt-[44px] mb-8"
                  onClose={hideTip}
                />
              </>
            )}

            <br />

            {!hideDefaultCredential ? null : <div className="mt-6 md:mt-[44px]"></div>}

            <AuthForm redirectTo={redirectTo} />
          </div>
        </div>
      </div>
    </main>
  );
};
