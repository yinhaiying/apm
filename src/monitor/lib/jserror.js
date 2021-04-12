
import getLastEvent from "../../utils/getLastEvent.js"
import getSelector from "../../utils/getSelector.js"
import tracker from "../../utils/tracker.js"

export function injectJsError() {
  // 监听全局未捕获的错误
  window.addEventListener("error", (event) => {
    console.log("jserror报错：", event)
    // 获取到最后一个交互事件
    let lastEvent = getLastEvent();
    // 区分一下是资源加载报错还是js报错
    if (event.target && (event.target.src || event.target.href)) {
      tracker.send({
        kind: "stability",  // 监控指标的大类
        type: "error",  // 小类型  错误
        errorType: "resourceError",  // 错误类型  js或者css资源加载错误我
        message: event.message,  // 报错信息
        filename: event.target.src || event.target.href,  // 报错文件
        tagName: event.target.tagName,
        selector: lastEvent ? getSelector(lastEvent.path) : "",// 最后一个操作的元素
      });
    } else {
      tracker.send({
        kind: "stability",  // 监控指标的大类
        type: "error",  // 小类型  错误
        errorType: "jsError",  // 错误类型  js错误
        message: event.message,  // 报错信息
        filename: event.filename,  // 报错文件
        position: `${event.lineno}:${event.colno}`,
        stack: getLines(event.error.stack),
        // body div#container div.content input
        selector: getSelector(event.target)// 最后一个操作的元素
      });
    }
  }, true);

  // 捕捉promise的错误
  window.addEventListener("unhandledrejection", (event) => {
    let lastEvent = getLastEvent();
    console.log("event:", event)
    let message;
    let filename;
    let line = 0;
    let column = 0;
    let stack = "";
    if (typeof event.reason === "string") {
      // 是promise触发reject导致的报错
      message = event.reason;
    } else if (typeof event.reason === "object") {
      // 是promise中的js语法错误
      if (event.reason.stack) {
        let matchResult = event.reason.stack.match(/at\s+(.+):(\d+):(\d+)/);
        filename = matchResult[1];
        line = matchResult[2];
        column = matchResult[0];
      }
      message = event.reason.message;
      stack = getLines(event.reason.stack)
    }
    let log = {
      kind: "stability",  // 监控指标的大类
      type: "error",  // 小类型  错误
      errorType: "promiseError",  // 错误类型  js错误
      message,  // 报错信息
      filename: filename,  // 报错文件
      position: `${line}:${column}`,
      stack,
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

