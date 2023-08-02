import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service'; 
@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent {
  user = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) { }

  onSubmit(form: NgForm) {
    if (form.valid) {
      if (this.user.password !== this.user.confirmPassword) {
        form.controls['confirmPassword'].setErrors({ passwordMismatch: true });
        return;
      }

      // Validate email format
      if (!this.isEmailValid(this.user.email)) {
        form.controls['email'].setErrors({ invalidFormat: true });
        return;
      }

      // Validate password format
      if (!this.isPasswordValid(this.user.password)) {
        form.controls['password'].setErrors({ invalidFormat: true });
        return;
      }

      const url = 'http://localhost:3000/api/signup';
      const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

      this.http.post<any>(url, this.user, { headers }).subscribe(
        (response: any) => {
          console.log('User registered successfully!', response);
          // Save the access token in local storage
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
          console.error('Error registering user:', error);

          // Check if the error is due to a duplicate email
          if (error?.error?.error) {
            form.controls['email'].setErrors({ emailExists: true });
          } else {
            // Handle other errors
          }
        }
      );
    } else {
      form.form.markAllAsTouched(); // Mark all form controls as touched to display validation errors
    }
  }

  isEmailValid(email: string): boolean {
    // Regular expression to validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  isPasswordValid(password: string): boolean {
    // Regular expression to validate password format
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }
}
