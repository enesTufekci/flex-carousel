import * as React from 'react';
import throttle from 'raf-throttle';

const CarouselContext = React.createContext({
  position: 0,
  slideCount: 0,
  items: [],
  frameRef: null,
  sliderWidth: 0,
});

export interface CarouselProps {
  items: (React.ReactType | React.ReactChild)[];
  position?: number;
  speed?: number;
  easing?: string;
  afterSlide?: (prevIndex: number, nextIndex: number) => void;
  itemsToShow?: number;
  wrapAround?: false;
  showOverflow?: boolean;
  slideIndex?: number;
  centered?: boolean;
}

interface CarouselDefaultProps {
  speed: number;
  easing: string;
  afterSlide: (prevIndex: number, nextIndex: number) => void;
  itemsToShow: number;
  wrapAround: boolean;
  showOverflow: boolean;
  slideIndex: number;
  centered: boolean;
}

export interface CarouselControlsProps {
  slideNext: () => void;
  slidePrev: () => void;
  position: number;
  slideCount: number;
  itemsToShow: number;
}

export interface CarouselState extends CarouselDefaultProps, CarouselControlsProps {
  position: number;
  items: (React.ReactType | React.ReactChild)[];
  sliderWidth: number;
  frameRef: any;
  left: number;
  touchEvents: {
    [key: string]: (event: React.TouchEvent<HTMLDivElement>) => void;
  };
  mouseEvents: {
    [key: string]: (event: React.MouseEvent<HTMLDivElement>) => void;
  };
  isDragging: boolean;
  isResizing: boolean;
  shouldNotAnimate: boolean;
}

function getDefaults(props: CarouselProps): CarouselDefaultProps {
  const defaultSpeed = 300;
  const defaultEasing = 'linear';
  return {
    speed: props.speed || defaultSpeed,
    easing: props.easing || defaultEasing,
    afterSlide: props.afterSlide || (() => {}),
    itemsToShow: props.itemsToShow || 1,
    wrapAround: props.wrapAround || false,
    showOverflow: props.showOverflow || false,
    slideIndex: props.slideIndex || 0,
    centered: false,
  };
}

function rearrangeItems(props: CarouselProps, defaultProps: CarouselDefaultProps) {
  const { items } = props;
  const { slideIndex, wrapAround } = defaultProps;
  if (wrapAround) {
    return {
      items: [...items, ...items],
      position: slideIndex + items.length,
    };
  }
  return {
    items,
    position: slideIndex,
  };
}

export class Carousel extends React.Component<CarouselProps, CarouselState> {
  frameRef = React.createRef<HTMLDivElement>();
  draggingStartedAt: number = 0;
  resizeTimeout: any = null;
  afterSlideTimer: any = null;
  isSliding: boolean;

  constructor(props: CarouselProps) {
    super(props);

    const defaultProps = getDefaults(props);
    const { items, position } = rearrangeItems(props, defaultProps);
    this.state = {
      items,
      position,
      frameRef: this.frameRef,
      isDragging: false,
      isResizing: false,
      shouldNotAnimate: false,
      slideCount: props.items.length,
      sliderWidth: 0,
      left: 0,
      slideNext: this.slideNext,
      slidePrev: this.slidePrev,
      touchEvents: this.getTouchEvents(),
      mouseEvents: this.getMouseEvents(),
      ...defaultProps,
    };
  }

  getTouchEvents = (): CarouselState['touchEvents'] => ({
    onTouchStart: event => {
      const { clientX } = event.touches[0];
      this.setDragging(true, clientX);
    },
    onTouchMove: event => {
      const { clientX } = event.touches[0];
      this.handleDragging(clientX);
    },
    onTouchEnd: () => {
      this.setDragging(false, 0);
    },
  });

  getMouseEvents = (): CarouselState['mouseEvents'] => ({
    onMouseDown: event => {
      const { clientX } = event;
      this.setDragging(true, clientX);
    },
    onMouseMove: event => {
      const { clientX } = event;
      this.handleDragging(clientX);
    },
    onMouseUp: () => {
      this.setDragging(false, 0);
    },
  });

  handleDragging = (nextPosition: number) => {
    const { sliderWidth, isDragging, itemsToShow } = this.state;
    const dragDifference = this.draggingStartedAt - nextPosition;
    if (isDragging && !this.isSliding) {
      if (Math.abs(dragDifference) > sliderWidth / itemsToShow / 3) {
        if (dragDifference > 0) {
          this.slideNext();
        } else {
          this.slidePrev();
        }
      } else {
        this.setState({ left: dragDifference });
      }
    }
  };

  slideNext = () => {
    if (!this.isSliding) {
      this.isSliding = true;
      this.handleSlideNext();
    }
  };

  handleSlideNext = () => {
    const { items, itemsToShow, speed, slideIndex, slideCount, wrapAround } = this.state;
    if (!wrapAround && slideIndex >= slideCount - itemsToShow) {
      this.isSliding = false;
      return;
    }
    this.setState(
      state => ({
        position: Math.min(state.position + 1, items.length - itemsToShow),
        left: 0,
        isResizing: false,
        slideIndex: (slideIndex + 1) % slideCount,
      }),
      () => {
        this.setDragging(false, 0);
        const timer = setTimeout(() => {
          clearInterval(timer);
          this.handleWrapNext();
        }, speed);
      },
    );
  };

