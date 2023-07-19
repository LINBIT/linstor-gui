import React from 'react';
import { Button, Form, Input } from 'antd';
import { useDispatch } from 'react-redux';
import { Dispatch } from '@app/store';
import { useHistory } from 'react-router-dom';
import { notify } from '@app/utils/toast';

type FormType = {
  username: string;
  password: string;
  password_validate: string;
};

const AuthForm: React.FC = () => {
  const history = useHistory();
  const dispatch = useDispatch<Dispatch>();

  const onFinish = async (values: FormType) => {
    const res = await dispatch.auth.login({ username: values.username, password: values.password });
    console.log(res, 'res');
    if (res) {
      history.push('/');
    } else {
      notify('Login failed', {
        type: 'error',
      });
    }
  };

  return (
    <Form
      name="basic"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 600 }}
      initialValues={{ login: true }}
      onFinish={onFinish}
      autoComplete="off"
      layout="vertical"
    >
      <Form.Item label="Username" name="username" rules={[{ required: true, message: 'Please input your username!' }]}>
        <Input />
      </Form.Item>

      <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Please input your password!' }]}>
        <Input.Password />
      </Form.Item>

      <Form.Item wrapperCol={{ span: 16 }}>
        <Button type="primary" htmlType="submit">
          Login
        </Button>
      </Form.Item>
    </Form>
  );
};

export { AuthForm };
