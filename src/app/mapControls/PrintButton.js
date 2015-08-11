define([
    'app/mapControls/Print',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/dom-construct',
    'dojo/text!app/mapControls/templates/PrintButton.html',
    'dojo/_base/declare',
    'dojo/_base/lang',

    'bootstrap-stylus/js/tooltip',
    'bootstrap-stylus/js/popover'
], function (
    Print,

    _TemplatedMixin,
    _WidgetBase,

    domConstruct,
    template,
    declare,
    lang
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        // description:
        //      the ui/ux container for exporting the map to PDF
        templateString: template,
        baseClass: 'print-button',

        // Properties to be sent into constructor


        constructor: function () {
            // summary:
            //      first function to fire after page loads
            console.info('app.mapControls.PrintButton::constructor', arguments);

            this.childWidgets = [];

            this.inherited(arguments);
        },
        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.mapControls.PrintButton::postCreate', arguments);

            var print = new Print({}, domConstruct.create('div'));

            var titleDiv = domConstruct.create('div', {
                innerHTML: '<span class="text-info"><strong>Export Map</strong></span>'
            });

            domConstruct.create('button', {
                'class': 'print-button close',
                innerHTML: '&times;',
                click: lang.hitch(this, 'toggle')
            }, titleDiv);

            $(this.domNode).popover({
                content: print.domNode,
                placement: 'bottom',
                trigger: 'manual',
                html: true,
                title:  titleDiv
            });

            this.childWidgets.push(print);

            this.inherited(arguments);
        },
        toggle: function () {
            // summary:
            //      hides the popover
            console.log('app.mapControls.PrintButton::toggle', arguments);

            $(this.domNode).popover('toggle');
        },
        startup: function () {
            // summary:
            //      description
            // param or return
            console.log('app.mapControls.PrintButton:startup', arguments);

            this.childWidgets.forEach(function (widget) {
                this.own(widget);
                widget.startup();
            }, this);
        }
    });
});
