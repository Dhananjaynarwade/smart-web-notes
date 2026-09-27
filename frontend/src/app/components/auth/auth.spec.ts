import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  openRegister(): void {
    this.isRegisterMode = true;
  }

  closeRegister(): void {
    this.isRegisterMode = false;
  }

  login(): void {
    console.log('Login data:', this.loginData);
  }

  register(): void {
    console.log('Register data:', this.registerData);
  }
}