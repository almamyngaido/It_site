import { Component } from '@angular/core';

@Component({
  selector: 'app-nos-projets',
  templateUrl: './nos-projets.component.html',
  styleUrls: ['./nos-projets.component.css']
})
export class NosProjetsComponent {
  activeFilter: string = 'all';

  setFilter(filter: string): void {
    this.activeFilter = filter;
  }
}
