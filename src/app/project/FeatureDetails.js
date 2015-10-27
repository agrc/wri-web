define([
    'app/config',
    'app/project/NewFeatureWizard',
    'app/project/userCredentials',
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
    userCredentials,
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
    var onError = function (defaultMsg, msg) {
        topic.publish(config.topics.toast, {
            message: msg || defaultMsg,
            type: 'danger'
        });
    };

    return declare([_WidgetBase, _TemplatedMixin], {
        // description:
        //      Contains feature details and editing tools.
        templateString: template,
        baseClass: 'feature-details',

        // newFeatureWizard: NewFeatureWizard
        newFeatureWizard: null,

        // currentRowData: Number
        //      the row data of the currently selected feature
        currentRowData: null,

        // projectId: Number
        //      the id of the project that is currently open
        projectId: null,

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


        // Properties to be sent into constructor

        // allowEdits: Boolean
        //      the user has edit rights to this project
        allowEdits: null,

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

            this.projectId = router.getProjectId();

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

            var onErrorWithDefault = lang.partial(onError, 'Error selecting feature!');

            Object.keys(this.templateFunctions).forEach(function (key) {
                rowData[key] = this.templateFunctions[key];
            }, this);

            // show feature tab
            domClass.remove(this.featureTab, 'hidden');
            domClass.remove(this.featureTabContainer, 'hidden');
            this.featureTabLink.click();

            this.currentRowData = rowData;

            // prevent flicker of window by putting this on a timer
            var timer = window.setTimeout(function () {
                domConstruct.empty(that.featureTabContents);
            }, 500);
            var responseData;
            var that = this;
            this.makeRequest('GET').then(function (response) {
                if (response.status !== 200) {
                    onErrorWithDefault(response);
                    return;
                }

                responseData = response.data;
            }, function (error) {
                onErrorWithDefault(error.response.data);
            }).always(function () {
                window.clearTimeout(timer);
                domConstruct.empty(that.featureTabContents);
                domConstruct.place(
                    mustache.render(featureTemplate, lang.mixin(rowData, responseData)),
                    that.featureTabContents
                );
            });
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

            if (!window.confirm('Do you really want to delete this feature?')) {
                return;
            }

            var onErrorWithDefault = lang.partial(onError, 'Error deleting feature!');
            var that = this;
            this.deleteFeatureBtn.disabled = true;
            this.makeRequest('DELETE').then(function (response) {
                if (response.status !== 200) {
                    onErrorWithDefault(response);
                    return;
                }

                topic.publish(config.topics.projectIdsChanged, [that.projectId]);
            }, function (error) {
                onErrorWithDefault(error.response.data);
            });
        },
        makeRequest: function (method) {
            // summary:
            //      make request to the api
            // method: String
            console.log('app.project.FeatureDetails:makeRequest', arguments);

            var params = {
                handleAs: 'json',
                headers: config.defaultXhrHeaders,
                method: method
            };
            var data = lang.mixin(userCredentials.getUserData(), {
                featureCategory: this.currentRowData.type
            });
            if (method === 'DELETE') {
                params.data = data;
            } else {
                params.query = data;
            }

            var url = config.urls.api + '/project/' + this.projectId + '/feature/' + this.currentRowData.featureId;
            return xhr(url, params).response;
        }
    });
});
