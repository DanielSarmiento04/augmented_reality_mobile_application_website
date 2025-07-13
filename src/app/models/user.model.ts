import { Routine } from "./routines.model";


export type UserRole = 'admin' | 'user' | 'guest';


export interface User {
  id: string;
  username: string;
  email: string;
  password?: string; // Optional for security reasons
  createdAt: Date;
  updatedAt: Date;
  role: UserRole;
  routines?: Routine[]; // Optional, can be populated later
}
