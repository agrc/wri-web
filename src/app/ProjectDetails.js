define([
    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',
    'dijit/_WidgetsInTemplateMixin',

    'dojo/_base/declare',
    'dojo/text!app/templates/ProjectDetails.html',

    'xstyle/css!app/resources/ProjectDetails.css'
], function (
    _TemplatedMixin,
    _WidgetBase,
    _WidgetsInTemplateMixin,

    declare,
    template
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        // description:
        //      Contains both basic and optionally detailed information about the project
        templateString: template,
        baseClass: 'project-details panel panel-default',
        widgetsInTemplate: true,

        // Properties to be sent into constructor

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.ProjectDetails::postCreate', arguments);

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
