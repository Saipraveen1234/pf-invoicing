import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private router: Router) {
    // Check local storage for persistence
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      this.isLoggedInSubject.next(true);
    }
  }

  login(password: string): Observable<boolean> {
    // Mock authentication - simplified for partner access
    if (password === 'admin123') { // Simple mock password
      localStorage.setItem('user', 'partner');
      this.isLoggedInSubject.next(true);
      return of(true);
    }
    return of(false);
  }

  logout(): void {
    localStorage.removeItem('user');
    this.isLoggedInSubject.next(false);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.isLoggedInSubject.value;
  }
}

