import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  user = {
    email: '',
    password: '',
  };

  loginError: string = '';

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) { }

  onSubmit(loginForm: NgForm) {
    if (loginForm.valid) {
      const url = 'http://localhost:3000/api/login';
      const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

      this.http.post<any>(url, this.user, { headers }).subscribe(
        (response: any) => {
          console.log('Login successful!', response);
          // Save the access token in local storage after successful login
          localStorage.setItem('accessToken', response.accessToken);
          // Call the login method of AuthService with the email and password
          this.authService.login(this.user.email, this.user.password).subscribe(
            () => {
              // After successful login, navigate to the "task" page using Router
              this.router.navigate(['/task']);
            },
            (error: any) => {
              // Handle error if any
              console.error('Error logging in:', error);
            }
          );
        },
        (error: any) => {
          if (error.status === 401) {
            this.loginError = 'Invalid credentials. Please check your email and password.';
          } else {
            this.loginError = 'Error logging in. Please try again later.';
          }
          console.error('Error logging in:', error);
        }
      );
    } else {
      loginForm.form.markAllAsTouched();
    }
  }
}
