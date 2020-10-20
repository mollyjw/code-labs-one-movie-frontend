import { Router } from '@angular/router';
import { Review } from 'src/app/shared/services/models/review';
import { Component, OnInit, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-single-review-card',
  templateUrl: './single-review-card.component.html',
  styleUrls: ['./single-review-card.component.scss']
})
export class SingleReviewCardComponent implements OnInit, OnChanges {
  @Input() review: Review
  constructor(
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  ngOnChanges() {
  }

}

