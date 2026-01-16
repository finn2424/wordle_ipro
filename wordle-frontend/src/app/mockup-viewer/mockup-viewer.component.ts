import { Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
    selector: 'app-mockup-viewer',
    standalone: true,
    imports: [NgOptimizedImage],
    templateUrl: './mockup-viewer.component.html',
    styleUrl: './mockup-viewer.component.scss'
})
export class MockupViewerComponent { }
