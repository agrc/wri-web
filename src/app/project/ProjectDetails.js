define([
    'app/config',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/_base/declare',
    'dojo/dom-class',
    'dojo/text!app/project/templates/ProjectDetails.html',
    'dojo/topic',

    'bootstrap-stylus/js/button'
], function (
    config,

    _TemplatedMixin,
    _WidgetBase,

    declare,
    domClass,
    template,
    topic
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        // description:
        //      probably a widget that doesn't need to be
        templateString: template,
        baseClass: 'project-details',

        constructor: function (params) {
            // summary:
            //      overrides same function in _WidgetBase
            // params: Object
            console.log('app.project.ProjectDetails:constructor', arguments);

            this.statusClass = params.status.replace(' ', '');
        },
        toggleAdjacent: function () {
            // summary:
            //      toggles the adjacent projects
            console.log('app.project.ProjectDetails::toggleAdjacent', arguments);

            var that = this;
            setTimeout(function () {
                topic.publish(config.topics.map.toggleAdjacent, domClass.contains(that.toggleNode, 'active'));
            }, 0);
        },
        onAddFeatureClick: function () {
            // summary:
            //      fires topics
            console.log('app.project.ProjectDetails:onAddFeatureClick', arguments);

            topic.publish(config.topics.addNewFeature);
        }
    });
});
