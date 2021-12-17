import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { mergeMap, catchError, tap, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EventLogService {
  private host: string;
  private intervalSec: number = 2000;

  constructor(private http: HttpClient) {
    this.host = environment.eventLogBackendURL;
  }

  public getLog(): Observable<string> {
    return timer(0,this.intervalSec)
      .pipe(
        mergeMap(() => this.http.get(this.host, {responseType: 'text'})),
        map((events: string) => {
          const lines = events.split("\n");
          const mappable_lines = lines.slice(0, lines.length - 1)
          let event_list = mappable_lines.map(log => {
            console.log(log.split(" ")[0])
            let date = new Date(log.split(" ")[0])
            let date_string = date.toLocaleDateString() + " - " + date.toLocaleTimeString()
            let info_string = log.split(" ").slice(1).toString();
            console.log("here")
            console.log(info_string)
            info_string = info_string.replace(new RegExp(",", 'g'),' ')
            info_string = info_string.replace(new RegExp("=", 'g'),': ')
            console.log(info_string)
            return date_string + " - " + info_string
          })
          return event_list.join("\n")

        }),
        catchError(this.handleError)
      )
  }

  private handleError(error: string){
    console.log(error)
    return throwError('Something bad happened; please try again later.');
  }
}
