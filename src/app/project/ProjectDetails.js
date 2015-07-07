define([
    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/_base/declare',
    'dojo/text!app/project/templates/ProjectDetails.html'
], function (
    _TemplatedMixin,
    _WidgetBase,

    declare,
    template
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        // description:
        //      Contains both basic and optionally detailed information about the project
        templateString: template,
        baseClass: 'project-details'
    });
});
