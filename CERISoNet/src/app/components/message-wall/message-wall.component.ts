import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { MessageService } from '../../services/message.service';
import { UserService } from '../../services/user.service';
import { WebSocketService } from '../../services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-message-wall',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgbModule,
    NgbPaginationModule
  ],
  templateUrl: './message-wall.component.html',
  styleUrls: ['./message-wall.component.css']
})
export class MessageWallComponent implements OnInit, OnDestroy {
  // Messages
  messages: any[] = [];
  
  // Pagination
  currentPage = 1;
  pageSize = 5;
  totalMessages = 0;
  
  // Filtres et tri
  sortOptions = [
    { value: 'date', label: 'Date (récent → ancien)' },
    { value: 'date-asc', label: 'Date (ancien → récent)' },
    { value: 'likes', label: 'Popularité (likes)' },
    { value: 'comments', label: 'Nombre de commentaires' }
  ];
  selectedSort = 'date';
  
  ownerOptions = [
    { value: undefined, label: 'Tous les messages' },
    { value: true, label: 'Mes messages' },
    { value: false, label: 'Messages des autres' }
  ];
  selectedOwner: any = undefined;
  
  hashtagFilter = '';
  
  // État des messages
  expandedMessageId: number | null = null;
  commentInput: { [key: number]: string } = {};
  shareInput: { [key: number]: string } = {};
  showShareForm: { [key: number]: boolean } = {};
  
  // États de chargement
  isLoading = false;
  processingLike: number[] = [];
  processingComment: number[] = [];
  processingShare: number[] = [];
  
  // Subscription WebSocket
  private wsSubscription: Subscription | null = null;
  
  constructor(
    private messageService: MessageService,
    private userService: UserService,
    private wsService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.loadMessages();
    
    // S'abonner aux événements WebSocket
    this.wsSubscription = this.wsService.messages$.subscribe(message => {
      // Mettre à jour en temps réel en fonction des événements reçus
      if (['like', 'comment', 'share'].includes(message.type)) {
        // Recharger les messages si une action pertinente a lieu
        this.loadMessages();
      }
    });
  }
  
  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
  }

  loadMessages(): void {
    this.isLoading = true;
    
    const options = {
      sortBy: this.selectedSort,
      filterOwner: this.selectedOwner,
      filterHashtag: this.hashtagFilter || undefined
    };
    
    this.messageService.getMessages(this.currentPage, this.pageSize, options)
      .subscribe({
        next: (response) => {
          this.messages = response.messages;
          this.totalMessages = response.total;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des messages', error);
          this.isLoading = false;
        }
      });
  }

  // Gestion de la pagination
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadMessages();
  }

  // Actions de filtrage et tri
  applySort(): void {
    this.currentPage = 1;
    this.loadMessages();
  }

  applyOwnerFilter(): void {
    this.currentPage = 1;
    this.loadMessages();
  }

  applyHashtagFilter(): void {
    this.currentPage = 1;
    this.loadMessages();
  }

  clearHashtagFilter(): void {
    this.hashtagFilter = '';
    this.currentPage = 1;
    this.loadMessages();
  }

  // Actions sur les messages
  toggleMessageExpand(messageId: number): void {
    if (this.expandedMessageId === messageId) {
      this.expandedMessageId = null;
    } else {
      this.expandedMessageId = messageId;
    }
  }

  likeMessage(messageId: number): void {
    if (this.processingLike.includes(messageId)) return;
    
    this.processingLike.push(messageId);
    
    this.messageService.likeMessage(messageId).subscribe({
      next: () => {
        // Mettre à jour le message localement
        const message = this.messages.find(m => m._id === messageId);
        if (message) {
          message.likes += 1;
          // Si nécessaire, mettre à jour l'état "liked by current user"
          message.isLikedByCurrentUser = true;
        }
        
        // Notifier les autres utilisateurs via WebSocket
        this.wsService.notifyLike(messageId);
        
        this.processingLike = this.processingLike.filter(id => id !== messageId);
      },
      error: (error) => {
        console.error('Erreur lors du like du message', error);
        this.processingLike = this.processingLike.filter(id => id !== messageId);
      }
    });
  }

  commentMessage(messageId: number): void {
    if (this.processingComment.includes(messageId) || !this.commentInput[messageId]?.trim()) return;
    
    this.processingComment.push(messageId);
    
    this.messageService.commentMessage(messageId, this.commentInput[messageId]).subscribe({
      next: (newComment) => {
        // Ajouter le commentaire au message
        const message = this.messages.find(m => m._id === messageId);
        if (message) {
          if (!message.comments) message.comments = [];
          message.comments.push(newComment);
        }
        
        // Notifier les autres utilisateurs via WebSocket
        this.wsService.notifyComment(messageId, this.commentInput[messageId]);
        
        // Réinitialiser le formulaire
        this.commentInput[messageId] = '';
        this.processingComment = this.processingComment.filter(id => id !== messageId);
      },
      error: (error) => {
        console.error('Erreur lors de l\'ajout du commentaire', error);
        this.processingComment = this.processingComment.filter(id => id !== messageId);
      }
    });
  }

  toggleShareForm(messageId: number): void {
    this.showShareForm[messageId] = !this.showShareForm[messageId];
    if (!this.showShareForm[messageId]) {
      this.shareInput[messageId] = '';
    }
  }

  shareMessage(messageId: number): void {
    if (this.processingShare.includes(messageId)) return;
    
    const shareText = this.shareInput[messageId]?.trim() || 'Je partage ce message';
    this.processingShare.push(messageId);
    
    this.messageService.shareMessage(messageId, shareText).subscribe({
      next: () => {
        // Réinitialiser le formulaire et recharger les messages
        this.shareInput[messageId] = '';
        this.showShareForm[messageId] = false;
        this.processingShare = this.processingShare.filter(id => id !== messageId);
        
        // Notifier les autres utilisateurs via WebSocket
        this.wsService.notifyShare(messageId);
        
        this.loadMessages(); // Recharger pour voir le message partagé
      },
      error: (error) => {
        console.error('Erreur lors du partage du message', error);
        this.processingShare = this.processingShare.filter(id => id !== messageId);
      }
    });
  }

  // Fonctions utilitaires pour l'affichage
  formatDateTime(date: string, hour: string): string {
    return `${date} à ${hour}`;
  }

  // Permet d'échapper les caractères HTML et de mettre en surbrillance les hashtags
  formatMessageBody(body: string): string {
    // Échapper les caractères HTML
    const escaped = body
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    
    // Remplacer les hashtags par des spans stylisés
    return escaped.replace(/#(\w+)/g, '<span class="text-primary">#$1</span>');
  }
}