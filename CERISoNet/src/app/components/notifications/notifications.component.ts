import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { WebSocketService, WebSocketMessage } from '../../services/websocket.service';

interface Notification {
    id: number;
    message: string;
    type: 'info' | 'success' | 'warning';
    timestamp: Date;
}

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './notifications.component.html',
    styleUrls: ['./notifications.component.css']
})

export class NotificationsComponent implements OnInit, OnDestroy {

    // On stocke les notifications actives
    notifications: Notification[] = [];

    // Compteur pour ID unique
    private nextId = 1;

    // Abonnement au flux WebSocket
    private subscription: Subscription | null = null;

    // On injecte le WS pour l'utiliser
    constructor(private wsService: WebSocketService) { }

    // On exécute  au demarrage
    ngOnInit(): void {

        this.subscription = this.wsService.messages$.subscribe(message => {
            this.handleWebSocketMessage(message);
        });
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    // On traite les messages WebSocket et crée les notifications appropriées
    private handleWebSocketMessage(message: WebSocketMessage): void {
        switch (message.type) {
            case 'connection':
                this.addNotification(
                    `${message.data.username} vient de se connecter`,
                    'info'
                );
                break;

            case 'like':
                this.addNotification(
                    `${message.data.username} a aimé un message`,
                    'info'
                );
                break;

            case 'comment':
                this.addNotification(
                    `${message.data.username} a commenté: "${message.data.commentText.substring(0, 20)}${message.data.commentText.length > 20 ? '...' : ''}"`,
                    'info'
                );
                break;

            case 'share':
                this.addNotification(
                    `${message.data.username} a partagé un message`,
                    'success'
                );
                break;

            case 'logout':
                this.addNotification(
                    `${message.data.username} vient de se déconnecter`,
                    'warning'
                );
                break;
        }
    }

    // on ajoute une nouvelle notification
    addNotification(message: string, type: 'info' | 'success' | 'warning'): void {
        const notification: Notification = {
            id: this.nextId++,
            message,
            type,
            timestamp: new Date()
        };

        this.notifications.push(notification);

        // On supprime la notification après 5 secondes
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, 5000);
    }

    // On supprime la notification
    removeNotification(id: number): void {
        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    // On formate le temps
    formatTime(date: Date): string {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}