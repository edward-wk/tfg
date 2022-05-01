import {Component, OnDestroy, OnInit} from '@angular/core';
import {BbddService} from "../../../../servicios/bbdd.service";
import {Paciente} from "../../../../modelo/paciente";
import {DataShareService} from "../../../../servicios/data-share.service";
import {DatePipe} from '@angular/common'

export interface Valoracion {
    ordenI: number,
    diagnosticoI: String,
    fechaInicioI: String,
}

@Component({
    selector: 'app-cabecera-paciente',
    templateUrl: './cabecera-paciente.component.html',
    styleUrls: ['./cabecera-paciente.component.css']
})
export class CabeceraPacienteComponent implements OnInit, OnDestroy {

    constructor(private servicio: BbddService,
                private dataShare: DataShareService,
                private datepipe: DatePipe) {
    }

    suscripcion: any

    ngOnInit(): void {
        this.tablaDiagnosticos = []

        this.suscripcion = this.dataShare._idPaciente$.subscribe(value => {
            console.log('CREA COMPONENTE', value);
            if (value !== '') {
                this.obtenerDatosPaciente(value)
                this.obtenerDiagnosticos(value)
            } else if (localStorage.getItem('idPaciente')) {
                this.obtenerDatosPaciente(localStorage.getItem('idPaciente'))
                this.obtenerDiagnosticos(localStorage.getItem('idPaciente'))
            }
        });
    }

    ngOnDestroy(): void {
        this.suscripcion.unsubscribe()
    }

    tablaDiagnosticos: Valoracion[] = []
    data: Paciente | undefined
    edad = 0

    calcularEdad(fxNacimiento: any): number {
        let timeDiff = Math.abs(Date.now() - new Date(fxNacimiento).getTime());
        return Math.floor(timeDiff / (1000 * 3600 * 24) / 365.25);
    }

    obtenerDatosPaciente(id: any) {
        this.servicio.getDatosMedicosPaciente(id).subscribe({
            next: value => {
                this.data = value
                this.edad = this.calcularEdad(this.data.fecha_nacimiento)
                this.edad = this.edad || 0
            },
            error: err => {
                console.log('MENU-PACIENTE', err);
            },
            complete: () => {
            }
        });
    }

    indice: number[] = []
    datova: String[] = []

    obtenerDiagnosticos(id: any) {
        this.servicio.getDatosMedicosPaciente(id).subscribe(
            {
                next: value => {
                    this.tablaDiagnosticos = []
                    console.log('BASE DE DATOS', value);

                    for (const [index, dato] of value.datosMedicos.valoracion.entries()) {
                        let fechaFormateada;
                        if (dato.fecha_inicio !== undefined) {
                            fechaFormateada = this.datepipe.transform(dato.fecha_inicio, 'dd/MM/yyyy');
                        }

                        let registro: Valoracion = {
                            ordenI: index,
                            diagnosticoI: dato.diagnostico_psicologico?.diagnostico || 'En valoración',
                            fechaInicioI: fechaFormateada || ''
                        }

                        this.tablaDiagnosticos.push(registro)
                    }

                    if (value.datosMedicos.valoracion.length > 0)
                        this.dataShare._valoracion$.next(value.datosMedicos.valoracion.length - 1);
                    else
                        this.dataShare._valoracion$.next(0)
                    
                }
            }
        )
    }

    cambiarValoracion(evento: any) {
        const indice = (evento.length - 1) - evento.selectedIndex
        this.dataShare._valoracion$.next(indice);
        localStorage.setItem('valoracionId', String(indice))

    }
}