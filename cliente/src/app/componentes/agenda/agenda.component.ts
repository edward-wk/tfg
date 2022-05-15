import {ChangeDetectionStrategy, Component, OnInit, TemplateRef, ViewChild, ViewEncapsulation,} from '@angular/core';
import {endOfDay, isSameDay, isSameMonth, parseISO, startOfDay, subDays,} from 'date-fns';
import {Subject} from 'rxjs';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {
    CalendarDayViewBeforeRenderEvent,
    CalendarEvent,
    CalendarEventAction,
    CalendarEventTimesChangedEvent,
    CalendarMonthViewBeforeRenderEvent,
    CalendarView, CalendarWeekViewBeforeRenderEvent,
} from 'angular-calendar';
import {DetalleComponent} from "./detalle/detalle.component";
import {registerLocaleData} from '@angular/common';
import localeEs from '@angular/common/locales/es';
import {AgendaService} from "../../servicios/agenda.service";
import {ToastrService} from "ngx-toastr";
import {DataShareService} from "../../servicios/data-share.service";

registerLocaleData(localeEs, 'es')

@Component({
    selector: 'app-agenda',
    templateUrl: './agenda.component.html',
    styleUrls: ['./agenda.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,

})
export class AgendaComponent implements OnInit {
    @ViewChild('modalContent', {static: true}) modalContent!: TemplateRef<any>;

    constructor(private modal: NgbModal,
                private servicioAgenda: AgendaService,
                private toastr: ToastrService,
                private dataShare: DataShareService) {
    }

    ngOnInit(): void {
        this.loadDB()
        let sus = this.dataShare.refreshCalendar.subscribe({
            next: value => {
                let opcion = String(value)
                if (opcion.split(':')[0]==='Eliminar'){
                    const id = opcion.split(':')[1]
                    console.log('entra por eliminar', id);
                    this.deleteEvent(id)
                    this.refresh.next()
                }else {
                    value.start = subDays(parseISO(String(value.start)), 0)
                    value.end = subDays(parseISO(String(value.end)), 0)
                    if (this.events.findIndex(e => e.id === value._id) === -1) {
                        this.events.push(value)
                        this.refresh.next()
                    } else {
                        this.deleteEvent(value.id)
                        this.events.push(value)
                        this.refresh.next()
                    }
                }
            },
            complete: () => {
                sus.unsubscribe()
            }
        })
    }

    weekStartsOn = "1";
    locale = 'es'
    view: CalendarView = CalendarView.Month;
    CalendarView = CalendarView;
    viewDate: Date = new Date();

    loadDB() {
        this.servicioAgenda.getAgendaByPsicologo('aa').subscribe({
            next: value => {
                this.events = []
                for (const valor of value) {
                    valor.start = subDays(parseISO(String(valor.start)), 0)
                    valor.end = subDays(parseISO(String(valor.end)), 0)
                    this.events.push(valor)
                }

                this.refresh.next()
            },
            error: err => {
                if (err.status === 0) {
                    this.toastr.error('', "ERROR EN EL SERVIDOR")
                    return;
                }

                this.toastr.error(`[SERVIDOR] ${err.error.message}`, `[SERVIDOR] ${err.error.status}`)
            }
        })
    }

    refresh = new Subject<void>();
    actions: CalendarEventAction[] = [
        {
            label: '<i class="fas fa-fw fa-pencil-alt"></i>',
            a11yLabel: 'Edit',
            onClick: ({event}: { event: CalendarEvent }): void => {
                this.handleEvent('Edited', event, null, null);
            },
        },
        {
            label: '<i class="fas fa-fw fa-trash-alt"></i>',
            a11yLabel: 'Delete',
            onClick: ({event}: { event: CalendarEvent }): void => {
                this.events = this.events.filter((iEvent) => iEvent !== event);
                this.handleEvent('Deleted', event, null, null);
            },
        },
    ];

    events: CalendarEvent[] = [];

    activeDayIsOpen: boolean = true;

    dayClicked({date, events}: { date: Date; events: CalendarEvent[] }): void {
        if (isSameMonth(date, this.viewDate)) {
            this.activeDayIsOpen = !((isSameDay(this.viewDate, date) && this.activeDayIsOpen) ||
                events.length === 0);
            this.viewDate = date;
        }
    }

    eventTimesChanged({event, newStart, newEnd}: CalendarEventTimesChangedEvent): void {
        // console.log('NEW START', newStart);
        this.events = this.events.map((iEvent) => {
            if (iEvent === event) {
                return {
                    ...event,

                    start: newStart,
                    end: newEnd,
                };
            }
            return iEvent;
        });

        this.handleEvent('Changed date', event, newStart, newEnd!);
    }

    handleEvent(action: string, event: CalendarEvent, newStart: any, newEnd: any): void{
        console.log('PRINCIPAL', event);
        console.log('ACTION', action);
        switch (action) {
            case 'Changed date':
                event.start = newStart
                event.end = newEnd
                let sus = this.servicioAgenda.modificarCita(event).subscribe({
                    next: value => {
                        this.dataShare.refreshCalendar.next(value)
                        this.toastr.success('Cita modificada.')
                        this.refresh.next()
                    },
                    error: err => {
                        console.log(err);
                    },
                    complete: () => {
                        sus.unsubscribe()
                    }
                })
                break;
            case 'Clicked':
                const ref = this.modal.open(DetalleComponent, {size: 'lg'});
                console.log('EVENTO DE AGENDA',event);
                ref.componentInstance.evento = event
                break;
            case 'Edited':
                console.log('editar')
                break;
        }
    }

    deleteEvent(id:any) {
        this.events = this.events.filter((event) => event.id !== id);
    }

    setView(view: CalendarView) {
        this.view = view;
    }

    closeOpenMonthViewDay() {
        this.activeDayIsOpen = false;
    }

}
