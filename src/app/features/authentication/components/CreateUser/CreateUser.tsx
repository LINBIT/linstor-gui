import React, { useState } from 'react';
import { Button, Form, Input, Modal, Radio } from 'antd';

import changePassword from '@app/assets/changepassword.svg';
import changePasswordBG from '@app/assets/changepassword-bg.svg';
import { BGImg, Content, ImgIcon, MainSection } from './styled';
import { Dispatch } from '@app/store';
import { useDispatch } from 'react-redux';

interface Values {
  title: string;
  description: string;
  modifier: string;
}

interface CreateUserFormProps {
  open: boolean;
  onCreate: (values: Values) => void;
  onCancel: () => void;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ open, onCreate, onCancel }) => {
  const [form] = Form.useForm();
  return (
    <Modal open={open} wrapClassName="change-password-modal" footer={null} width="70%" onCancel={onCancel}>
      <Content>
        <BGImg src={changePasswordBG} alt="changePassword" />

        <MainSection>
          {/* <Form
            form={form}
            layout="vertical"
            name="form_in_modal"
            initialValues={{ modifier: 'public' }}
            style={{ width: 500 }}
          >
            <h3> Add New User </h3>
            <Form.Item name="username" label="Username" rules={[{ required: true, message: 'Please input username!' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please input password!' }]}>
              <Input.Password />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              rules={[{ required: true, message: 'Please input new password again!' }]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item>
              <Button type="primary">Add user</Button>
            </Form.Item>
          </Form> */}

          <Form
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            initialValues={{ login: true }}
            form={form}
            layout="vertical"
            name="form_in_modal"
            style={{ width: 500 }}
            onFinish={onCreate}
            autoComplete="off"
          >
            <h3> Add New User </h3>
            <Form.Item
              label="Username"
              name="username"
              rules={[{ required: true, message: 'Please input your username!' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              label="Confirm Password"
              name="password_validate"
              rules={[
                { required: true, message: 'Please input your password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The new password that you entered do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                Add
              </Button>
            </Form.Item>
          </Form>
        </MainSection>
      </Content>
    </Modal>
  );
};

type CreateUserProp = {
  disabled?: boolean;
};

const CreateUser = ({ disabled }: CreateUserProp) => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch<Dispatch>();

  const onCreate = (values: any) => {
    dispatch.auth.register(values);

    setOpen(false);
  };

  return (
    <div>
      <div
        onClick={(e) => {
          setOpen(true);
        }}
      >
        <Button type="primary" disabled={disabled}>
          Add a user
        </Button>
      </div>
      <CreateUserForm
        open={open}
        onCreate={onCreate}
        onCancel={() => {
          setOpen(false);
        }}
      />
    </div>
  );
};

export { CreateUser };
