import { Injectable } from '@angular/core';
import { PublicKey } from 'src/app/models/public-key.model';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, map, switchMap, tap,take } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { JSONPublicKey } from 'src/app/models/json-public-key.model';

@Injectable({
  providedIn: 'root'
})
export class PublicKeyService {

  private host: string;

  constructor(private http: HttpClient) {
    this.host = "http://10.178.16.140:8080/keys";
  }

  public getPublicKeys(): Promise<PublicKey[]>{
    return this.http.get<JSONPublicKey[]>(this.host)
          .pipe(
            take(1),
            map((json: JSONPublicKey[]) =>
              json.map((k:JSONPublicKey) => ({
              keyId: k.KeyId,
              group: k.Group,
              name: k.Name,
              key: undefined
              })
            )),
            map((keys: PublicKey[]) => keys.sort((a,b) => a.name.localeCompare(b.name))),
            catchError(this.handleError)
          ).toPromise() as Promise<PublicKey[]>
  }

  private handleError(error: string){
    console.log(error)
    return throwError('Something bad happened; please try again later.');
  }

  public postPublicKey(publicKey: PublicKey): Promise<Object | undefined> {
    console.log(publicKey);

    return this.http.post(this.host, publicKey)
      .pipe(
        take(1),
        catchError(this.handleError)
      ).toPromise()
  }

  public deletePublicKey(publicKey: PublicKey): Promise<Object | undefined>{
    console.log(this.host + "/" + publicKey.keyId);
    return this.http.delete(this.host + "/" + publicKey.keyId)
      .pipe(
        take(1),
        catchError(this.handleError)
      ).toPromise()
  }
}
