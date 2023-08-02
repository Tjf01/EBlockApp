import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'task-scheduler';
  isLoggedIn = false; 
  username = '';
  user = { email: '', password: '' };
  private authSubscription: Subscription | undefined; 

  constructor(private router: Router, private authService: AuthService) { }

  ngOnInit() {
    // Check if the user is already logged in (e.g., from a previous session)
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      this.username = this.authService.getUsername();
    }

    // Subscribe to changes in authentication status
    this.authSubscription = this.authService.getAuthStatusChanged().subscribe(
      (loggedInStatus) => {
        this.isLoggedIn = loggedInStatus;
        this.username = this.authService.getUsername();
      }
    );
  }

  
  login() {
    // Call the login method of AuthService to perform the actual login
    this.authService.login(this.user.email, this.user.password).subscribe(
      () => {
        // Login successful
        this.router.navigate(['/task']);
      },
      (error) => {
        // Handle login error here (e.g., show error message)
        console.error('Login error:', error);
      }
    );
  }

  // Function to log out the user
  logout() {
    // Call the logout method of AuthService to perform the actual logout
    this.authService.logout();
    this.router.navigate(['/login']); 
  }

  ngOnDestroy() {
    // Unsubscribe from the authSubscription to prevent memory leaks
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
