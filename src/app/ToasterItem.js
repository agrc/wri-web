define([
	'dijit/_TemplatedMixin',
	'dijit/_WidgetBase',

	'dojo/fx/Toggler',
	'dojo/text!app/templates/ToasterItem.html',
	'dojo/_base/declare',
	'dojo/_base/lang'
], function (
	_TemplatedMixin,
	_WidgetBase,

	Toggler,
	template,
	declare,
	lang
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        // description:
        //      a line item in the toaster
        templateString: template,
        baseClass: 'toaster-item',

        // cssPrefix: String
        // the css prefix
        cssPrefix: 'alert-',

        // Properties to be sent into constructor

        // duration: Integer
        //		Number of milliseconds to show message
        duration: 5000,

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.ToasterItem::postCreate', arguments);

            this.toggler = new Toggler({
                node: this.domNode,
                hideDuration: 1000
            });

            this.inherited(arguments);
        },
        show: function () {
            // summary:
            //      shows the item
            //
            console.log('app.ToasterItem:show', arguments);

            this.showAnimation = this.toggler.show();
            this._setHideTimer(this.duration);
        },
        _setHideTimer: function (duration) {
            this._cancelHideTimer();
            if (duration > 0) {
                this._cancelHideTimer();
                this._hideTimer = setTimeout(lang.hitch(this, function () {
                    this._hideTimer = null;
                    var animation = this.toggler.hide();
                    var that = this;
                    animation.onEnd = function () {
                        that.destroyRecursive(false);
                    };
                }), duration);
            }
        },
        _cancelHideTimer: function () {
            if (this._hideTimer) {
                clearTimeout(this._hideTimer);
                this._hideTimer = null;
            }
        },
        destroyRecursive: function () {
            // summary:
            //      remove timer
            console.log('app.ToasterItem:destroyRecursive', arguments);

            this._cancelHideTimer();
            if (this.showAnimation) {
                this.showAnimation.destroy();
            }

            this.inherited(arguments);
        }
    });
});
