

export type UserRole = 'admin' | 'user' | 'guest';


export interface User {
  id: string;
  username: string;
  email: string;
  password?: string; // Optional for security reasons
  createdAt: Date;
  updatedAt: Date;
  role: UserRole;
}
