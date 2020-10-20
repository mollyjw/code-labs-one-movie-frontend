import { MovieService } from './../../shared/services/movie.service';
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { UserService } from '../../shared/services/user.service';
import { User } from '../../shared/models/user';
import { Router } from '@angular/router';
import { ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';
import Swal from 'sweetalert2';
import { setClassMetadata } from '@angular/core/src/r3_symbols';

@Component({
  selector: 'app-new-movie',
  templateUrl: './new-movie.component.html',
  styleUrls: ['./new-movie.component.scss'],
})
export class NewMovieComponent implements OnInit, OnDestroy {
  form: FormGroup;
  formValues: any;
  submitting = false;
  hasError = false;
  errorMsg: string;
  currentUser: User;
  // Static Movie Ratings List
  movieRatings = [
    { id: 1, val: 'G' },
    { id: 2, val: 'PG' },
    { id: 3, val: 'PG-13' },
    { id: 4, val: 'R' },
    { id: 5, val: 'NC-17' },
  ];
  // s3 Vars
  accessKey: string
  secretKey: string
  // Image Cropper Vars
  imageChangedEvent: any = '';
  croppedImage: any = '';
  @ViewChild('fileInput', { static: false }) fileInput: ElementRef;
  @ViewChild('cropper', { static: false }) cropper: ElementRef;
  @ViewChild(ImageCropperComponent, { static: false })
  imageCropper: ImageCropperComponent;
  private subs = new Subscription();
  constructor(
    private router: Router,
    private fb: FormBuilder,
    private userService: UserService,
    private movieService: MovieService
  ) {
    this.currentUser = this.userService.currentUserValue;
  }

  ngOnInit(): void {
    this.getS3Keys()
    this.createFormControls();
    this.createForm();
  }

  getS3Keys() {
    this.movieService.getUploadCredentials().subscribe(data => {
      if (data) {
        this.accessKey = data.accessKey
        this.secretKey = data.secretKey
      }
    }, error => {
      if (error) {
        console.error(error)
      }
    })
  }

  createFormControls() {
    this.formValues = {
      title: ['', Validators.compose([Validators.required])],
      description: ['', Validators.compose([Validators.required])],
      rating: ['', Validators.compose([Validators.required])],
      releaseDate: ['', Validators.compose([Validators.required])],
      totalGross: [null, Validators.compose([Validators.required])],
      duration: [null, Validators.compose([Validators.required])],
      img: ['', Validators.compose([Validators.required])],
      cast: ['', Validators.compose([Validators.required])],
      director: ['', Validators.compose([Validators.required])],
    };
  }

  createForm() {
    this.form = this.fb.group(this.formValues);
  }

  submitForm() {
    this.hasError = false;
    this.submitting = true;
    if (this.form.invalid) {
      this.hasError = true;
      this.submitting = false;
      return;
    }
    const imgUploadSuccess = this.uploadImage()
    if (imgUploadSuccess) {
      const form = this.form.value;
      const releaseDate = new Date(form.releaseDate)
      const year = releaseDate.getFullYear()
      const params = {
        title: form.title,
        description: form.description,
        rating: 5,
        parental_rating: form.rating,
        release_date: releaseDate,
        year: year,
        total_gross: form.totalGross,
        duration: form.duration,
        image: form.img,
        cast: form.cast,
        director: form.director,
      };
      this.subs.add(
        this.movieService.createMovie(params).subscribe(
          (data) => {
            if (data) {
              this.submitting = false
              Swal.fire({
                icon: 'success',
                title: 'A new movie has been successfully added!',
                showConfirmButton: false,
                timer: 2000
              }).then(() => {
                this.form.reset()
              })
            }
          },
          (error) => {
            if (error) {
              console.log(error);
              this.submitting = false;
              this.hasError = true;
              this.errorMsg =
                'Something went wrong while trying to create that movie!!';
            }
          }
        )
      );
    } else {
      return;
    }
  }

  openFileInput() {
    this.fileInput.nativeElement.click();
  }

  onSelectImage($event: ImageCroppedEvent) {
    this.imageChangedEvent = $event;
  }

  fileChangeEvent(event: any): void {
    this.imageChangedEvent = event;
  }

  // ngx-image-cropper-methods

  onImageCropChanged(event: ImageCroppedEvent) {
    this.croppedImage = event.base64;
  }

  onImageCropClicked() {
    this.form.get('img').setValue(this.croppedImage);
    this.imageChangedEvent = null;
  }

  uploadImage() {
    let title;
    title = this.form.get('title').value; // grabbing the title value from form
    title = title.replace(/\s/g, '-'); // replaces spaces in title w/ '-'
    title = title.toLowerCase(); // Lower Case the title
    const name = title
      ? title
      : this.generateRandomString(14, '0123456789abcd'); // sets img name key or assigns random string
    this.movieService.uploadMovieImage(this.croppedImage, name, this.accessKey, this.secretKey);
    this.form
      .get('img')
      .setValue(
        'https://code-labs-one-movie-images.s3.us-east-2.amazonaws.com/images/' +
          name
      );
    return true;
  }

  generateRandomString(length, chars) {
    let result = '';
    for (let i = length; i > 0; --i) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  imageLoaded() {
    // show cropper
  }

  cropperReady() {
    // cropper ready
  }

  loadImageFailed() {
    // show message
  }

  cancel() {
    this.form.reset();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
