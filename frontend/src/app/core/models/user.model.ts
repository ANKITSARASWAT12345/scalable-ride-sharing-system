

export type Role = 'RIDER' | 'DRIVER' | 'ADMIN';

export interface User {
  userId: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: string;
  name: string;
  email: string;
  role: Role;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// shape of validation error responses from Spring Boot
export interface ApiError {
  status: number;
  error: string;
  errors?: { [field: string]: string };  // field-level validation errors
  timestamp: string;
}