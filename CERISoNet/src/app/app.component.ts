import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, HttpClientModule],
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
        return 'text-bg-success border-0';
      case 'error':
        return 'text-bg-danger border-0';
      default:
        return 'text-bg-info border-0';
    }
  }

  showToastMessage(message: string, type: string): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    // Hide the toast after 3 seconds
    setTimeout(() => {
      this.showToast = false;
    }, 3000); // 3000 ms = 3 seconds
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
