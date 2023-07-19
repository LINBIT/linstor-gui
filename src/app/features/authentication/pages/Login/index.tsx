import React from 'react';
import { AuthForm } from '../../components/AuthForm';
import bgImg from '@app/assets/login_bg.png';
import logo from '@app/assets/login_logo.svg';
import { LoginContainer, LoginImg, LoginLeft, LoginRight, LoginTitle, Logo } from './styled';

export const Login = () => {
  return (
    <LoginContainer>
      <LoginLeft>
        <LoginImg src={bgImg} alt="" />
      </LoginLeft>
      <LoginRight>
        <Logo src={logo} alt="" />
        <LoginTitle>Login</LoginTitle>
        <AuthForm />
      </LoginRight>
    </LoginContainer>
  );
};
