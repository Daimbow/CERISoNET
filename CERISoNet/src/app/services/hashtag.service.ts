import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Hashtag {
  id?: string;  // Changé de number à string pour compatibilité avec MongoDB ObjectId
  name: string;
  usageCount: number;
  lastUsed?: string;
}

interface WordPosition {
  position: number;
}

interface Message {
  _id: number;
  body: string;
  date: string;
  hour: string;
  createdBy: number;
  likes: number;
  hashtags: string[];
  comments: any[];
  // Autres propriétés du message
}

@Injectable({
  providedIn: 'root'
})
export class HashtagService {
  private apiUrl = '/api/hashtags'; // À ajuster selon votre configuration

  constructor(private http: HttpClient) { }

  // GET - Récupérer un hashtag par ID
  getHashtag(id: string): Observable<Hashtag> {
    return this.http.get<Hashtag>(`${this.apiUrl}/${id}`);
  }

  // GET - Récupérer tous les hashtags
  getAllHashtags(): Observable<Hashtag[]> {
    return this.http.get<Hashtag[]>(this.apiUrl);
  }

  // GET - Récupérer les hashtags populaires
  getPopularHashtags(limit: number = 10): Observable<Hashtag[]> {
    return this.http.get<Hashtag[]>(`${this.apiUrl}/popular?limit=${limit}`);
  }

  // POST - Créer un hashtag
  createHashtag(hashtag: Hashtag): Observable<Hashtag> {
    return this.http.post<Hashtag>(this.apiUrl, hashtag);
  }

  // PUT - Mettre à jour un hashtag
  updateHashtag(id: string, hashtag: Hashtag): Observable<Hashtag> {
    return this.http.put<Hashtag>(`${this.apiUrl}/${id}`, hashtag);
  }

  // DELETE - Supprimer un hashtag
  deleteHashtag(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Utiliser l'algorithme pour trouver la position d'un mot
  findWordPosition(id: string, word: string): Observable<WordPosition> {
    return this.http.get<WordPosition>(`${this.apiUrl}/${id}/position/${word}`);
  }

  // Synchroniser les hashtags depuis les messages
  synchronizeHashtags(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/sync`, {});
  }

  // Récupérer les messages par hashtag
  getMessagesByHashtag(hashtag: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/messages/${encodeURIComponent(hashtag.replace('#', ''))}`);
  }
}