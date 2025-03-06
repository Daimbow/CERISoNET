import { Component } from '@angular/core';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap'; // Import du module alert
import { CommonModule } from '@angular/common'; // Import de CommonModule pour les directives Angular

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NgbAlertModule], // Ajout du module ng-bootstrap et CommonModule
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  // Liste des types d'alertes à afficher
  alertTypes = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'];
}
