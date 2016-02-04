define([
    'app/config',
    'app/mapController',
    'app/modules/httpStatus',
    'app/project/CreateEditFeature',
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
    mapController,
    httpStatus,
    CreateEditFeature,
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

        // newFeatureWizard: CreateEditFeature
        newFeatureWizard: null,

        // editFeatureWizard: CreateEditFeature
        editFeatureWizard: null,

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
            },
            hasHerbicides: function () {
                return this.herbicides && this.herbicides.length;
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

            var projectData = {};
            Object.keys(this.templateFunctions).forEach(function (key) {
                projectData[key] = this.templateFunctions[key];
            }, this);

            lang.mixin(projectData, {
                affectedAreaSqMeters: this.affectedAreaSqMeters,
                aquaticSqMeters: this.aquaticSqMeters,
                county: this.county,
                description: this.description,
                easementSqMeters: this.easementSqMeters,
                focusArea: this.focusArea,
                landOwnership: this.landOwnership,
                leadAgency: this.leadAgency,
                nhd: this.nhd,
                projectId: this.projectId,
                projectManagerName: this.projectManagerName,
                region: this.region,
                sageGrouse: this.sageGrouse,
                status: this.status,
                streamLnMeters: this.streamLnMeters,
                terrestrialSqMeters: this.terrestrialSqMeters,
                title: this.title
            });

            mustache.parse(projectTemplate);
            domConstruct.place(mustache.render(projectTemplate, projectData), this.projectDetailsNode);

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

            var that = this;
            this.own(
                topic.subscribe(config.topics.featureSelected, lang.hitch(this, 'onFeatureSelected')),
                topic.subscribe(config.topics.feature.createFeature, lang.hitch(this, 'createFeature')),
                topic.subscribe(config.topics.selectionCleared, function () {
                    that.toggleTab('featureTab', false);
                    that.toggleTab('detailsTab', true);
                    domConstruct.empty(that.featureTabContents);
                })
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

            this.toggleTab('editFeatureTab', false);
            this.toggleTab('newFeatureTab', false);
            this.toggleTab('featureTab', true);

            this.currentRowData = rowData;
            var that = this;

            // prevent flicker of window by putting this on a timer
            var timer = window.setTimeout(function () {
                domConstruct.empty(that.featureTabContents);
            }, 500);
            var responseData;
            this.makeRequest('GET').then(function (response) {
                if (httpStatus.isSuccessful(response.status, 'GET')) {
                    responseData = response.data;
                    return;
                }

                onErrorWithDefault(response);
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
        createFeature: function () {
            // summary:
            //      starts the add new feature wizard
            console.log('app.project.FeatureDetails:createFeature', arguments);

            this.toggleTab('newFeatureTab', true);
            this.toggleTab('editFeatureTab', false);

            if (!this.newFeatureWizard || this.newFeatureWizard._destroyed) {
                var wizard = new CreateEditFeature({},
                    domConstruct.create('div', null, this.newFeatureTabContents));
                wizard.startup();

                var that = this;
                wizard.on('hide', function () {
                    that.toggleTab('newFeatureTab', false);
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
                if (httpStatus.isSuccessful(response.status, 'DELETE')) {
                    topic.publish(config.topics.projectIdsChanged, [that.projectId]);
                    topic.publish(config.topics.toast, {
                        message: response.data || 'Feature deleted successfully.',
                        type: 'success'
                    });
                    return;
                }

                onErrorWithDefault(response);
            }, function (error) {
                onErrorWithDefault(error.response.data);
                that.deleteFeatureBtn.disabled = false;
            }).always(lang.partial(topic.publish, config.topics.hideProjectLoader));

            topic.publish(config.topics.showProjectLoader);
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
        },
        onModifyFeatureClick: function () {
            // summary:
            //      gather feature and action data and send to create edit feature widget
            console.log('app.project.FeatureDetails:onModifyFeatureClick', arguments);

            // show edit feature tab
            this.toggleTab('editFeatureTab', true);

            // prevent duplicate widgets
            if (this.editFeatureWizard) {
                this.editFeatureWizard.destroyRecursive();
                this.editFeatureWizard = null;
            }

            var row = this.currentRowData;
            var graphic = mapController.getGraphicById(row.featureId, row.origin);
            graphic.hide();
            var wizard = new CreateEditFeature({
                existingData: {
                    category: row.type,
                    retreatment: row.retreatment,
                    geometry: lang.clone(graphic.geometry),
                    actions: this.getActionsFromGridRows(
                        row.store.filter({
                            featureId: row.featureId,
                            hasChildren: false
                        })
                    ),
                    featureId: row.featureId,
                    opacity: graphic.symbol.color.a
                }
            }, domConstruct.create('div', {}, this.editFeatureTabContents));
            wizard.startup();

            var that = this;
            wizard.on('hide', function () {
                graphic.show();
                that.toggleTab('editFeatureTab', false);
                wizard.destroyRecursive();
                that.editFeatureWizard = null;
                that.onFeatureSelected(that.currentRowData);
            });

            this.editFeatureWizard = wizard;
        },
        getActionsFromGridRows: function (rows) {
            // summary:
            //      pulls out the actions parameters from grid rows
            // rows: Object[]
            console.log('app.project.FeatureDetails:getActionsFromGridRows', arguments);

            var newRows = [];
            rows.forEach(function (r) {
                var obj = {
                    action: r.action,
                    description: r.description
                };

                // split out types and treatments from subType property based on category
                if (Array.isArray(config.domains.featureAttributes[r.type])) {
                    obj.type = r.subType;
                } else {
                    obj.treatment = r.subType;
                }

                if (!r.herbicides) {
                    newRows.push(obj);
                } else {
                    r.herbicides.forEach(function (h) {
                        var newObj = lang.clone(obj);
                        newObj.herbicide = h;
                        newRows.push(newObj);
                    });
                }
            });

            return newRows;
        },
        toggleTab: function (tab, show) {
            // summary:
            //      shows or hides the tab and contents
            // tab: String
            //      The dojo attach point name of the tab (e.g. editFeatureTab)
            // show: Boolean
            console.log('app.project.FeatureDetails:toggleTab', arguments);

            domClass.toggle(this[tab], 'hidden', !show);
            domClass.toggle(this[tab + 'Container'], 'hidden', !show);
            if (show) {
                this[tab + 'Link'].click();
            }
        }
    });
});