  handleWrapNext = () => {
    const { items, wrapAround } = this.state;
    if (wrapAround) {
      const clones = items.slice(0, 1);
      const rest = items.slice(1);
      this.setState(
        state => ({
          position: state.position - 1,
          items: [...rest, ...clones],
          shouldNotAnimate: true,
        }),
        this.handleClear,
      );
    } else {
      this.handleClear();
    }
  };

  handleClear = () => {
    this.setDragging(false, 0);
    const timer = setTimeout(() => {
      clearTimeout(timer);
      this.isSliding = false;
      this.setState({
        shouldNotAnimate: false,
      });
    }, 100);
  };

  slidePrev = () => {
    if (!this.isSliding) {
      this.isSliding = true;
      this.handleSlidePrev();
    }
  };

  handleSlidePrev = () => {
    const { speed, slideIndex, slideCount, wrapAround } = this.state;
    if (!wrapAround && slideIndex <= 0) {
      this.isSliding = false;
      return;
    }
    this.setState(
      state => ({
        position: state.position - 1,
        left: 0,
        isResizing: false,
        slideIndex: (slideIndex - 1 + slideCount) % slideCount,
      }),
      () => {
        this.setDragging(false, 0);
        const timer = setTimeout(() => {
          clearInterval(timer);
          this.handleWrapPrev();
        }, speed);
      },
    );
  };

  handleWrapPrev = () => {
    const { items, wrapAround } = this.state;
    if (wrapAround) {
      const clones = items.slice(-1);
      const rest = items.slice(0, items.length - 1);
      this.setState(
        state => ({
          position: state.position + 1,
          items: [...clones, ...rest],
          shouldNotAnimate: true,
        }),
        this.handleClear,
      );
    } else {
      this.handleClear();
    }
  };

  handleAfterSlide = (prevIndex: number) => {
    const { position } = this.state;
    clearTimeout(this.afterSlideTimer);
    if (prevIndex !== position) {
      const { afterSlide, speed } = this.state;
      this.afterSlideTimer = setTimeout(() => {
        clearTimeout(this.afterSlideTimer);
        afterSlide(prevIndex, position);
      }, speed);
    }
  };

  setDragging = (isDragging: boolean, draggingStartedAt: number) => {
    this.setState({ isDragging, left: 0 }, () => (this.draggingStartedAt = draggingStartedAt));
  };

  componentDidMount() {
    this.setSliderWidth();
    window.addEventListener('resize', this.setSliderWidthThrottled);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setSliderWidthThrottled);
  }

  setSliderWidth = () => {
    if (!this.state.isResizing) {
      this.setState({
        isResizing: true,
      });
      this.resizeTimeout = setTimeout(() => {
        clearTimeout(this.resizeTimeout);
        this.setState({
          isResizing: false,
        });
      });
    }
    if (this.frameRef.current) {
      this.setState({ sliderWidth: this.frameRef.current.offsetWidth });
    }
  };

  setSliderWidthThrottled = throttle(this.setSliderWidth);

  render() {
    return <CarouselContext.Provider value={this.state as any}>{this.props.children}</CarouselContext.Provider>;
  }
}

export class Slider extends React.Component {
  static contextType = CarouselContext;

  render() {
    const {
      position,
      items,
      frameRef,
      sliderWidth,
      left,
      touchEvents,
      mouseEvents,
      isDragging,
      isResizing,
      shouldNotAnimate,
      speed,
      itemsToShow,
      showOverflow,
      centered,
      easing,
    } = this.context;

    const railWidth = (sliderWidth / itemsToShow) * items.length;
    const defaultLeft = centered ? sliderWidth / itemsToShow / 2 : 0;
    const railLeft = (-defaultLeft + left + (position * sliderWidth) / itemsToShow) * -1;
    const transitionSpeed = isDragging || isResizing || shouldNotAnimate ? 0 : speed;

    return (
      <div
        {...touchEvents}
        {...mouseEvents}
        ref={frameRef}
        style={{
          overflow: showOverflow ? 'inherit' : 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: `${railWidth}px`,
            marginLeft: `${railLeft}px`,
            transition: `${transitionSpeed}ms ${easing}`,
          }}
        >
          {items.map((Item: React.ReactElement<any>, index: any) => {
            return React.cloneElement(Item, {
              ...Item.props,
              key: index,
              style: {
                ...Item.props.style,
                width: `${sliderWidth / itemsToShow}px`,
              },
            });
          })}
        </div>
      </div>
    );
  }
}

export class Controls extends React.Component<{
  children: (params: any) => React.ReactType;
}> {
  static contextType = CarouselContext;

  render() {
    const { slideNext, slidePrev, slideIndex, slideCount, position } = this.context;
    return this.props.children({
      slideNext,
      slidePrev,
      slideIndex,
      slideCount,
      position,
    });
  }
}
