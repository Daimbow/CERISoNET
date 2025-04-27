import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, NgbToastModule, RouterModule, ReactiveFormsModule, HttpClientModule],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

    // Variable pour formulaire de connexion
    loginForm: FormGroup;

    // Variable pour stocker la derniere connexion
    lastLogin: string | null = null;

    // Variables pour les notifications
    showNotification: boolean = false;
    notificationClass: string = '';
    notificationTitle: string = '';
    notificationMessage: string = '';

    // Constructeur du composant avec injection de formBuilder et httpClient 
    constructor(private fb: FormBuilder, private http: HttpClient) {
        this.loginForm = this.fb.group({
            username: ['', [Validators.required, Validators.minLength(3)]],
            password: ['', [Validators.required, Validators.minLength(3)]]
        });
    }

    // évite de charger lastLogin au démarrage
    ngOnInit(): void {
        this.lastLogin = null;
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

                await this.http.post('https://pedago.univ-avignon.fr:3223/login', formData, { headers }).toPromise();
                this.saveLastLogin();
                this.showNotificationMessage('Connexion réussie !', 'success');

            } catch (error) {
                this.showNotificationMessage('Erreur lors de la connexion.\nVérifiez vos informations et réessayez.', 'error');
            }
        } else {
            this.showNotificationMessage('Le formulaire est invalide. Assurez-vous que tous les champs sont correctement remplis.', 'error');

        }
    }
}
