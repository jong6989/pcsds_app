!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):(e=e||self).firebase=t()}(this,function(){"use strict";var o=function(e,t){return(o=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var r in t)t.hasOwnProperty(r)&&(e[r]=t[r])})(e,t)};var r=function(){return(r=Object.assign||function(e){for(var t,r=1,n=arguments.length;r<n;r++)for(var i in t=arguments[r])Object.prototype.hasOwnProperty.call(t,i)&&(e[i]=t[i]);return e}).apply(this,arguments)};function d(e,t){if(!(t instanceof Object))return t;switch(t.constructor){case Date:return new Date(t.getTime());case Object:void 0===e&&(e={});break;case Array:e=[];break;default:return t}for(var r in t)t.hasOwnProperty(r)&&(e[r]=d(e[r],t[r]));return e}function n(e,t,r){e[t]=r}var l=function(n){function i(e,t){var r=n.call(this,t)||this;return r.code=e,r.name="FirebaseError",Object.setPrototypeOf(r,i.prototype),Error.captureStackTrace&&Error.captureStackTrace(r,s.prototype.create),r}return function(e,t){function r(){this.constructor=e}o(e,t),e.prototype=null===t?Object.create(t):(r.prototype=t.prototype,new r)}(i,n),i}(Error),s=function(){function e(e,t,r){this.service=e,this.serviceName=t,this.errors=r}return e.prototype.create=function(e,t){void 0===t&&(t={});for(var n,r=this.service+"/"+e,i=this.errors[e],o=i?(n=t,i.replace(f,function(e,t){var r=n[t];return null!=r?r.toString():"<"+t+"?>"})):"Error",s=this.serviceName+": "+o+" ("+r+").",a=new l(r,s),c=0,u=Object.keys(t);c<u.length;c++){var p=u[c];"_"!==p.slice(-1)&&(p in a&&console.warn('Overwriting FirebaseError base field "'+p+'" can cause unexpected behavior.'),a[p]=t[p])}return a},e}();var f=/\{\$([^}]+)}/g;function i(e,t){var r=new a(e,t);return r.subscribe.bind(r)}var e,a=function(){function e(e,t){var r=this;this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(function(){e(r)}).catch(function(e){r.error(e)})}return e.prototype.next=function(t){this.forEachObserver(function(e){e.next(t)})},e.prototype.error=function(t){this.forEachObserver(function(e){e.error(t)}),this.close(t)},e.prototype.complete=function(){this.forEachObserver(function(e){e.complete()}),this.close()},e.prototype.subscribe=function(e,t,r){var n,i=this;if(void 0===e&&void 0===t&&void 0===r)throw new Error("Missing Observer.");void 0===(n=function(e,t){if("object"!=typeof e||null===e)return!1;for(var r=0,n=t;r<n.length;r++){var i=n[r];if(i in e&&"function"==typeof e[i])return!0}return!1}(e,["next","error","complete"])?e:{next:e,error:t,complete:r}).next&&(n.next=c),void 0===n.error&&(n.error=c),void 0===n.complete&&(n.complete=c);var o=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(function(){try{i.finalError?n.error(i.finalError):n.complete()}catch(e){}}),this.observers.push(n),o},e.prototype.unsubscribeOne=function(e){void 0!==this.observers&&void 0!==this.observers[e]&&(delete this.observers[e],this.observerCount-=1,0===this.observerCount&&void 0!==this.onNoObservers&&this.onNoObservers(this))},e.prototype.forEachObserver=function(e){if(!this.finalized)for(var t=0;t<this.observers.length;t++)this.sendOne(t,e)},e.prototype.sendOne=function(e,t){var r=this;this.task.then(function(){if(void 0!==r.observers&&void 0!==r.observers[e])try{t(r.observers[e])}catch(e){"undefined"!=typeof console&&console.error&&console.error(e)}})},e.prototype.close=function(e){var t=this;this.finalized||(this.finalized=!0,void 0!==e&&(this.finalError=e),this.task.then(function(){t.observers=void 0,t.onNoObservers=void 0}))},e}();function c(){}var t=((e={})["no-app"]="No Firebase App '{$name}' has been created - call Firebase App.initializeApp()",e["bad-app-name"]="Illegal App name: '{$name}",e["duplicate-app"]="Firebase App named '{$name}' already exists",e["app-deleted"]="Firebase App named '{$name}' already deleted",e["duplicate-service"]="Firebase service named '{$name}' already registered",e["invalid-app-argument"]="firebase.{$name}() takes either no argument or a Firebase App instance.",e),u=new s("app","Firebase",t);function v(e,t){throw u.create(e,t)}var b="[DEFAULT]",p=[],h=function(){function e(e,t,r){this.firebase_=r,this.isDeleted_=!1,this.services_={},this.name_=t.name,this.automaticDataCollectionEnabled_=t.automaticDataCollectionEnabled||!1,this.options_=d(void 0,e),this.INTERNAL={getUid:function(){return null},getToken:function(){return Promise.resolve(null)},addAuthTokenListener:function(e){p.push(e),setTimeout(function(){return e(null)},0)},removeAuthTokenListener:function(t){p=p.filter(function(e){return e!==t})}}}return Object.defineProperty(e.prototype,"automaticDataCollectionEnabled",{get:function(){return this.checkDestroyed_(),this.automaticDataCollectionEnabled_},set:function(e){this.checkDestroyed_(),this.automaticDataCollectionEnabled_=e},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"name",{get:function(){return this.checkDestroyed_(),this.name_},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"options",{get:function(){return this.checkDestroyed_(),this.options_},enumerable:!0,configurable:!0}),e.prototype.delete=function(){var a=this;return new Promise(function(e){a.checkDestroyed_(),e()}).then(function(){a.firebase_.INTERNAL.removeApp(a.name_);for(var e=[],t=0,r=Object.keys(a.services_);t<r.length;t++)for(var n=r[t],i=0,o=Object.keys(a.services_[n]);i<o.length;i++){var s=o[i];e.push(a.services_[n][s])}return Promise.all(e.map(function(e){return e.INTERNAL.delete()}))}).then(function(){a.isDeleted_=!0,a.services_={}})},e.prototype._getService=function(e,t){if(void 0===t&&(t=b),this.checkDestroyed_(),this.services_[e]||(this.services_[e]={}),!this.services_[e][t]){var r=t!==b?t:void 0,n=this.firebase_.INTERNAL.factories[e](this,this.extendApp.bind(this),r);this.services_[e][t]=n}return this.services_[e][t]},e.prototype.extendApp=function(e){var t=this;d(this,e),e.INTERNAL&&e.INTERNAL.addAuthTokenListener&&(p.forEach(function(e){t.INTERNAL.addAuthTokenListener(e)}),p=[])},e.prototype.checkDestroyed_=function(){this.isDeleted_&&v("app-deleted",{name:this.name_})},e}();function m(e,t){return Object.prototype.hasOwnProperty.call(e,t)}h.prototype.name&&h.prototype.options||h.prototype.delete||console.log("dc");var y=!1;try{y="[object process]"===Object.prototype.toString.call(global.process)}catch(e){}if(y&&console.warn('\nWarning: This is a browser-targeted Firebase bundle but it appears it is being\nrun in a Node environment.  If running in a Node environment, make sure you\nare using the bundle specified by the "main" field in package.json.\n\nIf you are using Webpack, you can specify "main" as the first item in\n"resolve.mainFields":\nhttps://webpack.js.org/configuration/resolve/#resolvemainfields\n\nIf using Rollup, use the rollup-plugin-node-resolve plugin and set "module"\nto false and "main" to true:\nhttps://github.com/rollup/rollup-plugin-node-resolve\n'),self&&"firebase"in self){console.warn("\n    Warning: Firebase is already defined in the global scope. Please make sure\n    Firebase library is only loaded once.\n  ");var g=self.firebase.SDK_VERSION;g&&0<=g.indexOf("LITE")&&console.warn("\n    Warning: You are trying to load Firebase while using Firebase Performance standalone script.\n    You should load Firebase Performance with this instance of Firebase to avoid loading duplicate code.\n    ")}return function e(){var t=function(s){var a={},c={},u={},p={__esModule:!0,initializeApp:function(e,t){if(void 0===t&&(t={}),"object"!=typeof t||null===t){var r=t;t={name:r}}var n=t;void 0===n.name&&(n.name=b);var i=n.name;"string"==typeof i&&i||v("bad-app-name",{name:String(i)}),m(a,i)&&v("duplicate-app",{name:i});var o=new s(e,n,p);return h(a[i]=o,"create"),o},app:l,apps:null,SDK_VERSION:"6.0.1",INTERNAL:{registerService:function(r,e,t,n,i){function o(e){return void 0===e&&(e=l()),"function"!=typeof e[r]&&v("invalid-app-argument",{name:r}),e[r]()}return void 0===i&&(i=!1),c[r]&&v("duplicate-service",{name:r}),c[r]=e,n&&(u[r]=n,f().forEach(function(e){n("create",e)})),void 0!==t&&d(o,t),p[r]=o,s.prototype[r]=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];return this._getService.bind(this,r).apply(this,i?e:[])},o},removeApp:function(e){h(a[e],"delete"),delete a[e]},factories:c,useAsService:o}};function l(e){return m(a,e=e||b)||v("no-app",{name:e}),a[e]}function f(){return Object.keys(a).map(function(e){return a[e]})}function h(e,t){for(var r=0,n=Object.keys(c);r<n.length;r++){var i=o(0,n[r]);if(null===i)return;u[i]&&u[i](t,e)}}function o(e,t){return"serverAuth"===t?null:t}return n(p,"default",p),Object.defineProperty(p,"apps",{get:f}),n(l,"App",s),p}(h);return t.INTERNAL=r({},t.INTERNAL,{createFirebaseNamespace:e,extendNamespace:function(e){d(t,e)},createSubscribe:i,ErrorFactory:s,deepExtend:d}),t}()});
//# sourceMappingURL=firebase-app.js.map