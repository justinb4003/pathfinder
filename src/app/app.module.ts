import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_COLOR_FORMATS, NgxMatColorPickerModule, NGX_MAT_COLOR_FORMATS } from '@angular-material-components/color-picker';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule} from '@angular/material/button';
import { MatInputModule} from '@angular/material/input';
import { MainDisplayComponent } from './components/main-display/main-display.component';

@NgModule({
  declarations: [
    AppComponent,
    MainDisplayComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgxMatColorPickerModule,
    BrowserAnimationsModule, 
    ReactiveFormsModule,
    MatButtonModule, MatInputModule,
  ],
  providers: [
    { provide: MAT_COLOR_FORMATS, useValue: NGX_MAT_COLOR_FORMATS }
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
