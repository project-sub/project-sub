/**
 * User Authentication Types
 */
export interface User {
  email: string;
  name: string;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export interface LoginScreenProps {
  onLogin: (user: User) => void;
}