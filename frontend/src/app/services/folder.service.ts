import {
  Injectable,
  signal
} from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class FolderService {

  private readonly DEFAULT_FOLDERS: string[] = [
    'All Notes',
    'DevOps',
    'AWS',
    'Python',
    'Angular',
    'Django',
    'Cyber Security',
    'Projects',
    'Personal'
  ];


  readonly folders =
    signal<string[]>([
      ...this.DEFAULT_FOLDERS
    ]);


  readonly selectedFolder =
    signal<string>('All Notes');


  constructor() {

    this.loadFolders();

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
  // CHECK DEFAULT FOLDER
  // ==========================================

  isDefaultFolder(
    folder: string
  ): boolean {

    return this.DEFAULT_FOLDERS.includes(
      folder
    );

  }


  // ==========================================
  // ADD FOLDER
  // ==========================================

  async addFolder(
    folderName: string
  ): Promise<string | null> {

    const cleanName =
      folderName.trim();


    if (!cleanName) {

      return null;

    }


    const exists =
      this.folders().some(
        folder =>
          folder.toLowerCase() ===
          cleanName.toLowerCase()
      );


    if (exists) {

      return null;

    }


    this.folders.update(
      folders => [
        ...folders,
        cleanName
      ]
    );


    this.saveFolders();


    return cleanName;

  }


  // ==========================================
  // RENAME FOLDER
  // ==========================================

  async renameFolder(
    oldName: string,
    newName: string
  ): Promise<boolean> {

    const cleanName =
      newName.trim();


    if (!cleanName) {

      return false;

    }


    if (
      this.isDefaultFolder(
        oldName
      )
    ) {

      return false;

    }


    const duplicate =
      this.folders().some(
        folder =>
          folder !== oldName &&
          folder.toLowerCase() ===
          cleanName.toLowerCase()
      );


    if (duplicate) {

      return false;

    }


    this.folders.update(
      folders =>
        folders.map(
          folder =>
            folder === oldName
              ? cleanName
              : folder
        )
    );


    if (
      this.selectedFolder() ===
      oldName
    ) {

      this.selectedFolder.set(
        cleanName
      );

    }


    this.saveFolders();


    return true;

  }


  // ==========================================
  // DELETE FOLDER
  // ==========================================

  async deleteFolder(
    folderName: string
  ): Promise<boolean> {

    if (
      this.isDefaultFolder(
        folderName
      )
    ) {

      return false;

    }


    const exists =
      this.folders().includes(
        folderName
      );


    if (!exists) {

      return false;

    }


    this.folders.update(
      folders =>
        folders.filter(
          folder =>
            folder !== folderName
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


    this.saveFolders();


    return true;

  }


  // ==========================================
  // SAVE CUSTOM FOLDERS
  // ==========================================

  private saveFolders(): void {

    const customFolders =
      this.folders().filter(
        folder =>
          !this.DEFAULT_FOLDERS.includes(
            folder
          )
      );


    localStorage.setItem(
      'smart-web-notes-folders',
      JSON.stringify(
        customFolders
      )
    );

  }


  // ==========================================
  // LOAD CUSTOM FOLDERS
  // ==========================================

  private loadFolders(): void {

    const saved =
      localStorage.getItem(
        'smart-web-notes-folders'
      );


    if (!saved) {

      return;

    }


    try {

      const customFolders =
        JSON.parse(saved) as string[];


      this.folders.set([
        ...this.DEFAULT_FOLDERS,

        ...customFolders.filter(
          folder =>
            !this.DEFAULT_FOLDERS.includes(
              folder
            )
        )
      ]);


    } catch (error) {

      console.error(
        'Failed to load folders:',
        error
      );

    }

  }

}