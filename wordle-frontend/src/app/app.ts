import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { GameGrid } from './components/game-grid/game-grid';
import { VirtualKeyboard } from './components/virtual-keyboard/virtual-keyboard';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, GameGrid, VirtualKeyboard],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
}
