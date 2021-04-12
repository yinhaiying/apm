// 处理ajax请求的报错
import tracker from "../../utils/tracker.js"

export function injectXHR() {
  let XMLHttpRequet = window.XMLHttpRequest;
  let oldOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, async) {
    if (!url.match(/logstores/)) {
      this.logData = {
        method,
        url,
        async
      }
    }
    return oldOpen.apply(this, arguments)
  }
  let oldSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (body) {
    if (this.logData) {
      let startTime = Date.now();  // 发送之前记录开始时间
      let handler = (type) => {
        return (event) => {
          let duration = Date.now() - startTime;
          let status = this.status;
          let statusText = this.statusText;
          console.log("这里执行了吗")
          tracker.send({
            kind: "stability",
            type: "xhr",
            eventType: type,
            pathname: this.logData.url,
            status: status + "-" + statusText,
            duration,
            response: this.response ? JSON.stringify(this.response) : "",
            params: body || ""
          })
        }
      }
      this.addEventListener("load", handler("load"), false);
      this.addEventListener("error", handler("error"), false);
      this.addEventListener("abort", handler("abort"), false);
    }
    return oldSend.apply(this, arguments)
  }
}
