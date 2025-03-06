import { Component } from '@angular/core';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap'; // Import ng-bootstrap

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgbAlertModule], // Ajout du module d'alert
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  // Liste des types d'alertes à afficher
  alertTypes = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'];
}
