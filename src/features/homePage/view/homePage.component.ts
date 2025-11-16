import { Component } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-home-page',
  imports: [CommonModule, TableModule, RouterOutlet, RouterLink],
  templateUrl: './homePage.component.html',
  styleUrl: './homePage.component.css',
})
export class HomePageComponent {
  reportes: any[] = [];
  constructor() { }

  ngOnInit() {

  }
}
