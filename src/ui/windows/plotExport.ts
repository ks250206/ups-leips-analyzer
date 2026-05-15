export function exportSvg(svg: SVGSVGElement | null, title: string): void {
  if (!svg) {
    return;
  }
  const source = new XMLSerializer().serializeToString(svg);
  download(
    `${safeName(title)}.svg`,
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`,
  );
}

export function exportPng(svg: SVGSVGElement | null, title: string): void {
  if (!svg) {
    return;
  }
  void svgToPngBlob(svg).then((blob) => {
    download(`${safeName(title)}.png`, URL.createObjectURL(blob));
  });
}

export function copyPng(svg: SVGSVGElement | null): void {
  if (!svg || !navigator.clipboard || typeof ClipboardItem === "undefined") {
    return;
  }
  void svgToPngBlob(svg).then((blob) => {
    void navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
  });
}

function svgToPngBlob(svg: SVGSVGElement): Promise<Blob> {
  const source = new XMLSerializer().serializeToString(svg);
  const image = new Image();
  const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
  return new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = svg.viewBox.baseVal.width || svg.clientWidth;
      canvas.height = svg.viewBox.baseVal.height || svg.clientHeight;
      const context = canvas.getContext("2d");
      context?.drawImage(image, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error("Failed to create PNG blob."));
      }, "image/png");
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to render SVG image."));
    };
    image.src = url;
  });
}

function download(filename: string, href: string): void {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
}

function safeName(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "plot"
  );
}
