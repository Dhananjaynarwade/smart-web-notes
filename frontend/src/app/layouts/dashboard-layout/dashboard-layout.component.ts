import { Component,  inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import {
  FolderService
} from '../../services/folder.service';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, NavbarComponent, SidebarComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss',
})

export class DashboardLayoutComponent {
  readonly folderService =
  inject(FolderService);
  selectFolder(
  folder: string
): void {

  this.folderService.selectFolder(
    folder
  );

}
}
