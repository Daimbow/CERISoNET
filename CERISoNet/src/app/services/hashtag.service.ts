import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Hashtag {
  id?: number;
  name: string;
  usageCount: number;
  lastUsed?: string;
}

interface WordPosition {
  position: number;
}

@Injectable({
  providedIn: 'root'
})
export class HashtagService {
  // Assurez-vous de mettre à jour le port pour correspondre à celui de votre service Quarkus
  private apiUrl = 'https://pedago.univ-avignon.fr:8080/api/hashtags';

  constructor(private http: HttpClient) { }

  // GET - Récupérer un hashtag par ID
  getHashtag(id: number): Observable<Hashtag> {
    return this.http.get<Hashtag>(`${this.apiUrl}/${id}`);
  }

  // GET - Récupérer tous les hashtags
  getAllHashtags(): Observable<Hashtag[]> {
    return this.http.get<Hashtag[]>(this.apiUrl);
  }

  // POST - Créer un hashtag
  createHashtag(hashtag: Hashtag): Observable<Hashtag> {
    return this.http.post<Hashtag>(this.apiUrl, hashtag);
  }

  // PUT - Mettre à jour un hashtag
  updateHashtag(id: number, hashtag: Hashtag): Observable<Hashtag> {
    return this.http.put<Hashtag>(`${this.apiUrl}/${id}`, hashtag);
  }

  // DELETE - Supprimer un hashtag
  deleteHashtag(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Utiliser l'algorithme pour trouver la position d'un mot
  findWordPosition(id: number, word: string): Observable<WordPosition> {
    return this.http.get<WordPosition>(`${this.apiUrl}/${id}/position/${word}`);
  }
}
