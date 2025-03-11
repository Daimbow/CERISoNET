import { Component, OnInit, ElementRef, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbAlertModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NgbAlertModule, RouterModule, ReactiveFormsModule, HttpClientModule, NgbToastModule ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
    showToast: boolean = false;
    toastMessage: string = '';
    toastType: string = '';

    getToastClass(): string {
        switch (this.toastType) {
          case 'success':
            return 'text-bg-success'; 
          case 'error':
            return 'text-bg-danger'; 
          default:
            return '';
        }
      }

    showToastMessage(message: string, type: string): void {
        this.toastMessage = message;
        this.toastType = type;
        this.showToast = true;
    
        setTimeout(() => {
          this.showToast = false;
        }, 3000);  
      }


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

      // Création des en-têtes pour la requête
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
