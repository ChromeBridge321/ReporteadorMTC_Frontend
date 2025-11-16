import { Routes } from '@angular/router';
import { HomePageComponent } from './homePage/view/homePage.component';
import { PozosComponent } from './pozos/view/pozos.component';
export const routes: Routes = [
  {
    path: '', component: HomePageComponent,
    children: [
      { path: 'pozos', component: PozosComponent },
      { path: 'pozos/reporte', component: PozosComponent }
    ]

  }
];
export default routes;
