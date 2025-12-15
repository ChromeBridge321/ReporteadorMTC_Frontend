import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RESTReporteResponse } from '../../core/models/reporte.model';
import { TableModule } from 'primeng/table';
import { PozosService } from '../../core/services/pozos.Service';
import { RESTPozo } from '../../core/models/pozos.model';
import { Button } from 'primeng/button';
import { GenerarExcelDiarioService } from '../../core/services/generarExcelDiario.service';
import { GenerarExcelMensual } from '../../core/services/generarExcelMensual.service';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'app-reporte.component',
  imports: [CommonModule, TableModule, Button],
  templateUrl: './reporte.component.html',
  styleUrl: './reporte.component.css',
})
export class ReporteComponent implements OnInit {
  pozosArray: RESTReporteResponse = [];
  pozosSeleccionados: RESTPozo[] = [];
  fechaSeleccionada: string | undefined;
  conexionActual: string | null = null;
  tipoReporte: 'diario' | 'mensual' = 'diario';
  constructor(
    private pozosService: PozosService,
    private generarExcelService: GenerarExcelDiarioService,
    private generarExcelMensual: GenerarExcelMensual,
    private router: Router,
    private route: ActivatedRoute
  ) { }

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

    // Suscribirse al nombre de la conexión
    this.pozosService.nombreConexion$.subscribe(nombre => {
      this.conexionActual = nombre;
    });


  }

  exportarExcel() {
    this.route.data.subscribe(data => {
      this.tipoReporte = data['tipo'];
    });
    console.log('Tipo de reporte:', this.tipoReporte);
    if (this.tipoReporte === 'diario') {
      this.exportarExcelDiario();
    } else {
      this.exportarExcelMensual();
    }
  }

  async exportarExcelDiario() {
    await this.generarExcelService.generarExcel(
      this.pozosArray,
      this.pozosSeleccionados,
      this.fechaSeleccionada,
      this.conexionActual
    );


  }

  async exportarExcelMensual() {
    await this.generarExcelMensual.generarExcel(
      this.pozosArray,
      this.pozosSeleccionados,
      this.fechaSeleccionada,
      this.conexionActual
    );
  }
}
