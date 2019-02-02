import * as React from 'react'
import throttle from 'raf-throttle'

const CarouselContext = React.createContext({
  slideIndex: 0,
  slideCount: 0,
  items: [],
  frameRef: null,
  sliderWidth: 0
})

interface CarouselDefaultProps {
  slideIndex: number
  speed: number
  easing: string
  afterSlide: (prevIndex: number, nextIndex: number) => void
  itemsToShow: number
  wrapAround: boolean
  showOverflow: boolean
}

export interface CarouselProps {
  items: (React.ReactType | React.ReactChild)[]
  slideIndex?: number
  speed?: number
  easing?: string
  afterSlide?: (prevIndex: number, nextIndex: number) => void
  itemsToShow?: number
  wrapAround?: false
  showOverflow?: boolean
}

export interface CarouselControlsProps {
  slideNext: () => void
  slidePrev: () => void
  slideIndex: number
  slideCount: number
  itemsToShow: number
}

export interface CarouselState
  extends CarouselDefaultProps,
    CarouselControlsProps {
  items: (React.ReactType | React.ReactChild)[]
  sliderWidth: number
  frameRef: any
  left: number
  touchEvents: {
    [key: string]: (event: React.TouchEvent<HTMLDivElement>) => void
  }
  mouseEvents: {
    [key: string]: (event: React.MouseEvent<HTMLDivElement>) => void
  }
  isDragging: boolean
  isResizing: boolean
}

function getDefaults(props: CarouselProps): CarouselDefaultProps {
  const defaultSpeed = 300
  const defaultEasing = 'linear'
  return {
    speed: props.speed || defaultSpeed,
    easing: props.easing || defaultEasing,
    slideIndex: props.slideIndex || 0,
    afterSlide: props.afterSlide || (() => {}),
    itemsToShow: props.itemsToShow || 1,
    wrapAround: props.wrapAround || false,
    showOverflow: props.showOverflow || false
  }
}

export class Carousel extends React.Component<CarouselProps, CarouselState> {
  frameRef = React.createRef<HTMLDivElement>()
  draggingStartedAt: number = 0
  resizeTimeout: any = null
  afterSlideTimer: any = null
  hasTempLeft: boolean = false
  hasTempRight: boolean = false

  constructor(props: CarouselProps) {
    super(props)
    this.state = {
      frameRef: this.frameRef,
      isDragging: false,
      isResizing: false,
      slideCount: props.items.length,
      items: props.items,
      sliderWidth: 0,
      left: 0,

      slideNext: this.slideNext,
      slidePrev: this.slidePrev,
      touchEvents: this.getTouchEvents(),
      mouseEvents: this.getMouseEvents(),
      ...getDefaults(props)
    }
  }

  getTouchEvents = (): CarouselState['touchEvents'] => ({
    onTouchStart: event => {
      const { clientX } = event.touches[0]
      this.setDragging(true, clientX)
    },
    onTouchMove: event => {
      const { clientX } = event.touches[0]
      this.handleDragging(clientX)
    },
    onTouchEnd: () => {
      this.setDragging(false, 0)
    }
  })

  getMouseEvents = (): CarouselState['mouseEvents'] => ({
    onMouseDown: event => {
      const { clientX } = event
      this.setDragging(true, clientX)
    },
    onMouseMove: event => {
      const { clientX } = event
      this.handleDragging(clientX)
    },
    onMouseUp: () => {
      this.setDragging(false, 0)
    }
  })

  handleDragging = (nextPosition: number) => {
    const {
      sliderWidth,
      isDragging,
      slideIndex,
      items,
      wrapAround
    } = this.state
    const diff = this.draggingStartedAt - nextPosition
    if (isDragging) {
      if (wrapAround) {
        if (diff < 0 && slideIndex === 0) {
          this.handleTempLeft()
        }
        if (diff > 0 && slideIndex === items.length - 1) {
          this.handleTempRight()
        }
      }
      if (Math.abs(diff) > sliderWidth / 3) {
        if (diff > 0) {
          this.handleSlideNext()
        } else {
          this.handleSlidePrev()
        }
      } else {
        this.setState({ left: diff })
      }
    }
  }

  handleTempLeft = () => {
    if (!this.hasTempLeft) {
      this.hasTempLeft = true
      const { items, slideIndex } = this.state
      const item = items[items.length - 1]
      const clone = React.cloneElement(item as any, {})
      this.setState({
        items: [clone, ...items],
        slideIndex: slideIndex + 1,
        isResizing: true
      })
    }
  }

  handleTempRight = () => {
    if (!this.hasTempRight) {
      this.hasTempRight = true
      const { items, itemsToShow } = this.state
      const clones = items.slice(0, itemsToShow)
      this.setState({
        items: [...items, ...clones],
        isResizing: true
      })
    }
  }

