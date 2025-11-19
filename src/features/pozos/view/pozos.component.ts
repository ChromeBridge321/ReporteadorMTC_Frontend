import { Component, OnInit, signal, computed } from '@angular/core';
import { TableModule } from 'primeng/table';
import { PozosService } from '../services/pozos.Service';
import { RESTPozo } from '../models/pozos.model';
import { Button } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DatePicker } from 'primeng/datepicker';
import { Router } from '@angular/router';
import { RESTReporteResponse } from '../../reportes/models/reporte.model';
interface Conexion {
  name: string;
  conexion: string;
}
@Component({
  selector: 'app-pozos.component',
  imports: [TableModule, Button, Toast, Select, FormsModule, DatePicker],
  templateUrl: './pozos.component.html',
  styleUrl: './pozos.component.css',
  providers: [MessageService]
})
export class PozosComponent implements OnInit {
  constructor(private pozosService: PozosService, private messageService: MessageService, private router: Router) { }
  loading: boolean = false;
  loadingReporte = signal<boolean>(false);
  date = signal<Date | undefined>(undefined);
  pozosData: RESTPozo[] = [];
  pozosSeleccionados = signal<RESTPozo[]>([]);

  // Computed para determinar si el botón debe estar deshabilitado
  isGenerarReporteDisabled = computed(() => {
    return this.pozosSeleccionados().length === 0 || this.date() === undefined || this.loadingReporte();
  });

  conexiones: Conexion[] = [
    { name: 'Poza Rica', conexion: 'bd_MTC_PozaRica' },
    { name: 'Conexion 2', conexion: 'DB2' },
    { name: 'Conexion 3', conexion: 'DB3' },
    { name: 'Conexion 4', conexion: 'DB4' },
  ];
  conexionSeleccionada: Conexion = { name: '', conexion: '' };

  ngOnInit() {
  }

  loadPozosData() {
    this.loading = true;
    this.pozosService.getData(this.conexionSeleccionada.conexion).subscribe({
      next: (data) => {
        this.pozosData = data;
        this.loading = false;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Pozos cargados correctamente' });
      }, error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar los pozos' });
      }
    })
  }

  generearReporte() {
    this.loadingReporte.set(true);
    const IdsPozos: number[] = this.pozosSeleccionados().map(p => p.IdPozo);
    const fechaFormateada = this.formatearFecha(this.date());
    this.pozosService.generarReporte(IdsPozos, fechaFormateada, this.conexionSeleccionada.conexion).subscribe({
      next: (data: RESTReporteResponse) => {
        console.log('Datos del reporte:', data);
        this.loadingReporte.set(false);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Reporte generado correctamente' });
        this.router.navigate(['/pozos/reporte/ver']);
      }, error: () => {
        this.loadingReporte.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al generar el reporte' });
      }
    })
  }

  formatearFecha(fecha: Date | undefined): string {
    if (!fecha) return '';
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

}
