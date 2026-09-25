import {
  Component,
  HostListener,
  inject,
  signal
} from '@angular/core';

import {
  NavigationEnd,
  Router,
  RouterOutlet
} from '@angular/router';

import {
  filter
} from 'rxjs';

import {
  NavbarComponent
} from '../../components/navbar/navbar.component';

import {
  SidebarComponent
} from '../../components/sidebar/sidebar.component';

import {
  FolderService
} from '../../services/folder.service';


@Component({
  selector: 'app-dashboard-layout',

  imports: [
    RouterOutlet,
    NavbarComponent,
    SidebarComponent
  ],

  templateUrl:
    './dashboard-layout.component.html',

  styleUrl:
    './dashboard-layout.component.scss',
})

export class DashboardLayoutComponent {

  /* =========================================
     SERVICES
  ========================================= */

  readonly folderService =
    inject(FolderService);

  private readonly router =
    inject(Router);


  /* =========================================
     SIDEBAR STATE

     Laptop:
     open by default

     Phone:
     closed by default
  ========================================= */

  readonly sidebarOpen =
    signal(
      window.innerWidth > 768
    );


  /* =========================================
     CONSTRUCTOR

     On phone:
     automatically close sidebar
     after navigating to another page.
  ========================================= */

  constructor() {

    this.router.events
      .pipe(
        filter(
          event =>
            event instanceof NavigationEnd
        )
      )
      .subscribe(() => {

        if (
          window.innerWidth <= 768
        ) {

          this.sidebarOpen.set(false);

        }

      });

  }


  /* =========================================
     TOGGLE SIDEBAR
  ========================================= */

  toggleSidebar(): void {

    this.sidebarOpen.update(
      value => !value
    );

  }


  /* =========================================
     CLOSE SIDEBAR
  ========================================= */

  closeSidebar(): void {

    this.sidebarOpen.set(false);

  }


  /* =========================================
     WINDOW RESIZE
  ========================================= */

  @HostListener(
    'window:resize'
  )

  onWindowResize(): void {

    /*
      If user changes from phone
      to laptop size, show sidebar.

      If user changes from laptop
      to phone size, hide sidebar.
    */

    if (
      window.innerWidth <= 768
    ) {

      this.sidebarOpen.set(false);

    } else {

      this.sidebarOpen.set(true);

    }

  }


  /* =========================================
     SELECT FOLDER
  ========================================= */

  selectFolder(
    folder: string
  ): void {

    this.folderService.selectFolder(
      folder
    );


    /*
      On mobile, close sidebar
      after selecting folder.
    */

    if (
      window.innerWidth <= 768
    ) {

      this.closeSidebar();

    }

  }

}