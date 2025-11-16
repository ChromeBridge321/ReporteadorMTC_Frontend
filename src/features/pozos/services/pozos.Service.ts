import { Injectable } from '@angular/core';
import { environment } from '../../../enviroments/enviroment.dev';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RESTPozo } from '../models/pozos.model';
@Injectable({
  providedIn: 'root'
})
export class PozosService {
  private baseUrl = `${environment.apiUrl}/pozos`;
  constructor(private http: HttpClient) { }

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

  generarReporte(Pozos: number[], Fecha: string, Conexion: string) {
    let params = new URLSearchParams();
    Pozos.forEach(pozo => params.append('Pozos[]', pozo.toString()));
    params.append('Fecha', Fecha);
    params.append('Conexion', Conexion);

    return this.http.get<[]>(`${this.baseUrl}/reporte?${params.toString()}`, { headers: this.getHeaders() });
  }
}
