import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';


export interface AuthUser {
  id: number;
  username: string;
  email: string;
}


export interface LoginResponse {
  message: string;
  access: string;
  refresh: string;

  user: AuthUser;
}


export interface RegisterResponse {
  message: string;
  email: string;
}


export interface VerifyOtpResponse {
  message: string;
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl =
    'http://127.0.0.1:8000/api/auth/';


  currentUser = signal<AuthUser | null>(
    this.loadUser()
  );


  constructor(
    private http: HttpClient
  ) {}


  // =====================================
  // REGISTER
  // =====================================

  register(data: {
    username: string;
    email: string;
    password: string;
    confirm_password: string;
  }): Promise<RegisterResponse> {

    return firstValueFrom(
      this.http.post<RegisterResponse>(
        `${this.apiUrl}register/`,
        data
      )
    );
  }


  // =====================================
  // VERIFY OTP
  // =====================================

  verifyOtp(
    email: string,
    otp: string
  ): Promise<VerifyOtpResponse> {

    return firstValueFrom(
      this.http.post<VerifyOtpResponse>(
        `${this.apiUrl}verify-otp/`,
        {
          email,
          otp
        }
      )
    );
  }


  // =====================================
  // LOGIN
  // =====================================

  async login(
    username: string,
    password: string
  ): Promise<LoginResponse> {

    const response = await firstValueFrom(
      this.http.post<LoginResponse>(
        `${this.apiUrl}login/`,
        {
          username,
          password
        }
      )
    );

    sessionStorage.setItem(
      'access_token',
      response.access
    );

    sessionStorage.setItem(
      'refresh_token',
      response.refresh
    );

    sessionStorage.setItem(
      'auth_user',
      JSON.stringify(response.user)
    );

    this.currentUser.set(
      response.user
    );

    return response;
  }


  // =====================================
  // LOGOUT
  // =====================================

  logout(): void {

    sessionStorage.removeItem(
      'access_token'
    );

    sessionStorage.removeItem(
      'refresh_token'
    );

    sessionStorage.removeItem(
      'auth_user'
    );

    this.currentUser.set(null);
  }


  // =====================================
  // ACCESS TOKEN
  // =====================================

  getAccessToken(): string | null {

    return sessionStorage.getItem(
      'access_token'
    );
  }


  // =====================================
  // LOAD USER
  // =====================================

  private loadUser(): AuthUser | null {

    const user =
      sessionStorage.getItem(
        'auth_user'
      );

    if (!user) {
      return null;
    }

    try {
      return JSON.parse(user);
    } catch {
      return null;
    }
  }
}