import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000/api'; 
  private authStatusChanged = new Subject<boolean>();

  constructor(private http: HttpClient) { }

  // Function to perform user login
  login(email: string, password: string): Observable<void> {
    const url = `${this.apiUrl}/login`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const user = { email, password };

    return this.http.post<any>(url, user, { headers }).pipe(
      map((response) => {
        // Save the access token in local storage after successful login
        localStorage.setItem('accessToken', response.accessToken);
        // Emit the authentication status change
        this.authStatusChanged.next(true);
      })
    );
  }

  // Function to perform user logout
  logout(): void {
    // Clear user-related data from local storage
    localStorage.removeItem('accessToken');
    // Emit the authentication status change
    this.authStatusChanged.next(false);
  }

  // Function to check if the user is logged in
  isLoggedIn(): boolean {
    // Check if the access token is present in local storage
    return !!localStorage.getItem('accessToken');
  }

  // Function to get the username of the logged-in user
  getUsername(): string {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      const decodedToken = this.decodeAccessToken(accessToken);
      return decodedToken.username;
    }
    return '';
  }

  // Function to decode the access token (optional)
  private decodeAccessToken(accessToken: string): any {
    try {
      const base64Url = accessToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decodedToken = JSON.parse(window.atob(base64));
      return decodedToken;
    } catch (error) {
      console.error('Error decoding access token:', error);
      return null;
    }
  }

  // Observable to subscribe to changes in authentication status
  getAuthStatusChanged(): Observable<boolean> {
    return this.authStatusChanged.asObservable();
  }
}
