import { Injectable, signal } from '@angular/core';
import { environment } from '../../../enviroments/enviroment.dev';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RESTPozo } from '../models/pozos.model';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { RESTReporteResponse } from '../../reporte/models/reporte.model';
@Injectable({
  providedIn: 'root'
})
export class PozosService {
  private baseUrl = `${environment.apiUrl}/pozos`;
  constructor(private http: HttpClient) { }

  private reporteDataSubject = new BehaviorSubject<RESTReporteResponse | null>(null);
  public reporteData$ = this.reporteDataSubject.asObservable();

  private pozosSeleccionadosSubject = new BehaviorSubject<RESTPozo[]>([]);
  pozosSeleccionados$ = this.pozosSeleccionadosSubject.asObservable();

  private FechaSeleccionadaSubject = new BehaviorSubject<string | undefined>(undefined);
  fechaSeleccionada$ = this.FechaSeleccionadaSubject.asObservable();

  private idsPozosCargadosSubject = new BehaviorSubject<RESTPozo[] | undefined>(undefined);
  idsPozosCargados$ = this.idsPozosCargadosSubject.asObservable();

  private conexionActualSubject = new BehaviorSubject<string | null>(null);
  conexionActual$ = this.conexionActualSubject.asObservable();
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  getData(conexion: string) {
    return this.http.get<RESTPozo[]>(`${this.baseUrl}?Conexion=${conexion}`, { headers: this.getHeaders() }).pipe(
      tap((data) => {
        this.idsPozosCargadosSubject.next(data);
        this.conexionActualSubject.next(conexion);
      })
    );
  }

  getDataConexion(conexion: string) {
    return this.http.get<RESTPozo[]>(`${this.baseUrl}?Conexion=${conexion}`, { headers: this.getHeaders() });
  }

  generarReporteDiario(Pozos: number[], Fecha: string, Conexion: string): Observable<RESTReporteResponse> {
    let params = new URLSearchParams();
    Pozos.forEach(pozo => params.append('Pozos[]', pozo.toString()));
    params.append('Fecha', Fecha);
    params.append('Conexion', Conexion);

    return this.http.get<RESTReporteResponse>(`${this.baseUrl}/reporte?${params.toString()}`, { headers: this.getHeaders() }).pipe(
      tap(data => this.reporteDataSubject.next(data))
    );
  }

  generarReporteMensual(Pozos: number[], Fecha: string, Conexion: string): Observable<RESTReporteResponse> {
    let params = new URLSearchParams();
    Pozos.forEach(pozo => params.append('Pozos[]', pozo.toString()));
    params.append('Fecha', Fecha);
    params.append('Conexion', Conexion);

    return this.http.get<RESTReporteResponse>(`${this.baseUrl}/reporte/mensual?${params.toString()}`, { headers: this.getHeaders() }).pipe(
      tap(data => this.reporteDataSubject.next(data))
    );
  }

  clearReporteData() {
    this.reporteDataSubject.next(null);
  }

  // Nuevo método para guardar pozos seleccionados
  setPozosSeleccionados(pozos: RESTPozo[]) {
    this.pozosSeleccionadosSubject.next(pozos);
  }

  // Nuevo método para limpiar pozos seleccionados
  clearPozosSeleccionados() {
    this.pozosSeleccionadosSubject.next([]);
  }

  // Nuevo método para guardar pozos seleccionados
  setFechaSeleccionada(fecha: string) {
    this.FechaSeleccionadaSubject.next(fecha);
  }

  // Nuevo método para limpiar pozos seleccionados
  clearFechaSeleccionada() {
    this.FechaSeleccionadaSubject.next('');
  }

  // Nuevo método para guardar pozos seleccionados
  setIdsPozos(pozos: RESTPozo[]) {
    this.idsPozosCargadosSubject.next(pozos);
  }

  // Nuevo método para limpiar pozos seleccionados
  clearIdsPozos() {
    this.idsPozosCargadosSubject.next(undefined);
  }

  // Método para obtener la conexión actual
  getConexionActual(): string | null {
    return this.conexionActualSubject.value;
  }

  // Método para verificar si los pozos ya están cargados para una conexión
  hasPozosCargados(conexion: string): boolean {
    return this.conexionActualSubject.value === conexion &&
      this.idsPozosCargadosSubject.value !== undefined &&
      this.idsPozosCargadosSubject.value.length > 0;
  }

  // Método para obtener los pozos cargados
  getPozosCargados(): RESTPozo[] | undefined {
    return this.idsPozosCargadosSubject.value;
  }

}
