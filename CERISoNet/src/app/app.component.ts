import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { MessageWallComponent } from './components/message-wall/message-wall.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { WebSocketService } from './services/websocket.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        CommonModule, 
        NgbToastModule, 
        RouterModule, 
        ReactiveFormsModule, 
        HttpClientModule, 
        MessageWallComponent,
        NotificationsComponent
    ],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
    title = 'CERISoNet';
    
    // Variable pour formulaire de connexion
    loginForm: FormGroup;

    // Variable pour stocker la derniere connexion
    lastLogin: string | null = null;

    // Variables pour les notifications
    showNotification: boolean = false;
    notificationClass: string = '';
    notificationTitle: string = '';
    notificationMessage: string = '';
    
    // Variable pour déterminer si l'utilisateur est connecté
    isLoggedIn: boolean = false;
    
    // Nom d'utilisateur connecté
    username: string = '';

    // Constructeur du composant avec injection de formBuilder et httpClient 
    constructor(
        private fb: FormBuilder, 
        private http: HttpClient,
        private wsService: WebSocketService
    ) {
        this.loginForm = this.fb.group({
            username: ['', [Validators.required, Validators.minLength(3)]],
            password: ['', [Validators.required, Validators.minLength(3)]]
        });
    }

    // évite de charger lastLogin au démarrage
    ngOnInit(): void {
        // Vérifier si l'utilisateur est déjà connecté
        const storedLogin = localStorage.getItem('lastLogin');
        if (storedLogin) {
            this.lastLogin = `Dernière connexion : ${storedLogin}`;
            this.isLoggedIn = true;
            this.username = localStorage.getItem('username') || '';
            
            // Si l'utilisateur est connecté, établir la connexion WebSocket
            this.connectWebSocket();
        } else {
            this.lastLogin = null;
            this.isLoggedIn = false;
        }
    }
    
    ngOnDestroy(): void {
        // Fermer la connexion WebSocket lorsque le composant est détruit
        this.wsService.disconnect();
    }

    // Établit la connexion WebSocket
    private connectWebSocket(): void {
        // Utiliser l'ID de l'utilisateur ou un identifiant unique
        const userId = this.username || 'anonymous-user';
        this.wsService.connect(userId);
        
        // Notifier les autres utilisateurs de la connexion
        this.wsService.notifyConnection();
    }

    // Enregistre la dernière connexion dans le Local Storage
    saveLastLogin(): void {
        const now = new Date().toLocaleString();
        localStorage.setItem('lastLogin', now);
        this.lastLogin = `Dernière connexion : ${now}`;
    }

    // Afficher le message de notification
    showNotificationMessage(message: string, type: string): void {
        this.notificationMessage = message;
        this.notificationTitle = type === 'success' ? 'Succès' : 'Erreur';
        this.notificationClass = type === 'success' ? 'success' : 'error';

        // Efface lastLogin si erreur
        if (type !== 'success') {
            this.lastLogin = null;
        }

        this.showNotification = true;

        // Efface la notification apres 7s
        setTimeout(() => {
            this.showNotification = false;
        }, 7000);
    }

    // Fonction de soumission du formulaire
    async onSubmit() {
        if (this.loginForm.valid) {
            // Envoie des données au serveur
            const formData = this.loginForm.value;
            const headers = new HttpHeaders().set('Content-Type', 'application/json');

            try {
                const response: any = await this.http.post('https://pedago.univ-avignon.fr:3223/login', formData, { headers }).toPromise();
                this.saveLastLogin();
                this.isLoggedIn = true;
                this.username = formData.username;
                localStorage.setItem('username', formData.username);
                this.showNotificationMessage('Connexion réussie !', 'success');
                
                // Établir la connexion WebSocket après une connexion réussie
                this.connectWebSocket();
            } catch (error) {
                this.showNotificationMessage('Erreur lors de la connexion.\nVérifiez vos informations et réessayez.', 'error');
                this.isLoggedIn = false;
            }
        } else {
            this.showNotificationMessage('Le formulaire est invalide. Assurez-vous que tous les champs sont correctement remplis.', 'error');
        }
    }
    
    // Fonction de déconnexion
    logout(): void {
        // Notifier les autres utilisateurs de la déconnexion avant de fermer la connexion
        this.wsService.notifyLogout();
        this.wsService.disconnect();
        
        // Idéalement, envoyer une requête au serveur pour déconnecter l'utilisateur
        this.isLoggedIn = false;
        this.username = '';
        localStorage.removeItem('username');
        this.showNotificationMessage('Vous avez été déconnecté.', 'success');
    }
}