import { Component, OnInit } from '@angular/core';
import { PozosService } from '../pozos/services/pozos.Service';
import { CommonModule } from '@angular/common';
import { RESTReporteResponse } from './models/reporte.model';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-reportes.component',
  imports: [CommonModule, TableModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent implements OnInit {
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
