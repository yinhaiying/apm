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


export function timing() {
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
      })
    }, 3000)
  })
}


