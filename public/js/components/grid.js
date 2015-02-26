!function(t){var i;window.UIkit&&(i=t(UIkit)),"function"==typeof define&&define.amd&&define("uikit-grid",["uikit"],function(){return i||t(UIkit)})}(function(t){"use strict";function i(t){return e(t)}t.component("grid",{defaults:{colwidth:"auto",animation:!0,duration:300,gutter:0,controls:!1},boot:function(){t.ready(function(i){t.$("[data-uk-grid]",i).each(function(){var i=t.$(this);if(!i.data("grid")){t.grid(i,t.Utils.options(i.attr("data-uk-grid")))}})})},init:function(){var i=this;if(this.element.css({position:"relative"}),this.options.controls){var e=t.$(this.options.controls),n="uk-active";e.on("click","[data-uk-filter]",function(o){o.preventDefault(),i.filter(t.$(this).data("ukFilter")),e.find("[data-uk-filter]").removeClass(n).filter(this).addClass(n)}),e.on("click","[data-uk-sort]",function(o){o.preventDefault();var r=t.$(this).attr("data-uk-sort").split(":");i.sort(r[0],r[1]),e.find("[data-uk-sort]").removeClass(n).filter(this).addClass(n)})}t.$win.on("load resize orientationchange",t.Utils.debounce(function(){this.updateLayout()}.bind(this),100)),this.updateLayout(),this.on("display.uk.check",function(){i.element.is(":visible")&&i.updateLayout()}),t.$html.on("changed.uk.dom",function(){i.updateLayout()})},_prepareElements:function(){var t,i=this.element.children(":not([data-grid-prepared])");i.length&&(t={position:"absolute","box-sizing":"border-box",width:"auto"==this.options.colwidth?"":this.options.colwidth},this.options.gutter&&(t["padding-left"]=this.options.gutter,t["padding-bottom"]=this.options.gutter,this.element.css("margin-left",-1*this.options.gutter)),i.attr("data-grid-prepared","true").css(t))},updateLayout:function(e){this._prepareElements(),e=e||this.element.children(":visible");var n,o,r,a,d,s,h,u,f=this.options.gutter,l=e,p=this.element.width()+2*f+2,c=0,g=0,m=[];this.trigger("beforeupdate.uk.grid",[l]),l.each(function(){for(u=i(this),n=t.$(this),o=u.outerWidth,r=u.outerHeight,c=0,g=0,d=0,h=m.length;h>d;d++)a=m[d],c<=a.aX&&(c=a.aX),c+o>p&&(c=0),g<=a.aY&&(g=a.aY);m.push({ele:n,top:g,left:c,width:o,height:r,aY:g+r,aX:c+o})});var v,b=0;for(d=0,h=m.length;h>d;d++){for(a=m[d],g=0,s=0;d>s;s++)v=m[s],a.left<v.aX&&v.left+1<a.aX&&(g=v.aY);a.top=g,a.aY=g+a.height,b=Math.max(b,a.aY)}b-=f,this.options.animation?(this.element.stop().animate({height:b},100),m.forEach(function(t){t.ele.stop().animate({top:t.top,left:t.left,opacity:1},this.options.duration)}.bind(this))):(this.element.css("height",b),m.forEach(function(t){t.ele.css({top:t.top,left:t.left,opacity:1})}.bind(this))),this.trigger("afterupdate.uk.grid",[l])},filter:function(i){i=i||[],"string"==typeof i&&(i=i.split(/,/).map(function(t){return t.trim()}));var e=this,n=this.element.children(),o={visible:[],hidden:[]};n.each(function(){var e=t.$(this),n=e.attr("data-uk-filter"),r=i.length?!1:!0;n&&(n=n.split(/,/).map(function(t){return t.trim()}),i.forEach(function(t){n.indexOf(t)>-1&&(r=!0)})),o[r?"visible":"hidden"].push(e)}),o.hidden=t.$(o.hidden).map(function(){return this[0]}),o.visible=t.$(o.visible).map(function(){return this[0]}),o.hidden.filter(":visible").fadeOut(this.options.duration),o.visible.filter(":hidden").css("opacity",0).show(),e.updateLayout(o.visible)},sort:function(i,e){e=e||1,"string"==typeof e&&(e="desc"==e.toLowerCase()?-1:1);var n=this.element.children();n.sort(function(n,o){return n=t.$(n),o=t.$(o),(o.data(i)||"")<(n.data(i)||"")?e:-1*e}).appendTo(this.element),this.updateLayout(n.filter(":visible"))}});var e=function(){function t(t){if(t){if("string"==typeof u[t])return t;t=t.charAt(0).toUpperCase()+t.slice(1);for(var i,e=0,n=h.length;n>e;e++)if(i=h[e]+t,"string"==typeof u[i])return i}}function i(t){var i=parseFloat(t),e=-1===t.indexOf("%")&&!isNaN(i);return e&&i}function e(){}function n(){for(var t={width:0,height:0,innerWidth:0,innerHeight:0,outerWidth:0,outerHeight:0},i=0,e=l.length;e>i;i++){var n=l[i];t[n]=0}return t}function o(){if(!p){p=!0;var e=window.getComputedStyle;if(a=function(){var t=e?function(t){return e(t,null)}:function(t){return t.currentStyle};return function(i){var e=t(i);return e||f("Style returned "+e+". Are you running this code in a hidden iframe on Firefox? See http://bit.ly/getsizebug1"),e}}(),d=t("boxSizing")){var n=document.createElement("div");n.style.width="200px",n.style.padding="1px 2px 3px 4px",n.style.borderStyle="solid",n.style.borderWidth="1px 2px 3px 4px",n.style[d]="border-box";var o=document.body||document.documentElement;o.appendChild(n);var r=a(n);s=200===i(r.width),o.removeChild(n)}}}function r(t){if(o(),"string"==typeof t&&(t=document.querySelector(t)),t&&"object"==typeof t&&t.nodeType){var e=a(t);if("none"===e.display)return n();var r={};r.width=t.offsetWidth,r.height=t.offsetHeight;for(var h=r.isBorderBox=!(!d||!e[d]||"border-box"!==e[d]),u=0,f=l.length;f>u;u++){var p=l[u],c=e[p],g=parseFloat(c);r[p]=isNaN(g)?0:g}var m=r.paddingLeft+r.paddingRight,v=r.paddingTop+r.paddingBottom,b=r.marginLeft+r.marginRight,y=r.marginTop+r.marginBottom,k=r.borderLeftWidth+r.borderRightWidth,w=r.borderTopWidth+r.borderBottomWidth,x=h&&s,W=i(e.width);W!==!1&&(r.width=W+(x?0:m+k));var L=i(e.height);return L!==!1&&(r.height=L+(x?0:v+w)),r.innerWidth=r.width-(m+k),r.innerHeight=r.height-(v+w),r.outerWidth=r.width+b,r.outerHeight=r.height+y,r}}var a,d,s,h="Webkit Moz ms Ms O".split(" "),u=document.documentElement.style,f="undefined"==typeof console?e:function(t){console.error(t)},l=["paddingLeft","paddingRight","paddingTop","paddingBottom","marginLeft","marginRight","marginTop","marginBottom","borderLeftWidth","borderRightWidth","borderTopWidth","borderBottomWidth"],p=!1;return r}()});
//# sourceMappingURL=/js//maps/components/grid.js.map