define([
    'app/config',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/dom-class',
    'dojo/text!app/mapControls/templates/NonWriButton.html',
    'dojo/topic',
    'dojo/_base/declare',
    'dojo/_base/lang'
], function (
    config,

    _TemplatedMixin,
    _WidgetBase,

    domClass,
    template,
    topic,
    declare,
    lang
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        // description:
        //      Toggle on and off non wri funded projects
        templateString: template,
        baseClass: 'non-wri-button',

        // Properties to be sent into constructor

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.mapControls.NonWriButton::postCreate', arguments);

            this.setupConnections();

            this.inherited(arguments);
        },
        setupConnections: function () {
            // summary:
            //      wire events, and such
            console.log('app.mapControls.CentroidSwitchButton::setupConnections', arguments);

            this.own(
                topic.subscribe(config.topics.projectIdsChanged, lang.hitch(this, 'toggleSelf'))
            );
        },
        toggleSelf: function (ids) {
            // summary:
            //      determines whether widget should be displayed or not
            // ids: {5:type or return: type}
            console.log('app.mapControls.CentroidSwitchButton::toggleSelf', arguments);

            var hide = ids && ids.length === 1;
            domClass.toggle(this.domNode, 'hidden', hide);
        },
        toggleWriProjects: function (e) {
            // summary:
            //      publish to map controller to show and hide non wri projects
            console.log('app.mapControls:toggleWriProjects', arguments);

            domClass.toggle(e.target, 'toggle');
            topic.publish(config.topics.map.toggleWriProjects, domClass.contains(e.target, 'toggle'));
        }
    });
});
