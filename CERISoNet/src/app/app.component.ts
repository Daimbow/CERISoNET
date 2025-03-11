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
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: string = '';
  toastHeader: string = 'Notification';

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  getToastClass(): string {
    switch (this.toastType) {
      case 'success':
        return 'bg-success text-light';
      case 'error':
        return 'bg-danger text-light';
      default:
        return 'bg-info text-light';
    }
  }

  showToastMessage(message: string, type: string): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      const formData = this.loginForm.value;
      const headers = new HttpHeaders().set('Content-Type', 'application/json');

      try {
        const response = await this.http.post('https://pedago.univ-avignon.fr:3223/login', formData, { headers }).toPromise();
        console.log('Réponse du serveur:', response);
        this.showToastMessage('Connexion réussie!', 'success');
      } catch (error) {
        console.error('Erreur:', error);
        this.showToastMessage('Erreur lors de la connexion. Vérifiez vos informations et réessayez.', 'error');
      }
    } else {
      console.log('Le formulaire est invalide');
      alert('Le formulaire est invalide. Assurez-vous que tous les champs sont correctement remplis.');
    }
  }
}
