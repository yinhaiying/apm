import { injectJsError } from "./lib/jserror.js"
import { injectXHR } from "./lib/xhr.js"
import { blankScreen } from "./lib/blankScreen.js"
import { timing } from "./lib/timing.js"
injectJsError();
injectXHR();
blankScreen();
timing();
