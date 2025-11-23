import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RESTReporteResponse } from '../../reportes/models/reporte.model';
import { TableModule } from 'primeng/table';
import { PozosService } from '../../pozos/services/pozos.Service';
@Component({
  selector: 'app-reporte-diario',
  imports: [CommonModule, TableModule],
  templateUrl: './reporteDiario.component.html',
  styleUrl: './reporteDiario.component.css'
})
export class ReporteDiarioComponent implements OnInit {
  pozosArray: RESTReporteResponse = [];

  constructor(private pozosService: PozosService) { }

  ngOnInit() {
    this.pozosService.reporteData$.subscribe(data => {
      if (data) {
        this.pozosArray = data;
      }
    });
  }
}
