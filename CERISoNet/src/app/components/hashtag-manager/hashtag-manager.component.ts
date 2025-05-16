import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HashtagService } from '../../services/hashtag.service';
import { NgbModalModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-hashtag-manager',
    standalone: true,
    imports: [CommonModule, FormsModule, NgbModalModule],
    templateUrl: './hashtag-manager.component.html',
    styleUrls: ['./hashtag-manager.component.css']
})
export class HashtagManagerComponent implements OnInit {
    @ViewChild('hashtagModal') hashtagModal: any;

    hashtags: any[] = [];
    newHashtag = { name: '', usageCount: 0 };
    selectedHashtag: any = null;
    searchHashtag: any = null;
    wordToFind: string = '';
    wordPosition: number | null = null;
    isLoading: boolean = false;
    syncMessage: string = '';

    constructor(
        private hashtagService: HashtagService,
        private modalService: NgbModal
    ) { }

    ngOnInit(): void {
        // On ne charge pas les hastags au démarrage
    }

    openHashtagManager(): void {
        this.modalService.open(this.hashtagModal, { centered: true, size: 'lg' }).result.then(
            (result) => {
            },
            (reason) => {
            }
        );
        this.loadHashtags();
    }

    loadHashtags(): void {
        this.isLoading = true;
        this.hashtagService.getAllHashtags().subscribe({
            next: (hashtags) => {
                this.hashtags = hashtags;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Erreur pendant le chargement des hashtags', error);
                this.isLoading = false;
            }
        });
    }

    createHashtag(): void {
        if (!this.newHashtag.name.trim()) return;

        // On s'assure que le nom du hashtag commence par #
        if (!this.newHashtag.name.startsWith('#')) {
            this.newHashtag.name = '#' + this.newHashtag.name;
        }

        this.hashtagService.createHashtag(this.newHashtag).subscribe({
            next: () => {
                this.loadHashtags();
                this.newHashtag = { name: '', usageCount: 0 };
            },
            error: (error) => {
                console.error('Erreur pendant la création du hashtag', error);
            }
        });
    }

    selectHashtag(hashtag: any): void {
        this.selectedHashtag = { ...hashtag };
        this.searchHashtag = null;
    }

    updateHashtag(): void {
        if (!this.selectedHashtag || !this.selectedHashtag.name.trim()) return;

        // On s'assure que le nom du hashtag commence par #
        if (!this.selectedHashtag.name.startsWith('#')) {
            this.selectedHashtag.name = '#' + this.selectedHashtag.name;
        }

        this.hashtagService.updateHashtag(this.selectedHashtag.id, this.selectedHashtag).subscribe({
            next: () => {
                this.loadHashtags();
                this.selectedHashtag = null;
            },
            error: (error) => {
                console.error('Erreur pendant la mise à jour du hashtag', error);
            }
        });
    }

    deleteHashtag(id: string): void {
        if (!id) return;

        this.hashtagService.deleteHashtag(id).subscribe({
            next: () => {
                this.loadHashtags();
                if (this.selectedHashtag && this.selectedHashtag.id === id) {
                    this.selectedHashtag = null;
                }
                if (this.searchHashtag && this.searchHashtag.id === id) {
                    this.searchHashtag = null;
                }
            },
            error: (error) => {
                console.error('Erreur pendant la suppression du hashtag', error);
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
                console.error('Erreur pendant la recherche', error);
                this.wordPosition = -1;
            }
        });
    }

    synchronizeHashtags(): void {
        this.isLoading = true;
        this.syncMessage = 'Synchronisation en cours...';

        this.hashtagService.synchronizeHashtags().subscribe({
            next: (response) => {
                this.syncMessage = 'Synchronisation réussie';
                this.loadHashtags();
            },
            error: (error) => {
                console.error('Erreur pdnt la synchro', error);
                this.syncMessage = 'Erreur pendant la synchronisation';
                this.isLoading = false;
            }
        });
    }
}