import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { AppComponent } from './app.component';
import { PublicKeyComponent } from './components/public-key/public-key.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EventLogComponent } from './components/event-log/event-log/event-log.component';

@NgModule({
  declarations: [
    AppComponent,
    PublicKeyComponent,
    EventLogComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
