import React, { Component } from 'react'

import { Carousel, Controls, Slider } from 'flex-carousel'

const colors = ['red', 'green', 'blue', 'orange', 'teal']

export default class App extends Component {
  handleAfterSlide = (prevIndex, currentIndex) => {
    console.log(prevIndex, currentIndex)
  }
  render() {
    return (
      <Carousel
        itemsToShow={1}
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
