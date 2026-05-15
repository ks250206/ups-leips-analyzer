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
  const source = new XMLSerializer().serializeToString(svg);
  const image = new Image();
  const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = svg.viewBox.baseVal.width || svg.clientWidth;
    canvas.height = svg.viewBox.baseVal.height || svg.clientHeight;
    const context = canvas.getContext("2d");
    context?.drawImage(image, 0, 0);
    URL.revokeObjectURL(url);
    download(`${safeName(title)}.png`, canvas.toDataURL("image/png"));
  };
  image.src = url;
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
