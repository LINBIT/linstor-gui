import { createModel } from '@rematch/core';
import { RootModel } from '.';
import { authAPI } from '@app/features/authentication';

interface UserAuth {
  username: string;
  password: string;
}

interface AuthState {
  isLoggedIn: boolean;
  username: string | null;
  users: string[];
}

export const auth = createModel<RootModel>()({
  state: {
    isLoggedIn: false,
    username: null,
    users: [],
  } as AuthState,
  reducers: {
    setLoggedIn(state, payload: boolean) {
      return { ...state, isLoggedIn: payload };
    },
    setUsername(state, payload: string | null) {
      return { ...state, username: payload };
    },
    setUsers(state, payload: string[]) {
      return { ...state, users: payload };
    },
  },
  effects: (dispatch) => ({
    async register(user: UserAuth) {
      const success = await authAPI.register(user);
      return success;
    },
    async login(user: UserAuth) {
      const success = await authAPI.login(user);
      if (success) {
        dispatch.auth.setLoggedIn(true);
        dispatch.auth.setUsername(user.username);
        localStorage.setItem('linstorname', user.username);
      }
      return success;
    },
    logout() {
      dispatch.auth.setLoggedIn(false);
      dispatch.auth.setUsername(null);
      localStorage.removeItem('linstorname');
    },
    async deleteUser(username: string, state) {
      await authAPI.deleteUser(username);
      const current = state.auth as AuthState; // Get the current state of the model
      if (current.username === username) {
        dispatch.auth.setLoggedIn(false);
        dispatch.auth.setUsername(null);
        localStorage.removeItem('linstorname');
      }
    },
    async changePassword({ user, newPassword }) {
      const success = await authAPI.changePassword(user.username, user.password, newPassword);
      return success;
    },

    async checkLoginStatus() {
      const username = localStorage.getItem('linstorname');
      if (username) {
        dispatch.auth.setLoggedIn(true);
        dispatch.auth.setUsername(username);
      }
    },

    async getUsers() {
      const users = await authAPI.getUsers();
      dispatch.auth.setUsers(users);
    },
  }),
});
