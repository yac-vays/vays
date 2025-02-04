export var getWidthOfText = function (text: string, styles: any) {
  var element = document.createElement('div');
  var styleKeys = Object.keys(styles);
  for (var i: number = 0, n = styleKeys.length; i < n; ++i) {
    element.style[styleKeys[i] as string] = styles[styleKeys[i] as string];
  }

  element.style.display = 'inline-block';
  element.innerHTML = text;
  document.body.appendChild(element);
  var width = element.offsetWidth;
  document.body.removeChild(element);
  return width;
};
