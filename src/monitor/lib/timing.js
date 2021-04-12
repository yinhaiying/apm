// 前端性能数据的采集

/*
connectEnd: 1618237905884
connectStart: 1618237905883
domComplete: 1618237906065
domContentLoadedEventEnd: 1618237906018
domContentLoadedEventStart: 1618237906017
domInteractive: 1618237906010
domLoading: 1618237905906
domainLookupEnd: 1618237905582
domainLookupStart: 1618237905582
fetchStart: 1618237905577
loadEventEnd: 1618237906069
loadEventStart: 1618237906065
navigationStart: 1618237905576
redirectEnd: 0
redirectStart: 0
requestStart: 1618237905884
responseEnd: 1618237905890
responseStart: 1618237905889
secureConnectionStart: 0
unloadEventEnd: 1618237905902
unloadEventStart: 1618237905902
*/
import tracker from "../../utils/tracker.js"
import onload from "../../utils/onload.js"
import getLastEvent from "../../utils/getLastEvent.js"
import getSelector from "../../utils/getSelector.js";

export function timing() {
  let FMP;  // 首次有意义的绘制,
  let LCP;  // 最大程度的绘制

  // 增加一个性能条目的观察者
  new PerformanceObserver((entryList, observer) => {
    let perfEntries = entryList.getEntries();
    console.log("perfEntries:", perfEntries);
    FMP = perfEntries[0];
    observer.disconnect();
  }).observe({ entryTypes: ["element"] });  // 观察页面中有意义的元素

  // 增加一个性能条目的观察者
  new PerformanceObserver((entryList, observer) => {
    let perfEntries = entryList.getEntries();
    console.log("perfEntries:", perfEntries);
    LCP = perfEntries[0];
    observer.disconnect();
  }).observe({ entryTypes: ["largest-contentful-paint"] });  // 观察页面中有意义的元素

  // 增加一个性能条目的观察者
  new PerformanceObserver((entryList, observer) => {
    let firstInput = entryList.getEntries()[0];
    console.log("firstInput:", firstInput)
    let lastEvent = getLastEvent();
    if (firstInput) {
      // processingStart 开始处理的时间
      // startTime 点击的时间
      let inputDelay = firstInput.processingStart - firstInput.startTime;
      let duration = firstInput.duration;  // 处理的耗时
      if (inputDelay > 0 || duration > 0) {
        tracker.send({
          kind: "experience",
          type: "firstInputDelay",  // 首次输入延迟
          inputDelay,
          duration,
          startTime: firstInput.startTime,
          selector: lastEvent ? getSelector(lastEvent.path || lastEvent.target) : ""
        });
      }
    }
    observer.disconnect();
  }).observe({ type: "first-input", buffered: true });  // 用户的第一次交互，可能是点击页面，也可能是输入内容





  onload(function () {
    setTimeout(() => {
      const {
        fetchStart,
        connectStart,
        connectEnd,
        requestStart,
        responseStart,
        responseEnd,
        domLoading,      // 开始解析DOM，表示DOM已经解析完成
        domInteractive,
        domContentLoadedEventStart,
        domContentLoadedEventEnd,
        loadEventStart,  // 开始加载DOM，表示DOM已经解析完成
        loadEventEnd
      } = window.performance.timing;
      tracker.send({
        kind: "experience",
        type: "timing",  // 统计每个阶段的时间
        connectTime: connectEnd - connectStart,  // 连接时间
        ttfbTime: responseStart - requestStart,// 首字节时间
        responseTime: responseEnd - responseStart,  // 响应读取时间
        parseDomTime: loadEventStart - domLoading,   // 解析DOM时间
        domContentLoadedTime: domContentLoadedEventEnd - domContentLoadedEventStart,  // 只是DOM完成的时间
        // load:表示DOM和外联的资源，比如script和link等都加载完成
        timeToInteractive: domInteractive - fetchStart,   // 首次可交互时间，
        loadTime: loadEventStart - fetchStart  // 完成的加载时间
      });
      let FP = performance.getEntriesByName("first-paint")[0];
      let FCP = performance.getEntriesByName("first-contentful-paint")[0];
      tracker.send({
        kind: "experience",
        type: "paint",  // 绘制
        firstPaint: FP.startTime,  // 首次绘制(一般是背景，颜色等)
        firstContentfulPaint: FCP.startTime,  // 首次内容绘制   绘制内容比如文本等
        firstMeanintfulPaint: FMP.startTime,  // 首次有意义的绘制，绘制有意义的元素，通过meaningtimeing属性进行设置
        largestContentfulPaint: LCP.startTime, // 最大内容绘制
      });
    }, 3000)
  })
}


