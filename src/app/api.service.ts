import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private backendUrl = 'http://localhost:3000'; // Replace with your backend URL

  constructor(private http: HttpClient) {}

  // Function to register a new user
  registerUser(userData: any) {
    return this.http.post(`${this.backendUrl}/api/signup`, userData);
  }
}
