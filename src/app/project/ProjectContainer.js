define([
    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/_base/declare',
    'dojo/text!app/project/templates/ProjectContainer.html',

    'xstyle/css!app/project/resources/ProjectContainer.css'
], function (
    _TemplatedMixin,
    _WidgetBase,

    declare,
    template
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        // description:
        //      The container to hold and manage all the widgets for working with projects
        templateString: template,
        baseClass: 'project-container',

        // Properties to be sent into constructor

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.project.ProjectContainer::postCreate', arguments);

            this.setupConnections();

            this.inherited(arguments);
        },
        setupConnections: function () {
            // summary:
            //      wire events, and such
            console.log('app.project.ProjectContainer::setupConnections', arguments);

        }
    });
});
