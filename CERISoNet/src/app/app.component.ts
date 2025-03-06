import { Component } from '@angular/core';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap'; // Import du module alert
import { CommonModule } from '@angular/common'; // Import de CommonModule pour les directives Angular
import { RouterModule } from '@angular/router'; // Import de RouterModule pour le routage

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NgbAlertModule, RouterModule], // Ajout de RouterModule pour les routes
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  // Liste des types d'alertes à afficher
  alertTypes = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'];
}
