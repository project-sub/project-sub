import type { User } from './user.types'

/**
 * Authentication Types
 */
export interface AuthResponse {
    token: string;
    user: User;
}