const TOKEN_KEY = 'access_token'

export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = (): void => {
  return localStorage.removeItem(TOKEN_KEY);
}