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
  needsPasswordChange?: boolean;
  isAdmin?: boolean;
}

export const auth = createModel<RootModel>()({
  state: {
    isLoggedIn: false,
    username: null,
    users: [],
    needsPasswordChange: false,
    isAdmin: false,
  } as AuthState,
  reducers: {
    setLoggedIn(state, payload: boolean) {
      return { ...state, isLoggedIn: payload };
    },
    setUsername(state, payload: string | null) {
      return { ...state, username: payload };
    },
    setUsers(state, payload: string[]) {
      return { ...state, users: payload.filter((user) => user !== 'admin' && user !== '__updated__') };
    },
    setNeedsPasswordChange(state, payload: boolean) {
      return { ...state, needsPasswordChange: payload };
    },
    setIsAdmin(state, payload: boolean) {
      return { ...state, isAdmin: payload };
    },
  },
  effects: (dispatch) => ({
    async register(user: UserAuth) {
      const success = await authAPI.register(user);
      if (success) {
        dispatch.auth.getUsers();
      }
      return success;
    },
    async login(user: UserAuth) {
      const success = await authAPI.login(user);
      if (success) {
        dispatch.auth.setLoggedIn(true);
        dispatch.auth.setUsername(user.username);
        if (user.username === 'admin') {
          dispatch.auth.setIsAdmin(true);

          if (user.password === 'admin') {
            // TODO: Remove this once we have a proper password change
            dispatch.auth.setNeedsPasswordChange(true);
          }
        }
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
      dispatch.auth.getUsers();
    },

    async resetPassword({ user, newPassword }) {
      const success = await authAPI.resetPassword(user, newPassword);
      return success;
    },
    async changePassword({ user, oldPassword, newPassword }) {
      const success = await authAPI.changePassword(user, oldPassword, newPassword);
      if (success) {
        dispatch.auth.setNeedsPasswordChange(false);
      }
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
