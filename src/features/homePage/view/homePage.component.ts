import { Component } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DrawerModule } from 'primeng/drawer';
import { Button } from "primeng/button";
@Component({
  selector: 'app-home-page',
  imports: [CommonModule, TableModule, RouterOutlet, DrawerModule, Button],
  templateUrl: './homePage.component.html',
  styleUrl: './homePage.component.css',
})
export class HomePageComponent {
  reportes: any[] = [];
  currentRoute: string = '';
  visible2: boolean = false;
  constructor(private router: Router) {
    // Escuchar cambios de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
    });
  }

  ngOnInit() {
    this.currentRoute = this.router.url;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  isActive(route: string): boolean {
    return this.currentRoute.includes(route);
  }
}
