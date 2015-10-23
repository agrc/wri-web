define([
    'app/config',
    'app/project/NewFeatureWizard',
    'app/router',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/request/xhr',
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
    NewFeatureWizard,
    router,

    _TemplatedMixin,
    _WidgetBase,

    domClass,
    domConstruct,
    xhr,
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

        // newFeatureWizard: NewFeatureWizard
        newFeatureWizard: null,


        // passed into the constructor

        // allowEdits: Boolean
        //      the user has edit rights to this project
        allowEdits: null,

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
            hasNhd: function () {
                return this.nhd && this.nhd.length;
            },
            hasSageGrouse: function () {
                return this.sageGrouse && this.sageGrouse.length;
            }
        },

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.project.FeatureDetails::postCreate', arguments);

            this.setupConnections();

            mustache.parse(featureTemplate);
            domConstruct.place(mustache.render(projectTemplate, this), this.projectDetailsNode);

            if (this.allowEdits) {
                domClass.remove(this.modBtns, 'hidden');
            }

            this.inherited(arguments);
        },
        setupConnections: function () {
            // summary:
            //      wire events, and such
            console.log('app.project.FeatureDetails::setupConnections', arguments);

            this.own(
                topic.subscribe(config.topics.featureSelected, lang.hitch(this, 'onFeatureSelected')),
                topic.subscribe(config.topics.feature.startNewFeatureWizard, lang.hitch(this, 'startNewFeatureWizard'))
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
            domClass.remove(this.featureTab, 'hidden');
            domClass.remove(this.featureTabContainer, 'hidden');
            this.featureTabLink.click();

            var projectId = router.getProjectId();
            xhr.get(config.urls.api + '/project/' + projectId + '/feature/' + rowData.featureId, {
                handleAs: 'json',
                headers: config.defaultXhrHeaders,
                query: { 'featureCategory': rowData.type }
            }).response.then(lang.hitch(this, function (response) {
                if (response.status !== 200) {
                    return;
                }

                domConstruct.empty(this.featureTabContents);
                domConstruct.place(mustache.render(featureTemplate, lang.mixin(rowData, response.data)), this.featureTabContents);
            }));
        },
        startNewFeatureWizard: function () {
            // summary:
            //      starts the add new feature wizard
            console.log('app.project.FeatureDetails:startNewFeatureWizard', arguments);

            // show new feature tab
            domClass.remove(this.newFeatureTab, 'hidden');
            domClass.remove(this.newFeatureTabContainer, 'hidden');
            this.newFeatureTabLink.click();

            if (!this.newFeatureWizard || this.newFeatureWizard._destroyed) {
                var wizard = new NewFeatureWizard({},
                    domConstruct.create('div', null, this.newFeatureTabContents));
                wizard.startup();

                var that = this;
                wizard.on('hide', function () {
                    domClass.add(that.newFeatureTab, 'hidden');
                    domClass.add(that.newFeatureTabContainer, 'hidden');
                    that.detailsTabLink.click();
                });
                this.newFeatureWizard = wizard;
            }
        },
        onDeleteFeatureClick: function () {
            // summary:
            //      user has clicked the delete feature button
            console.log('app.project.FeatureDetails:onDeleteFeatureClick', arguments);

            // TODO make request to delete service.
        }
    });
});
