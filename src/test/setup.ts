import "fake-indexeddb/auto";

Object.defineProperty(globalThis, "devicePixelRatio", {
  configurable: true,
  value: 1,
});

Object.defineProperty(globalThis, "matchMedia", {
  configurable: true,
  value: () => ({
    addEventListener() {},
    addListener() {},
    dispatchEvent: () => false,
    matches: false,
    media: "",
    onchange: null,
    removeEventListener() {},
    removeListener() {},
  }),
});

class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", {
  configurable: true,
  value: TestResizeObserver,
});

class TestPath2D {
  arc() {}
  bezierCurveTo() {}
  closePath() {}
  lineTo() {}
  moveTo() {}
  rect() {}
}

Object.defineProperty(globalThis, "Path2D", {
  configurable: true,
  value: TestPath2D,
});

(HTMLCanvasElement.prototype.getContext as unknown as () => CanvasRenderingContext2D) =
  function getContext(this: HTMLCanvasElement) {
    return {
      beginPath() {},
      clearRect() {},
      clip() {},
      closePath() {},
      fill() {},
      fillRect() {},
      fillText() {},
      lineTo() {},
      measureText: (text: string) => ({ width: text.length * 7 }),
      moveTo() {},
      rect() {},
      restore() {},
      rotate() {},
      save() {},
      scale() {},
      setLineDash() {},
      stroke() {},
      strokeRect() {},
      translate() {},
      arc() {},
      canvas: this,
    } as unknown as CanvasRenderingContext2D;
  };
