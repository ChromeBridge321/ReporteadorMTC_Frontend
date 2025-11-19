import { Component, OnInit } from '@angular/core';
import { PozosService } from '../pozos/services/pozos.Service';
import { CommonModule } from '@angular/common';
import { RESTReporte, RESTReporteResponse } from './models/reporte.model';
import { TableModule } from 'primeng/table';
@Component({
  selector: 'app-reportes.component',
  imports: [CommonModule, TableModule],
  templateUrl: './reportes.component.html',
})
export class ReportesComponent implements OnInit {
  pozosArray: { nombre: string; registros: RESTReporte[] }[] = [];
  reporteData: any;

  constructor(private pozosService: PozosService) { }

  ngOnInit() {
    // Suscribirse a los datos del reporte
    this.pozosService.reporteData$.subscribe(data => {
      if (data) {
        // Convertir el objeto en un array para iterar en el template
        this.pozosArray = Object.entries(data).map(([nombre, registros]) => ({
          nombre,
          registros
        }));
      }
    });
  }
}
