import { Routes } from '@angular/router';
import { HomePageComponent } from './homePage/view/homePage.component';
import { PozosComponent } from './pozos/view/pozos.component';
import { ReporteComponent } from './reporte/reporte.component';
export const routes: Routes = [
  {
    path: '', component: HomePageComponent,
    children: [
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
      { path: 'reporte/pozos/diario/ver', component: ReporteComponent },
      { path: 'reporte/pozos/mensual/ver', component: ReporteComponent }
    ]

  }
];
export default routes;
