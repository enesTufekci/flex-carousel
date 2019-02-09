import React, { Component } from 'react'

import { Carousel, Controls, Slider } from 'flex-carousel'

const colors = ['red', 'green', 'blue', 'orange', 'teal', 'aquamarine']

// const images = [
//   'https://product-images.cdn.moebel.de/0669b4dc-f2b8-43ab-880f-18f569a12537/31ecc190b80c919bba088a21db2264a3-18441cd-366x275.jpg?quality=85',
//   'https://product-images.cdn.moebel.de/ce6e320b-a471-495b-8793-b47e959b4c0f/daeb61298c31444daa452a956d398583-1839b5d-366x275.jpg?quality=85',
//   'https://product-images.cdn.moebel.de/0669b4dc-f2b8-43ab-880f-18f569a12537/7e05f9ac84fc6c6e6862cc5080621fc6-1ca24b9-366x275.jpg?quality=85',
//   'https://product-images.cdn.moebel.de/0669b4dc-f2b8-43ab-880f-18f569a12537/f4fcd8b817e13eb5e6bc342cf3bd67b4-1f9878f-366x275.jpg?quality=85',
//   'https://product-images.cdn.moebel.de/890295e8-6b80-4c74-a6a6-e28af4f278a0/ca3bf3485189f1ded3ab7b8265a7864f-18d6e28-366x275.jpg?quality=85'
// ]

export default class App extends Component {
  handleAfterSlide = (prevIndex, currentIndex) => {
    // console.log(prevIndex, currentIndex)
  }
  render() {
    return (
      <div style={{ border: '3px dotted black' }}>
        <Carousel
          itemsToShow={1}
          // slideIndex={0}
          afterSlide={this.handleAfterSlide}
          // showOverflow={true}
          // centered={true}
          wrapAround={true}
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
              {({ slideNext, slidePrev, slideCount, slideIndex, step }) => (
                <div>
                  <button onClick={slidePrev}>Prev</button>
                  <span>
                    {step} -- {slideIndex} / {slideCount}
                  </span>
                  <button onClick={slideNext}>Next</button>
                </div>
              )}
            </Controls>
          </div>
        </Carousel>
      </div>
    )
  }
}
