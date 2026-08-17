export interface User {
  username: string;
  createdAt: string;
}

const USERS_STORAGE_KEY = 'codegym_registered_users';
const CURRENT_USER_KEY = 'codegym_current_user';

interface UserRecord {
  username: string;
  passwordHash: string;
  createdAt: string;
}

// Simple deterministic hash for browser storage
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + password.length;
}

export const authService = {
  // Get active signed-in user
  getCurrentUser: (): User | null => {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // Get active username prefix for scoping progress
  getCurrentUsername: (): string => {
    const u = authService.getCurrentUser();
    return u?.username ? u.username.toLowerCase().trim() : 'guest';
  },

  // Sign In with Username & Password
  login: async (username: string, password: string): Promise<User> => {
    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser || !password) {
      throw new Error('Please enter both username and password.');
    }

    const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
    const users: Record<string, UserRecord> = rawUsers ? JSON.parse(rawUsers) : {};

    const existing = users[cleanUser];
    if (!existing) {
      // Auto-register if first time with this username
      return authService.register(username, password);
    }

    if (existing.passwordHash !== hashPassword(password)) {
      throw new Error('Incorrect password. Please try again.');
    }

    const sessionUser: User = {
      username: cleanUser,
      createdAt: existing.createdAt,
    };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  // Create new account
  register: async (username: string, password: string): Promise<User> => {
    const cleanUser = username.trim().toLowerCase();
    if (cleanUser.length < 3) {
      throw new Error('Username must be at least 3 characters long.');
    }
    if (password.length < 4) {
      throw new Error('Password must be at least 4 characters long.');
    }

    const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
    const users: Record<string, UserRecord> = rawUsers ? JSON.parse(rawUsers) : {};

    if (users[cleanUser]) {
      // If user exists, try logging in
      if (users[cleanUser].passwordHash === hashPassword(password)) {
        const sessionUser: User = {
          username: cleanUser,
          createdAt: users[cleanUser].createdAt,
        };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
        return sessionUser;
      }
      throw new Error('Username already taken. Please sign in or pick another username.');
    }

    const newUserRecord: UserRecord = {
      username: cleanUser,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };

    users[cleanUser] = newUserRecord;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    const sessionUser: User = {
      username: cleanUser,
      createdAt: newUserRecord.createdAt,
    };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  // Sign out
  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },
};
