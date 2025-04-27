import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://pedago.univ-avignon.fr:3223';

  constructor(private http: HttpClient) { }

  // Récupérer les utilisateurs connectés
  getConnectedUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/connected-users`);
  }

  // Récupérer les infos d'un utilisateur
  getUserInfo(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/user/${userId}`);
  }
}