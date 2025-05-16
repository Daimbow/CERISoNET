import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = 'https://pedago.univ-avignon.fr:3223';

  constructor(private http: HttpClient) { }

  // On recupere les messages avec pagination et filtres
  getMessages(page: number = 1, limit: number = 5, options: any = {}): Observable<any> {
    
    // on construit les parametres
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    // on ajoute les filtres
    if (options.sortBy) {
      params = params.set('sortBy', options.sortBy);
    }
    
    if (options.filterOwner !== undefined) {
      params = params.set('filterOwner', options.filterOwner.toString());
    }
    
    if (options.filterHashtag) {
      params = params.set('filterHashtag', options.filterHashtag);
    }
    
    // on fait la requete
    return this.http.get<any>(`${this.apiUrl}/messages`, { params });
  }

  // pour liker un message
  likeMessage(messageId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/messages/${messageId}/like`, {});
  }

  // pour commenter un message
  commentMessage(messageId: number, text: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/messages/${messageId}/comment`, { text });
  }

  // pour partager un message
  shareMessage(messageId: number, body: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/messages/${messageId}/share`, { body });
  }
}