import { useState, type FormEvent, type ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import type { LoginScreenProps, LoginCredentials, LoginFormErrors } from '../../types/user.types';
import type { AuthResponse } from '../../types/auth.types';
import { validateLoginCredentials, extractNameFromEmail } from '../../utils/validation';
import api from '../../api/axios'
import { setToken } from '../../utils/auth';

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [actionType, setActionType] = useState<'login' | 'signup'>('login');

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setCredentials((prev) => ({ ...prev, email: e.target.value }));
    // Clear email error when user starts typing
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setCredentials((prev) => ({ ...prev, password: e.target.value }));
    // Clear password error when user starts typing
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  const togglePasswordVisibility = (): void => {
    setShowPassword((prev) => !prev);
  };

  const handleSignup = async (): Promise<void> => {
    // Validate credentials
    const validationResult = validateLoginCredentials(credentials);

    if (!validationResult.isValid) {
      setErrors(validationResult.errors);
      return;
    }

    const res = await api.post('/register', 
      {email:credentials.email, password:credentials.password},
      {withCredentials:true}
    );

    if(res) {
      alert("회원가입을 환영합니다!!")
      
    } else {
      // 회원가입에 실패했을 경우 이미 존재하는 회원으로 간주한다고 하자 그냥.
      alert("이미 존재하는 회원입니다. 다른 이메일 주소로 가입바랍니다.")
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    // Validate credentials
    const validationResult = validateLoginCredentials(credentials);

    if (!validationResult.isValid) {
      setErrors(validationResult.errors);
      return;
    }

    // Clear errors and start loading
    setErrors({});
    setIsLoading(true);

    try {
      const res = await api.post<AuthResponse>('/login', 
        {email:credentials.email, password:credentials.password},
        {withCredentials:true}
      );
      if(res) {
        const userName = extractNameFromEmail(credentials.email);
        setToken(res.data.token)
        onLogin({email:credentials.email, name:userName})
      }
    } catch (e) {
      setErrors({
        general: '로그인에 실패했습니다.'
      });
    } finally {
      setIsLoading(false);
    }
    // Simulate login process (1 second delay)
/*
    setTimeout(() => {
      const userName = extractNameFromEmail(credentials.email);
      onLogin(credentials.email, userName);
      setIsLoading(false);
    }, 1000);
*/    
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI 문서 요약 도우미
          </h1>
          <p className="text-gray-600">로그인하여 시작하세요</p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={credentials.email}
                  onChange={handleEmailChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                    errors.email
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="your@email.com"
                  disabled={isLoading}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  id="email-error"
                  className="mt-2 text-sm text-red-600 flex items-center gap-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </motion.p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={handlePasswordChange}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                    errors.password
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                  disabled={isLoading}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoading}
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  id="password-error"
                  className="mt-2 text-sm text-red-600 flex items-center gap-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </motion.p>
              )}
            </div>

            {/* General Error */}
            {errors.general && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-sm text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {errors.general}
                </p>
              </motion.div>
            )}

            {/* Button Group */}
            <div className="flex gap-3">
              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                onClick={() => setActionType('login')}
                className={`
                  flex-1 py-3 px-4 rounded-lg font-medium text-white
                  bg-gradient-to-r from-purple-600 to-pink-600
                  hover:from-purple-700 hover:to-pink-700
                  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                  transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    로그인 중...
                  </span>
                ) : (
                  '로그인'
                )}
              </button>

              {/* Signup Button */}
              <button
                type="button"
                disabled={isLoading}
                onClick={handleSignup}
                className={`
                  flex-1 py-3 px-4 rounded-lg font-medium
                  border border-purple-300 text-purple-700
                  bg-white hover:bg-purple-50
                  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                  transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                회원가입
              </button>
            </div>
          </form>
        </motion.div>

        {/* Demo Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 이메일과 비밀번호(<strong>6자 이상</strong>)로 로그인 가능합니다
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
