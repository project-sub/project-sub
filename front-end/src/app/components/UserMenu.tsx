import { useState, useRef, useEffect, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, ChevronDown } from 'lucide-react';
import type { UserMenuProps } from '../../types';
import { getUserInitials } from '../../utils/validation';

export function UserMenu({ userName, userEmail, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleMenu = (): void => {
    setIsOpen((prev) => !prev);
  };

  const handleLogout = (): void => {
    setIsOpen(false);
    onLogout();
  };

  const initials = getUserInitials(userName);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
          {initials}
        </div>
        <span className="hidden md:block text-sm font-medium text-gray-700">
          {userName}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
          >
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{userName}</p>
                  <p className="text-sm text-gray-500 truncate">{userEmail}</p>
                </div>
              </div>
            </div>

            {/* Logout */}
            <div className="border-t border-gray-200 py-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>로그아웃</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
