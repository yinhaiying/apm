let host = "cn-beijing.log.aliyuncs.com";
let projectName = "haiying-apm";
let logStore = "haiying-apm-store";
let userAgent = require("user-agent");



// 可以添加其他额外的数据
function getExtraData() {
  // userid等信息
  return {
    title: document.title,
    url: location.url,
    timestamp: Date.now(),
    userAgent: userAgent.parse(navigator.userAgent).name
  }
}

class SendTracker {
  constructor(url) {
    this.url = `http://${projectName}.${host}/logstores/${logStore}/track`;  // 上报路径
    this.xhr = new XMLHttpRequest();
  }
  send(data = {}) {
    let extraData = getExtraData();
    let log = { ...extraData, ...data };
    // 对象的值不能是数字
    for (let key in log) {
      if (typeof log[key] === "number") {
        log[key] = `${log[key.toString()]}`;
      }
    }
    console.log("log:", log)
    let list = [log]

    let body = JSON.stringify({ __logs__: list });
    this.xhr.open("POST", this.url, true);
    this.xhr.setRequestHeader("Content-Type", "application/json");  // 请求体类型
    this.xhr.setRequestHeader("x-log-apiversion", "0.6.0");  // 请求版本
    this.xhr.setRequestHeader("x-log-bodyrawsize", body.length);  // 请求体大小
    // this.xhr.setRequestHeader("x-log-compresstype", "lz4");
    this.xhr.onload = () => {
      console.log("111:", this.xhr.response)
    }
    this.xhr.onerror = (error) => {
      console.log("222error:", error);
    }
    this.xhr.send(body);
  }
}

export default new SendTracker();
