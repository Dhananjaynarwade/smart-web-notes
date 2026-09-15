import {
  Injectable,
  inject,
  signal
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  firstValueFrom
} from 'rxjs';


interface ApiFolder {
  id: number;
  name: string;
  created_at: string;
}


@Injectable({
  providedIn: 'root'
})
export class FolderService {

  private readonly http =
    inject(HttpClient);


  private readonly apiUrl =
    'http://127.0.0.1:8000/api/folders/';


  // ==========================================
  // PROTECTED FOLDER
  // ==========================================

  // Only All Notes cannot be renamed/deleted.
  private readonly defaultFolders = [
    'All Notes'
  ];


  // ==========================================
  // FOLDERS
  // ==========================================

  readonly folders =
    signal<string[]>([
      'All Notes'
    ]);


  // ==========================================
  // SELECTED FOLDER
  // ==========================================

  readonly selectedFolder =
    signal('All Notes');


  constructor() {

    void this.loadFolders();

  }


  // ==========================================
  // LOAD FOLDERS FROM DJANGO
  // ==========================================

  async loadFolders(): Promise<void> {

    try {

      const apiFolders =
        await firstValueFrom(
          this.http.get<ApiFolder[]>(
            this.apiUrl
          )
        );


      const savedNames =
        apiFolders.map(
          folder => folder.name
        );


      // All Notes always stays first.
      const allFolders = [
        'All Notes',
        ...savedNames.filter(
          name =>
            name.toLowerCase() !==
            'all notes'
        )
      ];


      this.folders.set(
        Array.from(
          new Set(allFolders)
        )
      );


      // If selected folder was deleted,
      // return safely to All Notes.
      if (
        !this.folders().includes(
          this.selectedFolder()
        )
      ) {

        this.selectedFolder.set(
          'All Notes'
        );

      }


    } catch (error) {

      console.error(
        'Failed to load folders:',
        error
      );

    }

  }


  // ==========================================
  // CHECK PROTECTED FOLDER
  // ==========================================

  isDefaultFolder(
    folder: string
  ): boolean {

    return this.defaultFolders
      .some(
        item =>
          item.toLowerCase() ===
          folder.toLowerCase()
      );

  }


  // ==========================================
  // SELECT FOLDER
  // ==========================================

  selectFolder(
    folder: string
  ): void {

    this.selectedFolder.set(
      folder
    );

  }


  // ==========================================
  // CREATE FOLDER
  // ==========================================

  async addFolder(
    folderName: string
  ): Promise<string | null> {

    const name =
      folderName.trim();


    if (!name) {
      return null;
    }


    const existingFolder =
      this.folders()
        .find(
          folder =>
            folder.toLowerCase() ===
            name.toLowerCase()
        );


    // Folder already exists
    if (existingFolder) {

      this.selectFolder(
        existingFolder
      );

      return existingFolder;

    }


    try {

      const createdFolder =
        await firstValueFrom(
          this.http.post<ApiFolder>(
            this.apiUrl,
            {
              name
            }
          )
        );


      this.folders.update(
        folders => [
          ...folders,
          createdFolder.name
        ]
      );


      this.selectFolder(
        createdFolder.name
      );


      return createdFolder.name;


    } catch (error) {

      console.error(
        'Folder creation failed:',
        error
      );

      return null;

    }

  }


  // ==========================================
  // RENAME FOLDER
  // ==========================================

  async renameFolder(
    oldName: string,
    newName: string
  ): Promise<boolean> {

    // Never rename All Notes
    if (
      this.isDefaultFolder(oldName)
    ) {
      return false;
    }


    const cleanName =
      newName.trim();


    if (!cleanName) {
      return false;
    }


    // Same name
    if (
      oldName.toLowerCase() ===
      cleanName.toLowerCase()
    ) {
      return false;
    }


    // Prevent duplicate names
    const alreadyExists =
      this.folders()
        .some(
          folder =>
            folder.toLowerCase() ===
            cleanName.toLowerCase()
        );


    if (alreadyExists) {
      return false;
    }


    try {

      const apiFolders =
        await firstValueFrom(
          this.http.get<ApiFolder[]>(
            this.apiUrl
          )
        );


      const folder =
        apiFolders.find(
          item =>
            item.name === oldName
        );


      if (!folder) {

        console.warn(
          'Folder not found in Django:',
          oldName
        );

        return false;

      }


      const updatedFolder =
        await firstValueFrom(
          this.http.patch<ApiFolder>(
            `${this.apiUrl}${folder.id}/`,
            {
              name: cleanName
            }
          )
        );


      this.folders.update(
        folders =>
          folders.map(
            item =>
              item === oldName
                ? updatedFolder.name
                : item
          )
      );


      if (
        this.selectedFolder() ===
        oldName
      ) {

        this.selectedFolder.set(
          updatedFolder.name
        );

      }


      return true;


    } catch (error) {

      console.error(
        'Folder rename failed:',
        error
      );

      return false;

    }

  }


  // ==========================================
  // DELETE FOLDER
  // ==========================================

  async deleteFolder(
    folderName: string
  ): Promise<boolean> {

    // Never delete All Notes
    if (
      this.isDefaultFolder(folderName)
    ) {
      return false;
    }


    try {

      const apiFolders =
        await firstValueFrom(
          this.http.get<ApiFolder[]>(
            this.apiUrl
          )
        );


      const folder =
        apiFolders.find(
          item =>
            item.name === folderName
        );


      if (!folder) {

        console.warn(
          'Folder not found in Django:',
          folderName
        );

        return false;

      }


      await firstValueFrom(
        this.http.delete(
          `${this.apiUrl}${folder.id}/`
        )
      );


      this.folders.update(
        folders =>
          folders.filter(
            item =>
              item !== folderName
          )
      );


      if (
        this.selectedFolder() ===
        folderName
      ) {

        this.selectedFolder.set(
          'All Notes'
        );

      }


      return true;


    } catch (error) {

      console.error(
        'Folder delete failed:',
        error
      );

      return false;

    }

  }

}