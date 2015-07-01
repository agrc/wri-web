define([
    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',
    'dijit/_WidgetsInTemplateMixin',

    'dojo/_base/declare',
    'dojo/on',
    'dojo/text!app/mapControls/templates/ReferenceLayers.html',

    'bootstrap-stylus/js/collapse',
    'bootstrap-stylus/js/transition'
], function (
    _TemplatedMixin,
    _WidgetBase,
    _WidgetsInTemplateMixin,

    declare,
    on,
    template
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        // description:
        //      Container for controls for toggling reference layers
        templateString: template,
        baseClass: 'reference-layers panel panel-default',
        widgetsInTemplate: true,

        // Properties to be sent into constructor

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.mapControls.ReferenceLayers::postCreate', arguments);

            this.setupConnections();

            var that = this;
            on(this.heading, 'click', function (evt) {
                if (evt.srcElement !== that.closeBtn &&
                    evt.srcElement !== that.closeSpan) {
                    $(that.body).collapse('toggle');
                }
            });

            this.inherited(arguments);
        },
        setupConnections: function () {
            // summary:
            //      wire events, and such
            console.log('app.mapControls.ReferenceLayers::setupConnections', arguments);

        }
    });
});
