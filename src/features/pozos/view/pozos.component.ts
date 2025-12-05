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
import { Router, ActivatedRoute } from '@angular/router';
import { RESTReporteResponse } from '../../reporte/models/reporte.model';
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
  constructor(
    private pozosService: PozosService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute
  ) { }
  loading: boolean = false;
  loadingReporte = signal<boolean>(false);
  date = signal<Date | undefined>(undefined);
  pozosData: RESTPozo[] = [];
  pozosSeleccionados = signal<RESTPozo[]>([]);
  tipoReporte: 'diario' | 'mensual' = 'diario';
  viewMode: 'date' | 'month' = 'date';

  // Computed para determinar si el botón debe estar deshabilitado
  isGenerarReporteDisabled = computed(() => {
    return this.pozosSeleccionados().length === 0 || this.date() === undefined || this.loadingReporte();
  });

  conexiones: Conexion[] = [
    { name: 'Poza Rica', conexion: 'bd_MTC_PozaRica' },
    { name: 'SAMARIA-LUNA', conexion: 'bd_SDMC_Motocomp' },
    { name: 'MACUSPANA-MUSPAC', conexion: 'bd_MTC_Muspac' },
    { name: 'BELLOTA', conexion: 'bd_Bellota' },
    { name: '5P', conexion: 'bd_MTC_CincoP' },
  ];
  conexionSeleccionada: Conexion = { name: 'Poza Rica', conexion: 'bd_MTC_PozaRica' };

  ngOnInit() {
    // Obtener tipo de reporte desde los datos de la ruta
    this.route.data.subscribe(data => {
      this.tipoReporte = data['tipo'] || 'diario';
      this.viewMode = this.tipoReporte === 'mensual' ? 'month' : 'date';
    });

    this.loadPozosData("bd_MTC_PozaRica");
  }

  loadPozosData(conexion?: string) {
    this.loading = true;
    this.pozosService.getData(conexion || this.conexionSeleccionada.conexion).subscribe({
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
    this.pozosService.clearPozosSeleccionados();
    this.pozosService.clearReporteData();
    this.pozosService.clearFechaSeleccionada();

    this.pozosService.setPozosSeleccionados(this.pozosSeleccionados());
    this.pozosService.setFechaSeleccionada(fechaFormateada);

    if (this.tipoReporte === 'diario') {
      this.pozosService.generarReporteDiario(IdsPozos, fechaFormateada, this.conexionSeleccionada.conexion).subscribe({
        next: (data: RESTReporteResponse) => {
          this.loadingReporte.set(false);
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Reporte generado correctamente' });
          this.router.navigate(['reporte/pozos/diario/ver']);
        }, error: () => {
          this.loadingReporte.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al generar el reporte' });
        }
      })
    } else {
      this.pozosService.generarReporteMensual(IdsPozos, fechaFormateada, this.conexionSeleccionada.conexion).subscribe({
        next: (data: RESTReporteResponse) => {
          this.loadingReporte.set(false);
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Reporte generado correctamente' });
          this.router.navigate(['reporte/pozos/mensual/ver']);
        }, error: () => {
          this.loadingReporte.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al generar el reporte' });
        }
      })
    }




  }

  formatearFecha(fecha: Date | undefined): string {
    if (!fecha) return '';
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');

    // Si es mensual, retornar solo YYYY-MM
    if (this.tipoReporte === 'mensual') {
      return `${year}-${month}`;
    }

    // Si es diario, retornar YYYY-MM-DD
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

}
