# apm 前端监控系统

## 一.前端监控目标

#### 1.1 稳定性(stability)

| 错误名称 | 描述                            |
| -------- | ------------------------------- |
| js 错误  | js 执行错误或者 promise 异常    |
| 资源异常 | script 或者 link 等资源加载异常 |
| 接口错误 | ajax 或者 fetch 请求接口异常    |
| 白屏     | 页面空白                        |

#### 1.2 用户体验(experience)

| 错误名称                           | 描述                                                                                                                   |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 加载时间                           | 各个阶段的加载时间                                                                                                     |
| TTFB(time to first byte)首字节时间 | 是浏览器发起第一个请求到返回第一个字节的时间。这个时间包含了网络请求时间，后端处理时间，以及第一个字节渲染到页面的时间 |
| FP(first paint)首次绘制的时间      | 首次绘制包括了任何用户的自定义背景绘制，它是将第一个像素点绘制到屏幕的时刻。                                           |
| FCP                                |                                                                                                                        |
| FMP                                |                                                                                                                        |
| FID                                |                                                                                                                        |

#### 1.3 业务(business)

| 错误名称      | 描述                             |
| ------------- | -------------------------------- |
| PV(page view) | 页面浏览器或者点击量             |
| UV            | 访问某个站点的不同 ip 地址的人数 |
| 页面停留时间  | 用户在每一个页面的停留时间       |

## 二.前端监控流程

1. 前端埋点
2. 数据上报
3. 分析和计算。将采集到的数据进行加工和处理
4. 可视化展示。将数据按照各种维度进行展示
5. 监控报警。发现问题后按照一定的条件出发报警

## 三. 编写监控采集脚本

### 监控错误

#### 3.1 错误分类

##### 3.1.1 js 错误

js 错误主要分为两种:`js` 错误和`promise` 异常。

**js 错误的收集**

1. 正常的 js 报错。

```js
window.addEventListener("error", (event) => {
  // 获取到最后一个交互事件
  let lastEvent = getLastEvent();
  let log = {
    kind: "stability", // 监控指标的大类
    type: "error", // 小类型  错误
    errorType: "jsError", // 错误类型  js错误
    url: "", // 访问哪个页面报错
    message: event.message, // 报错信息
    filename: event.filename, // 报错文件
    position: `${event.lineno}:${event.colno}`,
    stack: getLines(event.error.stack),
    // body div#container div.content input
    selector: lastEvent ? getSelector(lastEvent.path) : "", // 最后一个操作的元素
  };
});
```

2. promise 的未捕获的异常
   由于`promise`的异常时异步的，通过`window.onerror`无法进行捕获，需要通过专门的 api 进行错误捕获，这个事件就是`unhandledrejection`，而且上报的数据中，一些参数也需要进行处理，比如错误原因`reason`，行，列等都需要进行处理。

```js
window.addEventListener("unhandledrejection", (event) => {
  let lastEvent = getLastEvent();
  console.log("event:", event);
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
    message = event.stack.message;
    stack = getLines(event.reason.stack);
  }
  let log = {
    kind: "stability", // 监控指标的大类
    type: "error", // 小类型  错误
    errorType: "promiseError", // 错误类型  js错误
    message, // 报错信息
    filename: filename, // 报错文件
    position: `${line}:${column}`,
    stack,
    // body div#container div.content input
    selector: lastEvent ? getSelector(lastEvent.path) : "", // 最后一个操作的元素
  };
  tracker.send(log);
});
```

##### 3.1.2 资源异常

监听 `onerror` 事件

### 3.2 错误上报

错误上报，实际上就是把我们的`js`对象上传到服务器，这里我们使用了阿里云免费提供的`SLS`日志服务，
这里使用的是 http 进行上报，使用了 cors 解决跨域问题，很多人都使用 img 图片进行上报，可以避免跨域问题，但是缺点
是只支持`GET`请求，不能携带较多的参数。

```js
class SendTracker {
  constructor(url) {
    this.url = `http://${projectName}.${host}/logstores/${logStore}/track`; // 上报路径
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
    console.log("log:", log);
    let list = [log];

    let body = JSON.stringify({ __logs__: list });
    this.xhr.open("POST", this.url, true);
    this.xhr.setRequestHeader("Content-Type", "application/json"); // 请求体类型
    this.xhr.setRequestHeader("x-log-apiversion", "0.6.0"); // 请求版本
    this.xhr.setRequestHeader("x-log-bodyrawsize", body.length); // 请求体大小
    // this.xhr.setRequestHeader("x-log-compresstype", "lz4");
    this.xhr.onload = () => {
      console.log("111:", this.xhr.response);
    };
    this.xhr.onerror = (error) => {
      console.log("222error:", error);
    };
    this.xhr.send(body);
  }
}
```
