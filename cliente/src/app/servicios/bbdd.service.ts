import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Paciente} from "../modelo/paciente";
import {Psicologo} from '../modelo/psicologo';

@Injectable({
    providedIn: 'root'
})
export class BbddService {

    constructor(private http: HttpClient) {
    }

    altaPsicologo(datos: any) {
        return this.http.post('http://localhost:4001/psicologo/altaDatos/', datos);
    }

    altaPaciente(datos: any) {
        return this.http.post('http://localhost:4001/paciente/', datos);
    }

    altaConsultaPaciente(consultaDatos:any) {
        console.log('entra servicio');
        let url = 'http://localhost:4001/paciente/altaConsulta/' + localStorage.getItem('idPaciente')
        console.log(url);
        return this.http.put(url, consultaDatos)
    }

    modificarConsultaPaciente(consultaDatos:any) {
        let url = 'http://localhost:4001/paciente/modificacionConsulta/' + localStorage.getItem('idPaciente')
        return this.http.put(url, consultaDatos)
    }

    getDatosMedicosPaciente(paciente: any) {
        return this.http.get<Paciente>('http://localhost:4001/paciente/' + paciente)
    }

    getDatosPsicologo(psicologo: any) {
        return this.http.get<Psicologo>('http://localhost:4001/psicologo/uno/')
    }
}
