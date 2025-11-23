import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RESTReporteResponse } from './models/reporte.model';
import { TableModule } from 'primeng/table';
import { PozosService } from '../pozos/services/pozos.Service';
@Component({
  selector: 'app-reporte.component',
  imports: [CommonModule, TableModule],
  templateUrl: './reporte.component.html',
  styleUrl: './reporte.component.css',
})
export class ReporteComponent implements OnInit {
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
