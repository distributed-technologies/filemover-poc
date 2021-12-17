import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { mergeMap, catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EventLogService {
  private host: string;

  constructor(private http: HttpClient) {
    this.host = environment.eventLogBackendURL;
  }

  public getLog(): Observable<string> {
    return timer(0, environment.pullIntervalSec * 1000)
      .pipe(
        mergeMap(() => this.http.get(this.host, {responseType: 'text'})),
        map(this.formatLogString),
        catchError(this.handleError)
      )
  }

  private handleError(error: string){
    console.log(error)
    return throwError('Something bad happened; please try again later.');
  }

  private formatLogString(logString: string): string{
    const lines = logString.split("\n");
    const mappable_lines = lines.slice(0, lines.length - 1)
    let event_list = mappable_lines.map(log => {
      let date = new Date(log.split(" ")[0])
      let date_string = date.toLocaleDateString() + " - " + date.toLocaleTimeString()
      let info_string = log.split(" ").slice(1).toString();
      info_string = info_string.replace(new RegExp(",", 'g'),' ')
      info_string = info_string.replace(new RegExp("=", 'g'),': ')
      return date_string + " - " + info_string
    })
    return event_list.join("\n")
  }
}
