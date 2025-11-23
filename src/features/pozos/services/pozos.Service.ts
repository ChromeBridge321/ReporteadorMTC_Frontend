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
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  getData(conexion: string) {
    return this.http.get<RESTPozo[]>(`${this.baseUrl}?Conexion=${conexion}`, { headers: this.getHeaders() });
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
}
