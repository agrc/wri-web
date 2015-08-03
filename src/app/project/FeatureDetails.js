define([
    'app/config',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/query',
    'dojo/text!app/project/templates/FeatureData.html',
    'dojo/text!app/project/templates/FeatureDetails.html',
    'dojo/topic',
    'dojo/_base/declare',
    'dojo/_base/lang',

    'mustache/mustache',

    'bootstrap-stylus/js/tab',
    'dojo/NodeList-dom'
], function (
    config,

    _TemplatedMixin,
    _WidgetBase,

    domClass,
    domConstruct,
    query,
    featureDataTxt,
    template,
    topic,
    declare,
    lang,

    mustache
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        // description:
        //      Contains feature details and editing tools.
        templateString: template,
        baseClass: 'feature-details',

        // Properties to be sent into constructor

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.project.FeatureDetails::postCreate', arguments);

            this.setupConnections();

            if (!this.streamMiles) {
                domClass.add(this.streamMilesDiv, 'hidden');
            }

            this.inherited(arguments);
        },
        setupConnections: function () {
            // summary:
            //      wire events, and such
            console.log('app.project.FeatureDetails::setupConnections', arguments);

            this.own(
                topic.subscribe(config.topics.featureSelected, lang.hitch(this, 'onFeatureSelected'))
            );
        },
        onFeatureSelected: function (rowData) {
            // summary:
            //      Fires when the user clicks on a feature in the grid
            // rowData: Object
            console.log('app/project/FeatureDetails:onFeatureSelected', arguments);

            domConstruct.empty(this.featureTabContents);
            domConstruct.place(domConstruct.toDom(mustache.render(featureDataTxt, rowData)),
                this.featureTabContents);

            // show feature tab
            query('.hidden', this.domNode).removeClass('hidden');
            this.featureTabLink.click();
        }
    });
});
