import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RESTReporteResponse } from './models/reporte.model';
import { TableModule } from 'primeng/table';
import { PozosService } from '../pozos/services/pozos.Service';
import { RESTPozo } from '../pozos/models/pozos.model';
@Component({
  selector: 'app-reporte.component',
  imports: [CommonModule, TableModule],
  templateUrl: './reporte.component.html',
  styleUrl: './reporte.component.css',
})
export class ReporteComponent implements OnInit {
  pozosArray: RESTReporteResponse = [];
  pozosSeleccionados: RESTPozo[] = [];
  fechaSeleccionada: string | undefined;
  constructor(private pozosService: PozosService) { }

  ngOnInit() {
    this.pozosService.reporteData$.subscribe(data => {
      if (data) {
        this.pozosArray = data;
      }
    });

    // Suscribirse a los pozos seleccionados
    this.pozosService.pozosSeleccionados$.subscribe(pozos => {
      this.pozosSeleccionados = pozos;
    });

    this.pozosService.fechaSeleccionada$.subscribe(fecha => {
      this.fechaSeleccionada = fecha;
    });
  }
}
