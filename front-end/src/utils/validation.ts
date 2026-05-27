import type { LoginCredentials, LoginFormErrors } from '../types/user.types'
import type { ValidationResult } from '../types';

/**
 * Email validation using regex
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Password validation (minimum 6 characters for demo)
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Validate login credentials
 */
export const validateLoginCredentials = (
  credentials: LoginCredentials
): ValidationResult => {
  const errors: LoginFormErrors = {};

  // Validate email
  if (!credentials.email) {
    errors.email = '이메일을 입력해주세요.';
  } else if (!isValidEmail(credentials.email)) {
    errors.email = '올바른 이메일 형식이 아닙니다.';
  }

  // Validate password
  if (!credentials.password) {
    errors.password = '비밀번호를 입력해주세요.';
  } else if (!isValidPassword(credentials.password)) {
    errors.password = '비밀번호는 최소 6자 이상이어야 합니다.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Extract name from email
 */
export const extractNameFromEmail = (email: string): string => {
  return email.split('@')[0];
};

/**
 * Get user initials from name
 */
export const getUserInitials = (name?: string): string => {
  if (!name) return '';

  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
