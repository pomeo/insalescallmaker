!function(t){"use strict";function i(i,o){return o?("object"==typeof i?(i=i instanceof jQuery?i:t.$(i),i.parent().length&&(o.persist=i,o.persist.data("modalPersistParent",i.parent()))):i="string"==typeof i||"number"==typeof i?t.$("<div></div>").html(i):t.$("<div></div>").html("UIkit.modal Error: Unsupported data type: "+typeof i),i.appendTo(o.element.find(".uk-modal-dialog")),o):void 0}var o,e=!1,n=t.$html;t.component("modal",{defaults:{keyboard:!0,bgclose:!0,minScrollHeight:150,center:!1},scrollable:!1,transition:!1,init:function(){o||(o=t.$("body"));var i=this;this.transition=t.support.transition,this.paddingdir="padding-"+("left"==t.langdirection?"right":"left"),this.dialog=this.find(".uk-modal-dialog"),this.on("click",".uk-modal-close",function(t){t.preventDefault(),i.hide()}).on("click",function(o){var e=t.$(o.target);e[0]==i.element[0]&&i.options.bgclose&&i.hide()})},toggle:function(){return this[this.isActive()?"hide":"show"]()},show:function(){if(!this.isActive())return e&&e.hide(!0),this.element.removeClass("uk-open").show(),this.resize(),e=this,n.addClass("uk-modal-page").height(),this.element.addClass("uk-open").trigger("show.uk.modal"),t.Utils.checkDisplay(this.dialog,!0),this},hide:function(i){if(this.isActive()){if(!i&&t.support.transition){var o=this;this.one(t.support.transition.end,function(){o._hide()}).removeClass("uk-open")}else this._hide();return this}},resize:function(){var t=o.width();if(this.scrollbarwidth=window.innerWidth-t,o.css(this.paddingdir,this.scrollbarwidth),this.element.css("overflow-y",this.scrollbarwidth?"scroll":"auto"),!this.updateScrollable()&&this.options.center){var i=this.dialog.outerHeight(),e=parseInt(this.dialog.css("margin-top"),10)+parseInt(this.dialog.css("margin-bottom"),10);i+e<window.innerHeight?this.dialog.css({top:window.innerHeight/2-i/2-e}):this.dialog.css({top:""})}},updateScrollable:function(){var t=this.dialog.find(".uk-overflow-container:visible:first");if(t.length){t.css("height",0);var i=Math.abs(parseInt(this.dialog.css("margin-top"),10)),o=this.dialog.outerHeight(),e=window.innerHeight,n=e-2*(20>i?20:i)-o;return t.css("height",n<this.options.minScrollHeight?"":n),!0}return!1},_hide:function(){this.element.hide().removeClass("uk-open"),n.removeClass("uk-modal-page"),o.css(this.paddingdir,""),e===this&&(e=!1),this.trigger("hide.uk.modal")},isActive:function(){return e==this}}),t.component("modalTrigger",{boot:function(){t.$html.on("click.modal.uikit","[data-uk-modal]",function(i){var o=t.$(this);if(o.is("a")&&i.preventDefault(),!o.data("modalTrigger")){var e=t.modalTrigger(o,t.Utils.options(o.attr("data-uk-modal")));e.show()}}),t.$html.on("keydown.modal.uikit",function(t){e&&27===t.keyCode&&e.options.keyboard&&(t.preventDefault(),e.hide())}),t.$win.on("resize orientationchange",t.Utils.debounce(function(){e&&e.resize()},150))},init:function(){var i=this;this.options=t.$.extend({target:i.element.is("a")?i.element.attr("href"):!1},this.options),this.modal=t.modal(this.options.target,this.options),this.on("click",function(t){t.preventDefault(),i.show()}),this.proxy(this.modal,"show hide isActive")}}),t.modal.dialog=function(o,e){var n=t.modal(t.$(t.modal.dialog.template).appendTo("body"),e);return n.on("hide.uk.modal",function(){n.persist&&(n.persist.appendTo(n.persist.data("modalPersistParent")),n.persist=!1),n.element.remove()}),i(o,n),n},t.modal.dialog.template='<div class="uk-modal"><div class="uk-modal-dialog" style="min-height:0;"></div></div>',t.modal.alert=function(i,o){t.modal.dialog(['<div class="uk-margin uk-modal-content">'+String(i)+"</div>",'<div class="uk-modal-footer uk-text-right"><button class="uk-button uk-button-primary uk-modal-close">Ok</button></div>'].join(""),t.$.extend({bgclose:!1,keyboard:!1},o)).show()},t.modal.confirm=function(i,o,e){o=t.$.isFunction(o)?o:function(){};var n=t.modal.dialog(['<div class="uk-margin uk-modal-content">'+String(i)+"</div>",'<div class="uk-modal-footer uk-text-right"><button class="uk-button uk-button-primary js-modal-confirm">Ok</button> <button class="uk-button uk-modal-close">Cancel</button></div>'].join(""),t.$.extend({bgclose:!1,keyboard:!1},e));n.element.find(".js-modal-confirm").on("click",function(){o(),n.hide()}),n.show()}}(UIkit);
//# sourceMappingURL=/js//maps/core/modal.js.map