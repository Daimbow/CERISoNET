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

    constructor() { }

    /**
     * On etablit une connexion WebSocket avec le serveur websocket
     */
    public connect(userId: string): void {
        if (!this.socket$ || this.socket$.closed) {

            this.socket$ = webSocket(`wss://pedago.univ-avignon.fr:3223/ws?userId=${userId}`);

            this.socket$.subscribe(
                (message) => this.handleMessage(message),
                (error) => console.error('WebSocket problème:', error),
                () => console.log('WebSocket connection fermé')
            );
        }
    }

    /**
     * On ferme la connexion WebSocket
     */
    public disconnect(): void {
        if (this.socket$) {
            this.socket$.complete();
            this.socket$ = null;
        }
    }

    /**
     * Envoie un message au serveur
     */
    public send(message: WebSocketMessage): void {
        if (this.socket$ && !this.socket$.closed) {
            this.socket$.next(message);
        } else {
            console.error('impossible d\'envoyer le message.');
        }
    }

    /**
     * Traite les messages reçus et les propage
     */
    private handleMessage(message: WebSocketMessage): void {
        console.log('Received message:', message);
        this.messagesSubject.next(message);
    }

    /**
     * On notifie les autres utilisateurs d'une connexion
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