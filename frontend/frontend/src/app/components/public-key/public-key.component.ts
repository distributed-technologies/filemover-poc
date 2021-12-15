import { Component, OnInit } from '@angular/core';
import { PublicKeyService } from 'src/app/core/services/public-key/public-key.service';
import { Observable, throwError, timer } from 'rxjs';
import { PublicKey } from 'src/app/models/public-key.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-public-key',
  templateUrl: './public-key.component.html',
  styleUrls: ['./public-key.component.css']
})
export class PublicKeyComponent implements OnInit {

  private intervalSec = 1000;

  public deletingPublicKey: boolean = false;
  public publicKeys: Observable<PublicKey[]>;
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
    this.deletingPublicKey = true
    return this.publicKeyService.deletePublicKey(publicKey)
    .then(() => this.deletingPublicKey = false)
  }

  public createPublicKey(){
    console.log(this.publicKeyForm.value);
    return this.publicKeyService.postPublicKey(this.publicKeyForm.value)
  }

  private createPublicKeyObservable(intervalSec: number): Observable<PublicKey[]> {
    return timer(0,intervalSec)
      .pipe(mergeMap(() => this.publicKeyService.getPublicKeys()))
  }
}
