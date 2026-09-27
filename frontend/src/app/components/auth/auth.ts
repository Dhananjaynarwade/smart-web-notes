import {
  ChangeDetectorRef,
  Component
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth.service';

import { Router } from '@angular/router';
@Component({
  selector: 'app-auth',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './auth.html',
  styleUrl: './auth.scss'
})
export class Auth {

  isRegisterMode = false;

  showOtp = false;

  otpCode = '';
  otpEmail = '';

  message = '';
  errorMessage = '';

  isLoading = false;


  loginData = {
    username: '',
    password: ''
  };


  registerData = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };


constructor(
  private authService: AuthService,
  private cdr: ChangeDetectorRef,
  private router: Router
) {}

  // =====================================
  // OPEN REGISTER
  // =====================================

  openRegister(): void {

    this.isRegisterMode = true;

    this.message = '';
    this.errorMessage = '';
  }


  // =====================================
  // CLOSE REGISTER
  // =====================================

  closeRegister(): void {

    this.isRegisterMode = false;

    this.showOtp = false;

    this.otpCode = '';

    this.message = '';
    this.errorMessage = '';
  }


  // =====================================
  // REGISTER
  // =====================================

  async register(): Promise<void> {

    this.message = '';
    this.errorMessage = '';


    if (
      !this.registerData.username ||
      !this.registerData.email ||
      !this.registerData.password ||
      !this.registerData.confirmPassword
    ) {

      this.errorMessage =
        'Please fill all fields.';

      return;
    }


    if (
      this.registerData.password !==
      this.registerData.confirmPassword
    ) {

      this.errorMessage =
        'Passwords do not match.';

      return;
    }


    try {

      this.isLoading = true;

      this.cdr.detectChanges();


      const response =
        await this.authService.register({

          username:
            this.registerData.username,

          email:
            this.registerData.email,

          password:
            this.registerData.password,

          confirm_password:
            this.registerData.confirmPassword
        });


      this.otpEmail =
        response.email;

      this.showOtp = true;

      this.message =
        'OTP sent successfully.';

      this.cdr.detectChanges();

    }

    catch (error: any) {

      console.error(
        'Registration error:',
        error
      );


      if (error?.error?.email) {

        this.errorMessage =
          error.error.email[0];

      }

      else if (error?.error?.username) {

        this.errorMessage =
          error.error.username[0];

      }

      else if (error?.error?.password) {

        this.errorMessage =
          error.error.password[0];

      }

      else {

        this.errorMessage =
          error?.error?.message ||
          'Registration failed.';
      }


      this.cdr.detectChanges();

    }

    finally {

      this.isLoading = false;

      this.cdr.detectChanges();
    }
  }


  // =====================================
  // VERIFY OTP
  // =====================================

  async verifyOtp(): Promise<void> {

    this.message = '';
    this.errorMessage = '';


    if (!this.otpCode) {

      this.errorMessage =
        'Please enter OTP.';

      return;
    }


    try {

      this.isLoading = true;

      this.cdr.detectChanges();


      const response =
        await this.authService.verifyOtp(
          this.otpEmail,
          this.otpCode
        );


      this.message =
        response.message;


      this.showOtp = false;

      this.isRegisterMode = false;

      this.otpCode = '';


      this.cdr.detectChanges();

    }

    catch (error: any) {

      console.error(
        'OTP verification error:',
        error
      );


      this.errorMessage =
        error?.error?.message ||
        'OTP verification failed.';


      this.cdr.detectChanges();

    }

    finally {

      this.isLoading = false;

      this.cdr.detectChanges();
    }
  }


  // =====================================
  // LOGIN
  // =====================================
async login(): Promise<void> {

  this.message = '';
  this.errorMessage = '';

  if (
    !this.loginData.username ||
    !this.loginData.password
  ) {
    this.errorMessage =
      'Please enter username/email and password.';

    return;
  }

  try {

    this.isLoading = true;

    this.cdr.detectChanges();

    await this.authService.login(
      this.loginData.username,
      this.loginData.password
    );

    await this.router.navigate([
      '/dashboard'
    ]);

  }

  catch (error: any) {

    this.errorMessage =
      error?.error?.message ||
      'Login failed.';

  }

  finally {

    this.isLoading = false;

    this.cdr.detectChanges();
  }
}
}