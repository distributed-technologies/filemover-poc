import { Component, OnInit } from '@angular/core';
import { PublicKeyService } from 'src/app/core/services/public-key/public-key.service';
import { Observable, throwError, timer } from 'rxjs';
import { PublicKey } from 'src/app/models/public-key.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { mergeMap } from 'rxjs/operators';
import { EventLogService } from 'src/app/core/services/event-log/event-log.service';

@Component({
  selector: 'app-public-key',
  templateUrl: './public-key.component.html',
  styleUrls: ['./public-key.component.css']
})
export class PublicKeyComponent implements OnInit {

  private intervalSec = 1000;

  public formError = false;
  public errorMsg = "";
  public deletingPublicKey: boolean = false;
  public publicKeys: Observable<PublicKey[]> | undefined;
  public publicKeyForm: FormGroup = new FormGroup({
      name: new FormControl('', Validators.required),
      group: new FormControl('', Validators.required),
      key: new FormControl('', Validators.required),
  })

  constructor(private publicKeyService: PublicKeyService) { }

  ngOnInit(): void {
    this.publicKeys = this.createPublicKeyObservable(this.intervalSec)
  }

  public deletePublicKey(publicKey: PublicKey) {
    if(confirm("Er du sikker på at du vil slett denne bruger?")){
      this.deletingPublicKey = true
      return this.publicKeyService.deletePublicKey(publicKey)
        .then(() => this.deletingPublicKey = false)
    }
    return
  }

  public createPublicKey(){
    return this.publicKeyService.postPublicKey(this.publicKeyForm.value)
      .then(() => {
        this.formError = false
      })
      .catch(err => {
        this.formError = true
        this.errorMsg = err;
      })
  }

  private createPublicKeyObservable(intervalSec: number): Observable<PublicKey[]> {
    return timer(0,intervalSec)
      .pipe(mergeMap(() => this.publicKeyService.getPublicKeys()))
  }
}
