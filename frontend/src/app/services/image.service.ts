import {
  Injectable,
  inject
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  firstValueFrom
} from 'rxjs';


interface UploadedImageResponse {
  id: number;
  image: string;
  uploaded_at: string;
}


@Injectable({
  providedIn: 'root'
})
export class ImageService {

  private readonly http =
    inject(HttpClient);


  private readonly imageApiUrl =
    'http://127.0.0.1:8000/api/images/';


  // ==========================================
  // UPLOAD IMAGE TO DJANGO
  // ==========================================

  async upload(
    file: File
  ): Promise<{ url: string }> {

    const formData =
      new FormData();


    formData.append(
      'image',
      file,
      file.name ||
        `screenshot-${Date.now()}.png`
    );


    const response =
      await firstValueFrom(
        this.http.post<UploadedImageResponse>(
          this.imageApiUrl,
          formData
        )
      );


    return {
      url: response.image
    };

  }


  // ==========================================
  // DJANGO IMAGES ARE ALREADY PERMANENT URLS
  // ==========================================

  async resolveUrl(
    url: string
  ): Promise<string> {

    return url;

  }


  async resolveHtml(
    html: string
  ): Promise<string> {

    return html;

  }


  normalizeHtml(
    html: string
  ): string {

    return html;

  }


  extractId(
    _url: string
  ): string | null {

    return null;

  }

}