define([
    'app/config',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',
    'dijit/_WidgetsInTemplateMixin',

    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/text!app/project/templates/FeatureDetails.html',
    'dojo/topic',

    'bootstrap-stylus/js/tab'
], function (
    config,

    _TemplatedMixin,
    _WidgetBase,
    _WidgetsInTemplateMixin,

    declare,
    lang,
    template,
    topic
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        // description:
        //      Contains feature details and editing tools.
        templateString: template,
        baseClass: 'feature-details',
        widgetsInTemplate: true,

        // Properties to be sent into constructor

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.project.FeatureDetails::postCreate', arguments);

            this.setupConnections();

            this.inherited(arguments);
        },
        setupConnections: function () {
            // summary:
            //      wire events, and such
            console.log('app.project.FeatureDetails::setupConnections', arguments);

            topic.subscribe(config.topics.featureSelected, lang.hitch(this, 'onFeatureSelected'));
        },
        onFeatureSelected: function (rowData) {
            // summary:
            //      Fires when the user clicks on a feature in the grid
            // rowData: Object
            console.log('app/project/FeatureDetails:onFeatureSelected', arguments);

            console.log('rowData', rowData);
        }
    });
});
