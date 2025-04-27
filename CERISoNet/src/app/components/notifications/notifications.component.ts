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
  template: `
    <div class="notifications-container">
      <div *ngFor="let notification of notifications" 
           class="notification-item" 
           [ngClass]="'notification-' + notification.type">
        <div class="notification-content">
          <span class="notification-message">{{ notification.message }}</span>
          <span class="notification-time">{{ formatTime(notification.timestamp) }}</span>
        </div>
        <button class="notification-close" (click)="removeNotification(notification.id)">×</button>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1050;
      max-width: 300px;
    }
    
    .notification-item {
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 4px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .notification-info {
      background-color: #e3f2fd;
      border-left: 4px solid #2196F3;
    }
    
    .notification-success {
      background-color: #e8f5e9;
      border-left: 4px solid #4CAF50;
    }
    
    .notification-warning {
      background-color: #fff8e1;
      border-left: 4px solid #FFC107;
    }
    
    .notification-content {
      flex: 1;
    }
    
    .notification-message {
      display: block;
      margin-bottom: 5px;
    }
    
    .notification-time {
      font-size: 0.8em;
      color: #666;
    }
    
    .notification-close {
      background: none;
      border: none;
      font-size: 1.5em;
      line-height: 1;
      cursor: pointer;
      padding: 0 5px;
    }
  `]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private nextId = 1;
  private subscription: Subscription | null = null;
  
  constructor(private wsService: WebSocketService) {}
  
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
  
  /**
   * Traite les messages WebSocket et crée les notifications appropriées
   */
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
  
  /**
   * Ajoute une nouvelle notification
   */
  addNotification(message: string, type: 'info' | 'success' | 'warning'): void {
    const notification: Notification = {
      id: this.nextId++,
      message,
      type,
      timestamp: new Date()
    };
    
    this.notifications.push(notification);
    
    // Supprimer la notification après 5 secondes
    setTimeout(() => {
      this.removeNotification(notification.id);
    }, 5000);
  }
  
  /**
   * Supprime une notification
   */
  removeNotification(id: number): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }
  
  /**
   * Formate l'heure pour l'affichage
   */
  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}