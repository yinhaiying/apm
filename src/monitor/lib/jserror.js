
import getLastEvent from "../../utils/getLastEvent.js"
import getSelector from "../../utils/getSelector.js"
import tracker from "../../utils/tracker.js"

export function injectJsError() {
  // 监听全局未捕获的错误
  window.addEventListener("error", (event) => {
    // 获取到最后一个交互事件
    let lastEvent = getLastEvent();
    let log = {
      kind: "stability",  // 监控指标的大类
      type: "error",  // 小类型  错误
      errorType: "jsError",  // 错误类型  js错误
      url: "",  // 访问哪个页面报错
      message: event.message,  // 报错信息
      filename: event.filename,  // 报错文件
      position: `${event.lineno}:${event.colno}`,
      stack: getLines(event.error.stack),
      // body div#container div.content input
      selector: lastEvent ? getSelector(lastEvent.path) : "",// 最后一个操作的元素
    };
    tracker.send(log)
  })
}


function getLines(stack) {
  return stack.split("\n").slice(1).map((item) => {
    return item.replace(/^\s+at\s+/g, "")
  }).join("^")
}

