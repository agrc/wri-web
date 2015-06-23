define([
    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',
    'dijit/_WidgetsInTemplateMixin',

    'dojo/_base/declare',
    'dojo/dom-class',
    'dojo/text!app/project/templates/ProjectDetails.html',

    'bootstrap-stylus/js/button',
    'bootstrap-stylus/js/collapse'
], function (
    _TemplatedMixin,
    _WidgetBase,
    _WidgetsInTemplateMixin,

    declare,
    domClass,
    template
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        // description:
        //      Contains both basic and optionally detailed information about the project
        templateString: template,
        baseClass: 'project-details',
        widgetsInTemplate: true,

        // Properties to be sent into constructor

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.ProjectDetails::postCreate', arguments);

            if (!this.streamMiles) {
                domClass.add(this.streamMilesDiv, 'hidden');
            }
            this.setupConnections();

            this.inherited(arguments);
        },
        setupConnections: function () {
            // summary:
            //      wire events, and such
            console.log('app.ProjectDetails::setupConnections', arguments);

        }
    });
});
