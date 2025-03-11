import { Component } from '@angular/core';
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
export class AppComponent {
  loginForm: FormGroup;
  
  // Variables pour les notifications
  showNotification: boolean = false;
  notificationClass: string = '';
  notificationTitle: string = '';
  notificationMessage: string = '';

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Afficher un message de notification
  showNotificationMessage(message: string, type: string): void {
    this.notificationMessage = message;
    this.notificationTitle = type === 'success' ? 'Succès' : 'Erreur';
    this.notificationClass = type === 'success' ? 'success' : 'error';
  
    console.log('Notification affichée:', message, type); // Ajouter un log pour déboguer
  
    this.showNotification = true;
  
    setTimeout(() => {
      this.showNotification = false;
    }, 7000);
  }
  

  async onSubmit() {
    if (this.loginForm.valid) {
      const formData = this.loginForm.value;
      const headers = new HttpHeaders().set('Content-Type', 'application/json');

      try {
        const response = await this.http.post('https://pedago.univ-avignon.fr:3223/login', formData, { headers }).toPromise();
        console.log('Réponse du serveur:', response);
        this.showNotificationMessage('Connexion réussie!', 'success');
      } catch (error) {
        console.error('Erreur:', error);
        this.showNotificationMessage('Erreur lors de la connexion. Vérifiez vos informations et réessayez.', 'error');
      }
    } else {
      console.log('Le formulaire est invalide');
      alert('Le formulaire est invalide. Assurez-vous que tous les champs sont correctement remplis.');
    }
  } 
}
