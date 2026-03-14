/// <reference types="vite/client" />
/// <reference types="@react-three/fiber" />

import * as React from 'react';
import { ThreeElements } from '@react-three/fiber';

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {
      [elemName: string]: any;
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {
      [elemName: string]: any;
    }
  }
}
