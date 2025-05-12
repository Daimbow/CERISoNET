import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HashtagService } from '../../services/hashtag.service';

@Component({
  selector: 'app-hashtag-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">Gestionnaire de Hashtags</h5>
      </div>
      <div class="card-body">
        <!-- Formulaire de création -->
        <div class="mb-3">
          <h6>Créer un hashtag</h6>
          <div class="input-group mb-2">
            <input type="text" class="form-control" placeholder="Nom du hashtag" [(ngModel)]="newHashtag.name">
            <input type="number" class="form-control" placeholder="Utilisations" [(ngModel)]="newHashtag.usageCount">
            <button class="btn btn-primary" (click)="createHashtag()">Créer</button>
          </div>
        </div>
        
        <!-- Liste des hashtags -->
        <div class="mb-3">
          <h6>Hashtags enregistrés</h6>
          <div class="list-group">
            <div *ngFor="let hashtag of hashtags" class="list-group-item list-group-item-action">
              <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1">#{{ hashtag.name }}</h6>
                <small>{{ hashtag.usageCount }} utilisations</small>
              </div>
              <div class="mt-2">
                <button class="btn btn-sm btn-outline-primary me-1" (click)="selectHashtag(hashtag)">Éditer</button>
                <button class="btn btn-sm btn-outline-info me-1" (click)="findWordPosition(hashtag)">Position mot</button>
                <button class="btn btn-sm btn-outline-danger" (click)="deleteHashtag(hashtag.id)">Supprimer</button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Modification d'un hashtag -->
        <div *ngIf="selectedHashtag" class="mb-3">
          <h6>Modifier le hashtag</h6>
          <div class="input-group mb-2">
            <input type="text" class="form-control" placeholder="Nom" [(ngModel)]="selectedHashtag.name">
            <input type="number" class="form-control" placeholder="Utilisations" [(ngModel)]="selectedHashtag.usageCount">
            <button class="btn btn-success me-1" (click)="updateHashtag()">Enregistrer</button>
            <button class="btn btn-secondary" (click)="selectedHashtag = null">Annuler</button>
          </div>
        </div>
        
        <!-- Recherche position d'un mot -->
        <div *ngIf="searchHashtag" class="mb-3">
          <h6>Rechercher position d'un mot dans #{{ searchHashtag.name }}</h6>
          <div class="input-group mb-2">
            <input type="text" class="form-control" placeholder="Mot à chercher" [(ngModel)]="wordToFind">
            <button class="btn btn-info me-1" (click)="searchWord()">Rechercher</button>
            <button class="btn btn-secondary" (click)="searchHashtag = null">Annuler</button>
          </div>
          <div *ngIf="wordPosition !== null" class="alert alert-info">
            Position du mot "{{ wordToFind }}": {{ wordPosition }}
          </div>
        </div>
      </div>
    </div>
  `
})
export class HashtagManagerComponent implements OnInit {
  hashtags: any[] = [];
  newHashtag = { name: '', usageCount: 0 };
  selectedHashtag: any = null;
  searchHashtag: any = null;
  wordToFind: string = '';
  wordPosition: number | null = null;

  constructor(private hashtagService: HashtagService) { }

  ngOnInit(): void {
    this.loadHashtags();
  }

  loadHashtags(): void {
    this.hashtagService.getAllHashtags().subscribe({
      next: (hashtags) => {
        this.hashtags = hashtags;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des hashtags', error);
      }
    });
  }

  createHashtag(): void {
    if (!this.newHashtag.name.trim()) return;
    
    this.hashtagService.createHashtag(this.newHashtag).subscribe({
      next: () => {
        this.loadHashtags();
        this.newHashtag = { name: '', usageCount: 0 };
      },
      error: (error) => {
        console.error('Erreur lors de la création du hashtag', error);
      }
    });
  }

  selectHashtag(hashtag: any): void {
    this.selectedHashtag = { ...hashtag };
    this.searchHashtag = null;
  }

  updateHashtag(): void {
    if (!this.selectedHashtag || !this.selectedHashtag.name.trim()) return;
    
    this.hashtagService.updateHashtag(this.selectedHashtag.id, this.selectedHashtag).subscribe({
      next: () => {
        this.loadHashtags();
        this.selectedHashtag = null;
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du hashtag', error);
      }
    });
  }

  deleteHashtag(id: number): void {
    if (!id) return;
    
    this.hashtagService.deleteHashtag(id).subscribe({
      next: () => {
        this.loadHashtags();
        if (this.selectedHashtag && this.selectedHashtag.id === id) {
          this.selectedHashtag = null;
        }
      },
      error: (error) => {
        console.error('Erreur lors de la suppression du hashtag', error);
      }
    });
  }

  findWordPosition(hashtag: any): void {
    this.searchHashtag = { ...hashtag };
    this.selectedHashtag = null;
    this.wordPosition = null;
    this.wordToFind = '';
  }

  searchWord(): void {
    if (!this.searchHashtag || !this.wordToFind.trim()) return;
    
    this.hashtagService.findWordPosition(this.searchHashtag.id, this.wordToFind).subscribe({
      next: (result) => {
        this.wordPosition = result.position;
      },
      error: (error) => {
        console.error('Erreur lors de la recherche', error);
        this.wordPosition = -1;
      }
    });
  }
}