  slideNext = () => {
    const { slideIndex, items, wrapAround } = this.state
    if (slideIndex === items.length - 1 && wrapAround) {
      this.handleTempRight()
      const timer = setTimeout(() => {
        clearTimeout(timer)
        this.handleSlideNext()
      }, 60)
    } else {
      this.handleSlideNext()
    }
  }

  handleSlideNext = () => {
    const {
      items,
      slideIndex: slideIndexPrev,
      itemsToShow,
      wrapAround
    } = this.state
    this.setState(
      state => ({
        slideIndex: Math.min(state.slideIndex + 1, items.length - 1),
        left: 0,
        isResizing: false
      }),
      () => {
        this.handleAfterSlide(slideIndexPrev)
        this.setDragging(false, 0)
        if (this.hasTempRight && wrapAround) {
          this.hasTempRight = false
          this.setState(
            {
              items: [...items.filter((_, index) => index > itemsToShow - 1)],
              slideIndex: slideIndexPrev - itemsToShow + 1
            },
            () => {
              this.hasTempRight = false
            }
          )
        }
      }
    )
  }

  slidePrev = () => {
    const { slideIndex, wrapAround } = this.state
    if (slideIndex === 0 && wrapAround) {
      this.handleTempLeft()
      const timer = setTimeout(() => {
        clearTimeout(timer)
        this.handleSlidePrev()
      }, 60)
    } else {
      this.handleSlidePrev()
    }
  }

  handleSlidePrev = () => {
    const { slideIndex: slideIndexPrev, items, wrapAround } = this.state
    this.setState(
      state => ({
        slideIndex: Math.max(state.slideIndex - 1, 0),
        left: 0,
        isResizing: false
      }),
      () => {
        this.handleAfterSlide(slideIndexPrev)
        this.setDragging(false, 0)
        if (this.hasTempLeft && wrapAround) {
          this.setState(
            {
              items: [...items.filter((_, index) => index !== items.length - 1)]
            },
            () => {
              this.hasTempLeft = false
            }
          )
        }
      }
    )
  }

  handleAfterSlide = (prevIndex: number) => {
    const { slideIndex } = this.state
    clearTimeout(this.afterSlideTimer)
    if (prevIndex !== slideIndex) {
      const { afterSlide, speed } = this.state
      this.afterSlideTimer = setTimeout(() => {
        clearTimeout(this.afterSlideTimer)
        afterSlide(prevIndex, slideIndex)
      }, speed)
    }
  }

  setDragging = (isDragging: boolean, draggingStartedAt: number) => {
    this.setState(
      { isDragging, left: 0 },
      () => (this.draggingStartedAt = draggingStartedAt)
    )
  }

  componentDidMount() {
    this.setSliderWidth()
    window.addEventListener('resize', this.setSliderWidthThrottled)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setSliderWidthThrottled)
  }

  setSliderWidth = () => {
    if (!this.state.isResizing) {
      this.setState({
        isResizing: true
      })
      this.resizeTimeout = setTimeout(() => {
        clearTimeout(this.resizeTimeout)
        this.setState({
          isResizing: false
        })
      })
    }
    if (this.frameRef.current) {
      this.setState({ sliderWidth: this.frameRef.current.offsetWidth })
    }
  }

  setSliderWidthThrottled = throttle(this.setSliderWidth)

  render() {
    return (
      <CarouselContext.Provider value={this.state as any}>
        {this.props.children}
      </CarouselContext.Provider>
    )
  }
}

export class Slider extends React.Component {
  static contextType = CarouselContext

  render() {
    const {
      slideIndex,
      items,
      frameRef,
      sliderWidth,
      left,
      touchEvents,
      mouseEvents,
      isDragging,
      isResizing,
      speed,
      itemsToShow,
      showOverflow
    } = this.context
    console.log(showOverflow)
    return (
      <div
        {...touchEvents}
        {...mouseEvents}
        ref={frameRef}
        style={{
          overflow: showOverflow ? 'inherit' : 'hidden',
          position: 'relative'
        }}
      >
        <div
          style={{
            width: `${(sliderWidth / itemsToShow) * items.length}px`,
            display: 'flex',
            transition: `${isDragging || isResizing ? 0 : speed}ms linear`,
            marginLeft: `${(left + (slideIndex * sliderWidth) / itemsToShow) *
              -1}px`
          }}
        >
          {items.map((Item: React.ReactElement<any>, index: any) => {
            return React.cloneElement(Item, {
              ...Item.props,
              key: index,
              style: { ...Item.props.style, width: `100%` }
            })
          })}
        </div>
      </div>
    )
  }
}

export class Controls extends React.Component<{
  children: (params: any) => React.ReactType
}> {
  static contextType = CarouselContext

  render() {
    const { slideNext, slidePrev, slideIndex, slideCount } = this.context
    return this.props.children({
      slideNext,
      slidePrev,
      slideIndex,
      slideCount
    })
  }
}
