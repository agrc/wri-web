define([
    'app/config',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/on',
    'dojo/text!app/project/templates/ProjectDetails.html',
    'dojo/topic',
    'dojo/_base/declare',
    'dojo/_base/lang',

    'bootstrap-stylus/js/button'
], function (
    config,

    _TemplatedMixin,
    _WidgetBase,

    domClass,
    domConstruct,
    on,
    template,
    topic,
    declare,
    lang
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
        postCreate: function () {
            // summary:
            //      description
            // param or return
            console.log('app.project.ProjectDetails:postCreate', arguments);

            if (this.allowEdits) {
                var btn = domConstruct.create('button', {
                    role: 'button',
                    'class': 'btn btn-primary',
                    innerHTML: 'Add Feature'
                }, this.toggleNode.parentNode, 'first');

                this.own(on(btn, 'click', lang.hitch(this, 'onAddFeatureClick')));
            }
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

            topic.publish(config.topics.feature.startNewFeatureWizard);
        }
    });
});
