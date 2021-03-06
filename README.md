# flex-carousel

> Pure react carousel

[![NPM](https://img.shields.io/npm/v/flex-carousel.svg)](https://www.npmjs.com/package/flex-carousel) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save flex-carousel
```

## Usage

```tsx
import React, { Component } from 'react'

import { Carousel, Controls, Slider } from 'flex-carousel'

const colors = ['red', 'green', 'blue']

export default class App extends Component {
  handleAfterSlide = (prevIndex, currentIndex) => {
    console.log(prevIndex, currentIndex)
  }
  render() {
    return (
      <Carousel
        slideIndex={2}
        afterSlide={this.handleAfterSlide}
        items={colors.map((color, index) => (
          <div className="slider-item" style={{ backgroundColor: color }}>
            Slide {index}
          </div>
        ))}
      >
        <div id="slider">
          <Slider />
        </div>
        <div id="slide-controls">
          <Controls>
            {({ slideNext, slidePrev, slideCount, slideIndex }) => (
              <div>
                <button onClick={slidePrev}>Prev</button>
                <span>
                  {slideIndex} / {slideCount}
                </span>
                <button onClick={slideNext}>Next</button>
              </div>
            )}
          </Controls>
        </div>
      </Carousel>
    )
  }
}
```

## License

MIT © [enestufekci](https://github.com/enestufekci)
