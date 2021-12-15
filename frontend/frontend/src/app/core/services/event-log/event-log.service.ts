import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { mergeMap, catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EventLogService {
  private host: string;
  private intervalSec: number = 2000;

  constructor(private http: HttpClient) {
    this.host = "http://10.178.16.140:8080/keys/log";
  }

  public getLog(): Observable<string> {
    return timer(0,this.intervalSec)
      .pipe(
        mergeMap(() => this.http.get(this.host, {responseType: 'text'})),
        tap(console.log),
        catchError(this.handleError)
      )
  }

  private handleError(error: string){
    console.log(error)
    return throwError('Something bad happened; please try again later.');
  }
}
