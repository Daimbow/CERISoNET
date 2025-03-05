import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, ReactiveFormsModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
  })
export class AppComponent {
    loginForm: FormGroup;

    constructor(private fb: FormBuilder) {
        this.loginForm = this.fb.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });
    }

    onSubmit() {
        if (this.loginForm.valid) {
            console.log(this.loginForm.value);
        } else {
            console.log("Formulaire non valide.");
        }
    }
}
