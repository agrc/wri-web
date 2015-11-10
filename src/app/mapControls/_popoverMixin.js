define([
    'dojo/dom-construct',
    'dojo/_base/declare',
    'dojo/_base/lang',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'bootstrap-stylus/js/tooltip',
    'bootstrap-stylus/js/popover'
], function (
    domConstruct,
    declare,
    lang,

    _TemplatedMixin,
    _WidgetBase
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        constructor: function () {
            // summary:
            //      first function to fire after page loads
            console.log('app.mapControls._popoverMixin::constructor', arguments);

            this.childWidgets = [];
        },
        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.mapControls._popoverMixin::postCreate', arguments);

            domConstruct.create('button', {
                'class': this.baseClass + ' close',
                innerHTML: '&times;',
                click: lang.hitch(this, 'toggle')
            }, this.titleDiv);

            $(this.domNode).popover({
                content: this.widget.domNode,
                placement: 'bottom',
                trigger: 'manual',
                html: true,
                title: this.titleDiv
            });

            this.childWidgets.push(this.widget);
        },
        toggle: function () {
            // summary:
            //      hides the popover
            console.log('app.mapControls._popoverMixin::toggle', arguments);

            $(this.domNode).popover('toggle');
        },
        startup: function () {
            // summary:
            //      description
            // param or return
            console.log('app.mapControls._popoverMixin:startup', arguments);

            this.childWidgets.forEach(function (widget) {
                this.own(widget);
                widget.startup();
            }, this);
        }
    });
});
