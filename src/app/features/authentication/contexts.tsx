import React, { createContext, useState, useEffect, useContext } from 'react';
import { UserAuthAPI } from './api';
import { USER_LOCAL_STORAGE_KEY } from '@app/const/settings';

interface UserAuth {
  username: string;
  password: string;
}

interface AuthState {
  isLoggedIn: boolean;
  username: string | null;
}

interface AuthContextProps extends AuthState {
  register: (user: UserAuth) => Promise<boolean>;
  login: (user: UserAuth) => Promise<boolean>;
  logout: () => void;
  deleteUser: (username: string) => Promise<void>;
  changePassword: (user: UserAuth, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextProps>({
  isLoggedIn: false,
  username: null,
  register: () => Promise.resolve(false),
  login: () => Promise.resolve(false),
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  logout: () => {},
  deleteUser: () => Promise.resolve(),
  changePassword: () => Promise.resolve(false),
});

AuthContext.displayName = 'AuthContext';

export const useAuth = () => useContext(AuthContext);

const authAPI = new UserAuthAPI();

const UserAuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    username: null,
  });

  useEffect(() => {
    const checkLoggedIn = async () => {
      const username = localStorage.getItem(USER_LOCAL_STORAGE_KEY);
      if (username) {
        setAuthState({ isLoggedIn: true, username });
      } else {
        setAuthState({ isLoggedIn: false, username: null });
      }
    };

    checkLoggedIn();
  }, []);

  const register = async (user: UserAuth): Promise<boolean> => {
    const success = await authAPI.register(user);
    setAuthState({ isLoggedIn: true, username: user.username });
    return success;
  };

  const login = async (user: UserAuth): Promise<boolean> => {
    const success = await authAPI.login(user);
    if (success) {
      setAuthState({ isLoggedIn: true, username: user.username });
      localStorage.setItem(USER_LOCAL_STORAGE_KEY, user.username);
    }
    return success;
  };

  const logout = (): void => {
    setAuthState({ isLoggedIn: false, username: null });
    localStorage.removeItem(USER_LOCAL_STORAGE_KEY);
  };

  const deleteUser = async (username: string): Promise<void> => {
    await authAPI.deleteUser(username);
    if (authState.username === username) {
      setAuthState({ isLoggedIn: false, username: null });
      localStorage.removeItem(USER_LOCAL_STORAGE_KEY);
    }
  };

  const changePassword = async (user: UserAuth, newPassword: string): Promise<boolean> => {
    const success = await authAPI.changePassword(user.username, user.password, newPassword);
    return success;
  };

  return (
    <AuthContext.Provider value={{ ...authState, register, login, logout, deleteUser, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export { UserAuthProvider };
