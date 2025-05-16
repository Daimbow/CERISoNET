import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Hashtag {
    id?: string;
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
}

@Injectable({
    providedIn: 'root'
})
export class HashtagService {
    private apiUrl = '/api/hashtags';

    constructor(private http: HttpClient) { }

    // get pour récupérer un hashtag par ID
    getHashtag(id: string): Observable<Hashtag> {
        return this.http.get<Hashtag>(`${this.apiUrl}/${id}`);
    }

    // get pour récupérer tous les hashtags
    getAllHashtags(): Observable<Hashtag[]> {
        return this.http.get<Hashtag[]>(this.apiUrl);
    }

    // get pour récupérer les hashtags populaires
    getPopularHashtags(limit: number = 10): Observable<Hashtag[]> {
        return this.http.get<Hashtag[]>(`${this.apiUrl}/popular?limit=${limit}`);
    }

    // post pour créer un hashtag
    createHashtag(hashtag: Hashtag): Observable<Hashtag> {
        return this.http.post<Hashtag>(this.apiUrl, hashtag);
    }

    // put pour mettre à jour un hashtag
    updateHashtag(id: string, hashtag: Hashtag): Observable<Hashtag> {
        return this.http.put<Hashtag>(`${this.apiUrl}/${id}`, hashtag);
    }

    // delete pour supprimer un hashtag
    deleteHashtag(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    // utilise l'algorithme pour trouver la position d'un mot
    findWordPosition(id: string, word: string): Observable<WordPosition> {
        return this.http.get<WordPosition>(`${this.apiUrl}/${id}/position/${word}`);
    }

    // synchronise les hashtags depuis les messages
    synchronizeHashtags(): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/sync`, {});
    }

    // récuprere les messages par hashtag
    getMessagesByHashtag(hashtag: string): Observable<Message[]> {
        return this.http.get<Message[]>(`${this.apiUrl}/messages/${encodeURIComponent(hashtag.replace('#', ''))}`);
    }
}