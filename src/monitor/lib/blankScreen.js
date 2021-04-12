// 白屏的检测
import tracker from "../../utils/tracker.js"
import onload from "../../utils/onload.js"


export function blankScreen() {
  let wrapperElements = ["body", "html", "#container", ".content"];
  let emptyPoints = 0;
  function getSelector(element) {
    if (element.id) {
      return `#${element.id}`
    } else if (element.className && typeof element.className === "string") {
      return `.${element.className}`
    } else {
      return element.nodeName.toLowerCase();
    }
  }
  function isWrapper(element) {
    let selector = getSelector(element);
    if (wrapperElements.indexOf(selector) !== -1) {
      emptyPoints += 1;
    }
  }
  onload(function () {
    for (let i = 1; i <= 9; i++) {
      // 取垂直方向上1/2处的十个点
      let xElements = document.elementFromPoint(window.innerWidth * i / 10, window.innerHeight / 2);
      // 取水平方向上1/2处的十个点
      let yElements = document.elementFromPoint(window.innerWidth / 2, window.innerHeight * i / 10);
      isWrapper(xElements);
      isWrapper(yElements);
    }
    if (emptyPoints > 16) {
      // 总共18个点，其中大于16个点为body,html等元素，可以任务出现白屏了。
      let centerElements = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      tracker.send({
        kind: "stability",
        type: "blank",
        emptyPoints,
        screen: window.screen.width + "*" + window.screen.height,
        viewPort: window.innerWidth + "*" + window.innerHeight,
        selector: getSelector(centerElements)
      })
    }
  })
}


