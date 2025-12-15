import { Routes } from '@angular/router';
import { HomePageComponent } from './homePage/homePage.component';
import { PozosComponent } from './pozos/pozos.component';
import { ReporteComponent } from './reporte/reporte.component';
export const routes: Routes = [
  {
    path: '', component: HomePageComponent,
    children: [
      {
        path: '',
        redirectTo: 'reporte/pozos/diario',
        pathMatch: 'full'
      },
      {
        path: 'reporte/pozos/diario',
        data: { tipo: "diario" },
        component: PozosComponent
      },
      {
        path: 'reporte/pozos/mensual',
        data: { tipo: "mensual" },
        component: PozosComponent
      },
      {
        path: 'reporte/pozos/diario/ver',
        data: { tipo: "diario" },
        component: ReporteComponent
      },
      {
        path: 'reporte/pozos/mensual/ver',
        data: { tipo: "mensual" },
        component: ReporteComponent
      }
    ]

  }
];
export default routes;
