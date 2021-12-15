import { Component, OnInit } from '@angular/core';
import { EventLogService } from 'src/app/core/services/event-log/event-log.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-event-log',
  templateUrl: './event-log.component.html',
  styleUrls: ['./event-log.component.css']
})
export class EventLogComponent implements OnInit {

  public eventLogObservable: Observable<string> | undefined;

  constructor(public logService: EventLogService) { }

  ngOnInit(): void {
    this.eventLogObservable = this.logService.getLog();
  }

}
