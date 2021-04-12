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

3. 资源加载的错误
   资源加载的错误主要是指`script`,`link`等加载资源时出错。
   这种资源加载的错误，也可以通过监听`onerror`事件来进行收集，也就是说普通的 js 错误和资源加载错误的事件处理，我们都会放到`onerror`的回调中进行处理，因此，需要进行一下区分。

```js
window.addEventListener(
  "error",
  (event) => {
    console.log("jserror报错：", event);
    // 获取到最后一个交互事件
    let lastEvent = getLastEvent();
    // 区分一下是资源加载报错还是js报错
    if (event.target && (event.target.src || event.target.href)) {
      tracker.send({
        kind: "stability", // 监控指标的大类
        type: "error", // 小类型  错误
        errorType: "resourceError", // 错误类型  js或者css资源加载错误我
        message: event.message, // 报错信息
        filename: event.target.src || event.target.href, // 报错文件
        tagName: event.target.tagName,
        selector: lastEvent ? getSelector(lastEvent.path) : "", // 最后一个操作的元素
      });
    } else {
      tracker.send({
        kind: "stability", // 监控指标的大类
        type: "error", // 小类型  错误
        errorType: "jsError", // 错误类型  js错误
        message: event.message, // 报错信息
        filename: event.filename, // 报错文件
        position: `${event.lineno}:${event.colno}`,
        stack: getLines(event.error.stack),
        // body div#container div.content input
        selector: getSelector(event.target), // 最后一个操作的元素
      });
    }
  },
  true
);
```

##### 3.1.2 资源异常

监听 `onerror` 事件

#### 3.2 错误上报

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

### 监控接口异常

接口异常的监控，主要是在接口请求时除了原来的接口请求还要写入一些我们想要的参数，比如计算接口的请求时间，接口的错误类型等信息收集，因此，我们需要重写 ajax 请求的方法。

重写 open 方法，在重写时注入`method`,`url`和`async的参数`。

```js
let XMLHttpRequet = window.XMLHttpRequest;
let oldOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url, async) {
  if (!url.match(/logstores/)) {
    this.logData = {
      method,
      url,
      async,
    };
  }
  return oldOpen.apply(this, arguments);
};
```

重写`send`方法，也就是重写`load`,`error`和`abort`方法

```js
function injectXHR() {
  let oldSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function(body) {
    if (this.logData) {
      let startTime = Date.now(); // 发送之前记录开始时间
      let handler = (type) => {
        return (event) => {
          let duration = Date.now() - startTime;
          let status = this.status;
          let statusText = this.statusText;
          console.log("这里执行了吗");
          tracker.send({
            kind: "stability",
            type: "xhr",
            eventType: type,
            pathname: this.logData.url,
            status: status + "-" + statusText,
            duration,
            response: this.response ? JSON.stringify(this.response) : "",
            params: body || "",
          });
        };
      };
      this.addEventListener("load", handler("load"), false);
      this.addEventListener("error", handler("error"), false);
      this.addEventListener("abort", handler("abort"), false);
    }
    return oldSend.apply(this, arguments);
  };
}
```

最终的完整实现：

```js
export function injectXHR() {
  let XMLHttpRequet = window.XMLHttpRequest;
  let oldOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, async) {
    if (!url.match(/logstores/)) {
      this.logData = {
        method,
        url,
        async,
      };
    }
    return oldOpen.apply(this, arguments);
  };
  let oldSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function(body) {
    if (this.logData) {
      let startTime = Date.now(); // 发送之前记录开始时间
      let handler = (type) => {
        return (event) => {
          let duration = Date.now() - startTime;
          let status = this.status;
          let statusText = this.statusText;
          console.log("这里执行了吗");
          tracker.send({
            kind: "stability",
            type: "xhr",
            eventType: type,
            pathname: this.logData.url,
            status: status + "-" + statusText,
            duration,
            response: this.response ? JSON.stringify(this.response) : "",
            params: body || "",
          });
        };
      };
      this.addEventListener("load", handler("load"), false);
      this.addEventListener("error", handler("error"), false);
      this.addEventListener("abort", handler("abort"), false);
    }
    return oldSend.apply(this, arguments);
  };
}
```

### 监控白屏

监控白屏主要是通过`elementsFromPoint`方法，获取到当前视口内指定坐标处，由里到外排列的所有元素。
白屏的判断规则就是：在垂直位置中间通过`elementsFromPoint`获取到 10 个点，在水平位置中间通过`elementsFromPoint`获取到 10 个点,然后判断这 10 个点中有多少个点是`html`,`body`或者其他的大的元素，而没有出现我们渲染的元素，比如如果大于 16 个，就可以视为是白屏了。

