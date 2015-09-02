define([
    'app/config',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/dom-construct',
    'dojo/query',
    'dojo/text!app/project/templates/FeatureDataTemplate.html',
    'dojo/text!app/project/templates/FeatureDetails.html',
    'dojo/text!app/project/templates/ProjectDataTemplate.html',
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

    domConstruct,
    query,
    featureTemplate,
    template,
    projectTemplate,
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

        templateFunctions: {
            hasCounty: function () {
                return this.county && this.county.length;
            },
            hasLandOwnership: function () {
                return this.landOwnership && this.landOwnership.length;
            },
            hasFocusArea: function () {
                return this.focusArea && this.focusArea.length;
            },
            hasSageGrouse: function () {
                return this.sageGrouse && this.sageGrouse.length;
            }
        },

        // Properties to be sent into constructor

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.project.FeatureDetails::postCreate', arguments);

            this.setupConnections();

            mustache.parse(featureTemplate);
            domConstruct.place(mustache.render(projectTemplate, this), this.projectDetailsNode);

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

            Object.keys(this.templateFunctions).forEach(function (key) {
                rowData[key] = this.templateFunctions[key];
            }, this);

            domConstruct.empty(this.featureTabContents);
            domConstruct.place(mustache.render(featureTemplate, rowData), this.featureTabContents);

            // show feature tab
            query('.hidden', this.domNode).removeClass('hidden');
            this.featureTabLink.click();
        }
    });
});
