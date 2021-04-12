/*
通过捕捉事件，获取到最后一个事件触发的选择器
path: Array(7)
0: input
1: div.content
2: div#container
3: body
4: html
5: document
6: Window

*/

function getSelectors(path) {
  return path.reverse().filter((element) => {
    return element != window && element != document;
  }).map((element) => {
    let selector = "";
    if (element.id) {
      return `${element.nodeName.toLowerCase()}#${element.id}`
    } else if (element.className && typeof element.className === "string") {
      return `${element.nodeName.toLowerCase()}.${element.className}`
    } else {
      selector = element.nodeName.toLowerCase();
      return selector;
    }
  }).join(" ");
}

export default function (path) {
  if (Array.isArray(path)) {
    return getSelectors(path);
  }
}
