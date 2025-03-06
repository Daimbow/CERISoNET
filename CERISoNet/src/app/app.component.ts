import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NgbAlertModule, RouterModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit() {

    if (this.loginForm.valid) {
      const formData = this.loginForm.value;
      console.log('Formulaire soumis', formData);  

      // Création des en-têtes pour la requête
      const headers = new HttpHeaders().set('Content-Type', 'application/json');

      try {

        const response = await this.http.post('https://pedago.univ-avignon.fr:3223/login', formData, { headers }).toPromise();
        console.log('Réponse du serveur:', response);
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la connexion. Vérifiez vos informations et réessayez.');
      }
    } else {
      console.log('Le formulaire est invalide');
      alert('Le formulaire est invalide. Assurez-vous que tous les champs sont correctement remplis.');
    }
  }
}
