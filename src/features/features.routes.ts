import { Routes } from '@angular/router';
import { HomePageComponent } from './homePage/view/homePage.component';
import { PozosComponent } from './pozos/view/pozos.component';
import { ReportesComponent } from './reportes/reportes.component';
export const routes: Routes = [
  {
    path: '', component: HomePageComponent,
    children: [
      { path: 'reporte/pozos/diario', component: PozosComponent },
      { path: 'reporte/pozos/ver', component: ReportesComponent }
    ]

  }
];
export default routes;
