import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { MessageWallComponent } from './components/message-wall/message-wall.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { HashtagManagerComponent } from './components/hashtag-manager/hashtag-manager.component';
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

        // Components
        MessageWallComponent,
        NotificationsComponent,
        HashtagManagerComponent
    ],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit, OnDestroy {

    // titre de l'application
    title = 'CERISoNet';

    // formulaire de connexion
    loginForm: FormGroup;

    // variable pour stocker la derniere connexion
    lastLogin: string | null = null;

    // variables pour les notifications
    showNotification: boolean = false;
    notificationClass: string = '';
    notificationTitle: string = '';
    notificationMessage: string = '';

    // variable pour déterminer si l'utilisateur est connecté
    isLoggedIn: boolean = false;

    // nom d'utilisateur connecté
    username: string = '';

    // constructeur du composant avec injection de formBuilder, http et WebSocket
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

    // On vérifie la connexion pendnat le démarage de l'app
    ngOnInit(): void {

        //  vérifie si l'utilisateur est déjà connecté
        const storedLogin = localStorage.getItem('lastLogin');
        if (storedLogin) {
            this.lastLogin = `Dernière connexion : ${storedLogin}`;
            this.isLoggedIn = true;
            this.username = localStorage.getItem('username') || '';

            // on etablis la connexion WebSocket
            this.connectWebSocket();
        } else {
            this.lastLogin = null;
            this.isLoggedIn = false;
        }
    }

    ngOnDestroy(): void {

        // On ferme la connexion WebSocket lorsque qu'on ferme  l'app
        this.wsService.disconnect();
    }

    // On etablis la connexion WebSocket
    private connectWebSocket(): void {

        const userId = this.username || 'anonymous-user';

        this.wsService.connect(userId);

        // On notifie tout le monde
        this.wsService.notifyConnection();
    }

    // On enregistre la dernière connexion dans le Local Storage
    saveLastLogin(): void {
        const now = new Date().toLocaleString();
        localStorage.setItem('lastLogin', now);
        this.lastLogin = `Dernière connexion : ${now}`;
    }

    // affiche le message de notif
    showNotificationMessage(message: string, type: string): void {
        this.notificationMessage = message;
        this.notificationTitle = type === 'success' ? 'Succès' : 'Erreur';
        this.notificationClass = type === 'success' ? 'success' : 'error';

        //  si erreur on efface
        if (type !== 'success') {
            this.lastLogin = null;
        }

        this.showNotification = true;

        // on efface la notif apres 7s
        setTimeout(() => {
            this.showNotification = false;
        }, 7000);
    }

    // Fonction de soumission du formulaire
    async onSubmit() {

        if (this.loginForm.valid) {


            // envoie les données au serveur
            const formData = this.loginForm.value;
            const headers = new HttpHeaders().set('Content-Type', 'application/json');

            try {

                const response: any = await this.http.post('https://pedago.univ-avignon.fr:3223/login', formData, { headers }).toPromise();

                this.saveLastLogin();
                this.isLoggedIn = true;
                this.username = formData.username;

                localStorage.setItem('username', formData.username);

                this.showNotificationMessage('Connexion réussie !', 'success');

                // On fais la connexion WebSocket
                this.connectWebSocket();
            } catch (error) {
                this.showNotificationMessage('Erreur pendant la connexion.\nVérifiez vos informations et réessayez.', 'error');
                this.isLoggedIn = false;
            }
        } else {
            this.showNotificationMessage('Le formulaire est invalide. Assurez-vous que tous les champs sont correctement remplis.', 'error');
        }
    }

    // Fonction de déconnexion
    logout(): void {

        // on notifie tout le monde de la déconnexion
        this.wsService.notifyLogout();
        this.wsService.disconnect();

        // on apelle la route de déconnexion du serveur
        this.http.post('https://pedago.univ-avignon.fr:3223/logout', {}).subscribe({
            next: (response) => {

                // On met à jour toutes les variables 
                this.isLoggedIn = false;
                this.username = '';
                localStorage.removeItem('username');
                this.showNotificationMessage('Vous avez été déconnecté.', 'success');
            },
            error: (error) => {

                console.error('Erreur pendant la déconnexion:', error);

                // On deconnete en cas d'erreur ( sécurité )
                this.isLoggedIn = false;
                this.username = '';
                localStorage.removeItem('username');
                this.showNotificationMessage('Déconnexion locale uniquement.', 'error');
            }
        });
    }
}
