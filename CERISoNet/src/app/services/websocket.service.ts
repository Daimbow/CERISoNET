import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

export interface WebSocketMessage {
  type: 'connection' | 'like' | 'comment' | 'share' | 'logout';
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket$: WebSocketSubject<any> | null = null;
  private messagesSubject = new Subject<WebSocketMessage>();
  public messages$ = this.messagesSubject.asObservable();

  constructor() {}

  /**
   * Établit une connexion WebSocket avec le serveur
   * @param userId Identifiant de l'utilisateur
   */
  public connect(userId: string): void {
    if (!this.socket$ || this.socket$.closed) {
      // Remplacer l'URL par celle de votre serveur WebSocket
      this.socket$ = webSocket(`wss://pedago.univ-avignon.fr:3223/ws?userId=${userId}`);
      
      this.socket$.subscribe(
        (message) => this.handleMessage(message),
        (error) => console.error('WebSocket error:', error),
        () => console.log('WebSocket connection closed')
      );
    }
  }

  /**
   * Ferme la connexion WebSocket
   */
  public disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }
  }

  /**
   * Envoie un message au serveur
   * @param message Le message à envoyer
   */
  public send(message: WebSocketMessage): void {
    if (this.socket$ && !this.socket$.closed) {
      this.socket$.next(message);
    } else {
      console.error('WebSocket not connected. Cannot send message.');
    }
  }

  /**
   * Traite les messages reçus et les propage
   * @param message Le message reçu
   */
  private handleMessage(message: WebSocketMessage): void {
    console.log('Received message:', message);
    this.messagesSubject.next(message);
  }

  /**
   * Notifie les autres utilisateurs d'une connexion
   */
  public notifyConnection(): void {
    const username = localStorage.getItem('username') || 'Utilisateur';
    this.send({
      type: 'connection',
      data: {
        username,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notifie les autres utilisateurs d'un like
   * @param messageId ID du message
   */
  public notifyLike(messageId: number): void {
    const username = localStorage.getItem('username') || 'Utilisateur';
    this.send({
      type: 'like',
      data: {
        username,
        messageId,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notifie les autres utilisateurs d'un commentaire
   * @param messageId ID du message
   * @param commentText Texte du commentaire
   */
  public notifyComment(messageId: number, commentText: string): void {
    const username = localStorage.getItem('username') || 'Utilisateur';
    this.send({
      type: 'comment',
      data: {
        username,
        messageId,
        commentText,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notifie les autres utilisateurs d'un partage
   * @param messageId ID du message
   */
  public notifyShare(messageId: number): void {
    const username = localStorage.getItem('username') || 'Utilisateur';
    this.send({
      type: 'share',
      data: {
        username,
        messageId,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notifie les autres utilisateurs d'une déconnexion
   */
  public notifyLogout(): void {
    const username = localStorage.getItem('username') || 'Utilisateur';
    this.send({
      type: 'logout',
      data: {
        username,
        timestamp: new Date().toISOString()
      }
    });
  }
}