```js
export function blankScreen() {
  let wrapperElements = ["body", "html", "#container", ".content"];
  let emptyPoints = 0;
  function getSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    } else if (element.className && typeof element.className === "string") {
      return `.${element.className}`;
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
  onload(function() {
    for (let i = 1; i <= 9; i++) {
      // 取垂直方向上1/2处的十个点
      let xElements = document.elementFromPoint(
        (window.innerWidth * i) / 10,
        window.innerHeight / 2
      );
      // 取水平方向上1/2处的十个点
      let yElements = document.elementFromPoint(
        window.innerWidth / 2,
        (window.innerHeight * i) / 10
      );
      isWrapper(xElements);
      isWrapper(yElements);
    }
    if (emptyPoints > 16) {
      // 总共18个点，其中大于16个点为body,html等元素，可以任务出现白屏了。
      let centerElements = document.elementFromPoint(
        window.innerWidth / 2,
        window.innerHeight / 2
      );
      tracker.send({
        kind: "stability",
        type: "blank",
        emptyPoints,
        screen: window.screen.width + "*" + window.screen.height,
        viewPort: window.innerWidth + "*" + window.innerHeight,
        selector: getSelector(centerElements),
      });
    }
  });
}
```

这里需要注意的是，我们的 sdk 都是在`head`中进行插入的，也就是先于 dom 加载，但是对于白屏的检测必须等 DOM 加载完毕才能进行处理，因此我们必须在`onload`事件中进行处理。

```js
export default function(callback) {
  if (document.readyState === "complete") {
    callback();
  } else {
    window.addEventListener("load", callback);
  }
}
```

### 加载时间

加载时间等参数都是通过`performance.timing`实现的，最主要的是知道每种时间的计算方式。

```js
export function timing() {
  onload(function() {
    setTimeout(() => {
      const {
        fetchStart,
        connectStart,
        connectEnd,
        requestStart,
        responseStart,
        responseEnd,
        domLoading, // 开始解析DOM，表示DOM已经解析完成
        domInteractive,
        domContentLoadedEventStart,
        domContentLoadedEventEnd,
        loadEventStart, // 开始加载DOM，表示DOM已经解析完成
        loadEventEnd,
      } = window.performance.timing;
      tracker.send({
        kind: "experience",
        type: "timing", // 统计每个阶段的时间
        connectTime: connectEnd - connectStart, // 连接时间
        ttfbTime: responseStart - requestStart, // 首字节时间
        responseTime: responseEnd - responseStart, // 响应读取时间
        parseDomTime: loadEventStart - domLoading, // 解析DOM时间
        domContentLoadedTime:
          domContentLoadedEventEnd - domContentLoadedEventStart, // 只是DOM完成的时间
        // load:表示DOM和外联的资源，比如script和link等都加载完成
        timeToInteractive: domInteractive - fetchStart, // 首次可交互时间，
        loadTime: loadEventStart - fetchStart, // 完成的加载时间
      });
    }, 3000);
  });
}
```

#### FMP 首次有意义的绘制

```js
new PerformanceObserver((entryList, observer) => {
  let perfEntries = entryList.getEntries();
  console.log("perfEntries:", perfEntries);
  FMP = perfEntries[0];
  observer.disconnect();
}).observe({ entryTypes: ["element"] }); // 观察页面中有意义的元素
```

如何判断什么是有意义的绘制？
通过设置`elementtiming`设置属性，可以标记页面中的有意义的元素。

```js
setTimeout(() => {
  let h1 = document.createElement("h1");
  h1.innerHTML = "如何标记页面中有意义的元素";
  h1.setAttribute("elementtiming", "有意义的绘制");
  document.body.appendChild(h1);
}, 3000);
```

#### FID(firstInputDelay) 首次输入延迟的时间

FID：是用户首次交互延迟得到的时间。比如第一次点击或者第一次 input 输入等交互。

```js
new PerformanceObserver((entryList, observer) => {
  let firstInput = entryList.getEntries()[0];
  console.log("firstInput", firstInput);
  let lastEvent = getLastEvent();
  if (firstInput) {
    // processingStart 开始处理的时间
    // startTime 点击的时间
    let inputDelay = firstInput.processingStart - firstInput.startTime;
    let duration = firstInput.duration; // 处理的耗时
    if (inputDelay > 0 || duration > 0) {
      tracker.send({
        kind: "experience",
        type: "firstInputDelay", // 首次输入延迟
        inputDelay,
        duration,
        startTime: firstInput.startTime,
        selector: lastEvent
          ? getSelector(lastEvent.path || lastEvent.target)
          : "",
      });
    }
  }
  observer.disconnect();
}).observe({ type: "first-input", buffered: true }); // 用户的第一次交互，可能是点击页面，也可能是输入内容
```

#### 上报绘制性能指标

```js
    tracker.send({
        kind: "experience",
        type: "paint",  // 绘制
        firstPaint: FP.startTime,  // 首次绘制(一般是背景，颜色等)
        firstContentfulPaint: FCP.startTime,  // 首次内容绘制   绘制内容比如文本等
        firstMeanintfulPaint: FMP.startTime,  // 首次有意义的绘制，绘制有意义的元素，通过meaningtimeing属性进行设置
        largestContentfulPaint: LCP.startTime, // 最大内容绘制
      });
    }, 3000)
```
