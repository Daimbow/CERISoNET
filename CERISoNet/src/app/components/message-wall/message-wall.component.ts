import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { MessageService } from '../../services/message.service';
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

    // On initialise les variables

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
        private wsService: WebSocketService
    ) { }

    // On charge les messages au demarrage
    ngOnInit(): void {
        this.loadMessages();

        // on s'abonne aux événements WebSocket
        this.wsSubscription = this.wsService.messages$.subscribe(message => {

            // met à jour en temps réel en fonction des événements reçus
            if (['like', 'comment', 'share'].includes(message.type)) {

                // On recharge les messages si une action a lieu
                this.loadMessages();
            }
        });
    }

    // On se desabonne
    ngOnDestroy(): void {
        if (this.wsSubscription) {
            this.wsSubscription.unsubscribe();
        }
    }

    // Chargement des messages
    loadMessages(): void {
        this.isLoading = true;

        const options = {
            sortBy: this.selectedSort,
            filterOwner: this.selectedOwner,
            filterHashtag: this.hashtagFilter || undefined
        };

        // On récupère les messages via le service depuis le serveur
        this.messageService.getMessages(this.currentPage, this.pageSize, options)
            .subscribe({
                next: (response) => {
                    this.messages = response.messages;
                    this.totalMessages = response.total;
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error('Erreur pdnt lechargement des messages', error);
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

    setHashtagFilter(tag: string): void {
        this.hashtagFilter = tag;
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

                // met à jour le message localement
                const message = this.messages.find(m => m._id === messageId);
                if (message) {
                    message.likes += 1;
                    message.isLikedByCurrentUser = true;
                }

                // notifie les autres utilisateurs via WebSocket
                this.wsService.notifyLike(messageId);


                this.processingLike = this.processingLike.filter(id => id !== messageId);
            },
            error: (error) => {
                console.error('Erreur pdnt like du message', error);
                this.processingLike = this.processingLike.filter(id => id !== messageId);
            }
        });
    }

    // Ajout d'un commentaire
    commentMessage(messageId: number): void {

        if (this.processingComment.includes(messageId) || !this.commentInput[messageId]?.trim()) return;

        this.processingComment.push(messageId);

        this.messageService.commentMessage(messageId, this.commentInput[messageId]).subscribe({
            next: (newComment) => {

                // ajoute le commentaire au message
                const message = this.messages.find(m => m._id === messageId);
                if (message) {
                    if (!message.comments) message.comments = [];
                    message.comments.push(newComment);
                }

                // on notifie les autres utilisateurs via WebSocket
                this.wsService.notifyComment(messageId, this.commentInput[messageId]);

                // Réinitialiser le formulaire
                this.commentInput[messageId] = '';
                this.processingComment = this.processingComment.filter(id => id !== messageId);
            },
            error: (error) => {
                console.error('Erreur pdnt l\'ajout du commentaire', error);
                this.processingComment = this.processingComment.filter(id => id !== messageId);
            }
        });
    }

    // Afficche et masuque formulaire de partage
    toggleShareForm(messageId: number): void {
        this.showShareForm[messageId] = !this.showShareForm[messageId];
        if (!this.showShareForm[messageId]) {
            this.shareInput[messageId] = '';
        }
    }

    // Partage d'un message
    shareMessage(messageId: number): void {

        if (this.processingShare.includes(messageId)) return;

        const shareText = this.shareInput[messageId]?.trim() || 'Je partage ce message';
        this.processingShare.push(messageId);

        this.messageService.shareMessage(messageId, shareText).subscribe({
            next: () => {

                // On renitialise le formulaire et on recherchage les messages
                this.shareInput[messageId] = '';
                this.showShareForm[messageId] = false;
                this.processingShare = this.processingShare.filter(id => id !== messageId);

                // on notifie les autres utilisateurs via WS
                this.wsService.notifyShare(messageId);

                this.loadMessages(); // ET oN recharge pour voir le message partagé
            },
            error: (error) => {
                console.error('Erreur pdnt partage du message', error);
                this.processingShare = this.processingShare.filter(id => id !== messageId);
            }
        });
    }

    // Fonction qui gère le formtage
    formatDateTime(date: string, hour: string): string {
        return `${date} à ${hour}`;
    }

    // On met un design au hashtags
    formatMessageBody(body: string): string {

        const escaped = body
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        return escaped.replace(/#(\w+)/g, '<span class="text-primary">#$1</span>');
    }
}