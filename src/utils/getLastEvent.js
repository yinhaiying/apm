
/*
用于监听页面中的所有事件，不断替换触发的事件，直到报错，从而获取到最后一个事件的信息
*/

let eventsList = [
  "click",
  "mousemove",
  "mousedown",
  "keydown",
  "mouseover",
]

let lastEvent;
eventsList.forEach((eventType) => {
  document.addEventListener(eventType, (event) => {
    lastEvent = event;
  }, {
    capture: true,   // 在捕获阶段执行
    passive: true,    // 默认不阻止默认事件
  })
})


export default function () {
  return lastEvent;
}
