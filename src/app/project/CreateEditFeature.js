define([
    'app/config',
    'app/helpers',
    'app/modules/httpStatus',
    'app/project/Action',
    'app/project/userCredentials',
    'app/router',
    'app/Wkt',

    'agrc/modules/Formatting',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',
    'dijit/_WidgetsInTemplateMixin',

    'dojo/aspect',
    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/query',
    'dojo/request/xhr',
    'dojo/text!app/project/templates/CreateEditFeature.html',
    'dojo/topic',
    'dojo/_base/declare',
    'dojo/_base/lang',

    'esri/geometry/Point',
    'esri/geometry/Polygon',
    'esri/geometry/Polyline',
    'esri/graphic',
    'esri/layers/GraphicsLayer',
    'esri/request',
    'esri/tasks/DataFile',
    'esri/tasks/Geoprocessor',

    'bootstrap-stylus/js/button',
    'bootstrap-stylus/js/collapse',
    'bootstrap-stylus/js/transition'
], function (
    config,
    helpers,
    httpStatus,
    Action,
    userCredentials,
    router,
    Wkt,

    formatting,

    _TemplatedMixin,
    _WidgetBase,
    _WidgetsInTemplateMixin,

    aspect,
    domClass,
    domConstruct,
    query,
    xhr,
    template,
    topic,
    declare,
    lang,

    Point,
    Polygon,
    Polyline,
    Graphic,
    GraphicsLayer,
    esriRequest,
    DataFile,
    Geoprocessor
) {
    // this needs to be here because esri/geometry/geometryEngine doesn't
    // play nice with the dojo build system
    var geometryEngine;
    require(['esri/geometry/geometryEngine'], function (geoEngine) {
        geometryEngine = geoEngine;
    });

    var loadItemsIntoSelect = function (items, select, preventShow) {
        // summary:
        //      add the items as options to the select
        //      toggle the visibility of the select
        // items: String[]
        // select: Select Dom Node
        // preventShow: Boolean

        items.sort().forEach(function (item) {
            domConstruct.create('option', {
                innerHTML: item,
                value: item
            }, select);
        });
        if (!preventShow) {
            domClass.toggle(select.parentElement, 'hidden', (!items || items.length === 0));
        }
    };
    var clearSelect = function (select) {
        // summary:
        //      clears all but the first option from the select
        // select: Select Dom Node

        [].slice.call(select.children).forEach(function (c, i) {
            if (i !== 0) {
                domConstruct.destroy(c);
            }
        });
        domClass.add(select.parentElement, 'hidden');
    };

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        // description:
        //      Wizard for adding new features to a project or editing existing features.
        templateString: template,
        baseClass: 'new-feature-wizard',
        widgetsInTemplate: true,

        // gp: Geoprocessor
        //      The object that makes the zip to graphics request
        gp: null,

        // graphicsLayer: GraphicsLayer
        //      The layer that contains the geometry of the new feature
        graphicsLayer: null,

        // originalGraphicJsons: Object[]
        //      A cloned list of the any existing graphics at the point when the
        //      user clicks the draw/edit button. This is used to restore them if
        //      the user clicks the cancel button on the drawing toolbar.
        originalGraphicJsons: null,

        // actions: Action[]
        actions: null,

        // duplicateActionMsg: String
        //      sent to toaster
        duplicateActionMsg: 'Can\'t add duplicate actions!',

        // bufferLines: Polyline[]
        //      the lines to buffer
        bufferLines: null,


        // Properties to be sent into constructor

        // existingData: Object (optional)
        // {
        //     category: String,
        //     retreatment: String,
        //     geometry: Geometry,
        //     actions: Action[],
        //     featureId: Number
        // }
        //      This is used to pass in the data for a feature that is being modified
        existingData: null,

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.project.CreateEditFeature::postCreate', arguments);

            this.actions = [];

            loadItemsIntoSelect(config.domains.featureType.map(function (category) {
                return category[0];
            }), this.featureCategorySelect);

            this.gp = new Geoprocessor(config.urls.zipToGraphics);

            this.graphicsLayer = new GraphicsLayer();
            var that = this;
            this.own(
                this.graphicsLayer.on('click', function (evt) {
                    topic.publish(config.topics.feature.selectedForEditing, evt.graphic);
                }),
                topic.subscribe(config.topics.feature.drawingComplete, lang.hitch(this, 'onGeometryDefined')),
                topic.subscribe(config.topics.feature.cutFeatures, lang.hitch(this, 'onCutFeatures')),
                topic.subscribe(config.topics.feature.cancelDrawing, lang.hitch(this, 'onCancelDrawing')),
                query('select, textarea, checkbox', this.featureAttributesDiv)
                    .on('change', lang.hitch(this, 'validateForm')),
                topic.subscribe(config.topics.feature.removeEditingGraphic, function (graphic) {
                    that.graphicsLayer.remove(graphic);
                }),
                topic.subscribe(config.topics.featureSelected, lang.hitch(this, 'onCancel')),
                topic.subscribe(config.topics.feature.drawEditComplete, function () {
                    that.validateForm();
                    that.bufferLines = null;
                }),
                topic.subscribe(config.topics.opacityChanged, lang.hitch(this, 'changeOpacity'))
            );
            topic.publish(config.topics.layer.add, {
                graphicsLayers: [this.graphicsLayer],
                dynamicLayers: []
            });

            loadItemsIntoSelect(config.domains.herbicides, this.herbicideSelect, true);

            if (this.existingData) {
                this.parseExistingData(this.existingData);
            }

            this.inherited(arguments);
        },
        parseExistingData: function (existingData) {
            // summary:
            //      set the controls of this widget to match the existingData input
            console.log('app.project.CreateEditFeature::parseExistingData', arguments);

            this.featureCategorySelect.value = existingData.category;
            this.featureCategorySelect.disabled = true;
            this.onFeatureCategoryChange();
            this.retreatmentChBx.checked = existingData.retreatment === 'Y';

            // explode multi-part geometries
            var geo = existingData.geometry;
            var that = this;
            var defineGeo = function (g) {
                that.onGeometryDefined(g, false, false);
            };
            var sr = config.defaultExtent.spatialReference;
            if (geo.type === 'multipoint') {
                geo.points.forEach(function (p) {
                    defineGeo(new Point(p, sr));
                });
            } else if (geo.rings && geo.rings.length > 1) {
                geo.rings.forEach(function (r) {
                    defineGeo(new Polygon({
                        rings: [r],
                        spatialReference: sr
                    }));
                });
            } else if (geo.paths && geo.paths.length > 1) {
                geo.paths.forEach(function (p) {
                    defineGeo(new Polyline({
                        paths: [p],
                        spatialReference: sr
                    }));
                });
            } else {
                defineGeo(geo);
            }

            if (config.terrestrialAquaticCategories.indexOf(existingData.category) > -1) {
                existingData.actions.forEach(function (a) {
                    this.addAction(a);
                }, this);
            } else {
                // category supports only single actions
                var action = existingData.actions[0];
                if (action.action) {
                    // check for both polygon and multipolygon
                    if (geo.type.indexOf('polygon') > -1) {
                        this.polyActionSelect.value = action.action;
                        this.onPolyActionSelectChange();
                    } else {
                        this.pointLineActionSelect.value = action.action;
                    }
                }
                if (action.type) {
                    this.typeSelect.value = action.type;
                }
                if (action.treatment) {
                    this.treatmentSelect.value = action.treatment;
                }
                if (action.description) {
                    this.commentsTxt.value = action.description;
                }
            }

            this.graphicsLayer.setOpacity(existingData.opacity);

            topic.publish(config.topics.feature.startEditing);
        },
        validateForm: function () {
            // summary:
            //      check for required fields and enables/disables save and add buttons accordingly
            console.log('app.project.CreateEditFeature:validateForm', arguments);

            var category = this.featureCategorySelect.value;
            var requiredActionFields = query('.form-group:not(.hidden) select, .form-group:not(.hidden) textarea',
                                             this.featureAttributesDiv);
            var populatedActionFields = requiredActionFields.filter(function (s) {
                return s.value !== '';
            });
            var valid = (
                category !== '' &&
                populatedActionFields.length === requiredActionFields.length &&
                this.graphicsLayer.graphics.length > 0
            );

            this.addActionBtn.disabled = !valid;
            this.saveBtn.disabled = !(
                valid ||
                (this.actions.length > 0 && category && populatedActionFields.length === 0)
            );

            var hasLines = this.graphicsLayer.graphics.some(function (g) {
                return g.geometry.type === 'polyline';
            });
            var showBuffer = helpers.getGeometryTypeFromCategory(category) === 'POLY' && hasLines;

            domClass.toggle(this.buffer, 'hidden', !showBuffer);

            return valid;
        },
        onCancelDrawing: function () {
            // summary:
            //      restore original graphics
            console.log('app.project.CreateEditFeature:onCancelDrawing', arguments);

            this.graphicsLayer.clear();
            this.originalGraphicJsons.forEach(function (json) {
                this.graphicsLayer.add(new Graphic(json));
            }, this);
        },
        onFeatureCategoryChange: function () {
            // summary:
            //      shows or hides the drawing buttons
            console.log('app.project.CreateEditFeature:onFeatureCategoryChange', arguments);

            $(this.featureAttributesDiv).collapse('hide');
            this.resetFeatureAttributes();
            this.actions = [];
            domConstruct.empty(this.actionsContainer);

            this.graphicsLayer.clear();

            var newValue = this.featureCategorySelect.value;
            var toggle = (newValue === '') ? 'hide' : 'show';
            $(this.geometryBtnsDiv).collapse(toggle);

            if (toggle === 'hide') {
                $(this.uploadBtn).collapse(toggle);
            }

            var items = config.domains.featureAttributes[newValue];
            if (Array.isArray(items)) {
                // line or point feature types
                loadItemsIntoSelect(items, this.typeSelect);

                if (config.noActionCategories.indexOf(newValue) === -1) {
                    loadItemsIntoSelect(config.domains.pointLineActions, this.pointLineActionSelect);
                    domClass.remove(this.pointLineActionSelect.parentElement, 'hidden');
                }
            } else {
                // polygon actions
                var actions = [];
                for (var action in items) {
                    if (items.hasOwnProperty(action)) {
                        actions.push(action);
                    }
                }
                loadItemsIntoSelect(actions, this.polyActionSelect);
            }

            // check for comments and retreatment fields
            if (config.commentsFieldCategories.indexOf(newValue) > -1) {
                domClass.remove(this.comments, 'hidden');
            }
            var isTerrAquatic = config.terrestrialAquaticCategories.indexOf(newValue) > -1;
            if (isTerrAquatic) {
                domClass.remove(this.retreatment, 'hidden');
            }

            // show/hide the add additional action button
            domClass.toggle(this.addActionBtn, 'hidden', !isTerrAquatic);
        },
        onUploadClick: function () {
            // summary:
            //      upload button was clicked
            console.log('app.project.CreateEditFeature:onUploadClick', arguments);

            $(this.uploadDiv).collapse('show');
        },
        onFileSelected: function () {
            // summary:
            //      update controls after a file is selected for upload
            console.log('app.project.CreateEditFeature:onFileSelected', arguments);

            this.uploadTxtBox.value = this.fileUploadInput.value.replace(/.*\\/, '');
            this.uploadBtn.disabled = false;
            $(this.uploadBtn).button('reset');
        },
        onUpload: function () {
            // summary:
            //      uploads the zip file
            console.log('app.project.CreateEditFeature:onUpload', arguments);

            this.graphicsLayer.clear();
            $(this.uploadBtn).button('loading');

            var that = this;
            var onError = function (er) {
                topic.publish(config.topics.toast, {
                    message: that.getServiceErrorMessage(er),
                    type: 'danger'
                });
                $(that.uploadBtn).button('reset');
            };

            // upload file
            esriRequest({
                url: config.urls.upload,
                content: {f: 'json'},
                form: this.uploadForm,
                handlAs: 'json'
            }).then(function (response) {
                var df = new DataFile();
                df.itemID = response.item.itemID;
                // kick off zip to graphic gp task
                that.gp.execute({
                    zipFile: df,
                    featureCategory: that.featureCategorySelect.value
                }).then(function (results) {
                    that.onFileSelected();
                    that.onGeometryDefined(results[0].value.features[0].geometry, true, true);
                    results[1].value.forEach(function (message) {
                        var parts = message.split(':');
                        topic.publish(config.topics.toast, parts[1], parts[0]);
                    });
                }, onError);
            }, onError);
        },
        onDrawClick: function () {
            // summary:
            //      hide the upload div and publish the topic
            console.log('app.project.CreateEditFeature:onDrawClick', arguments);

            $(this.uploadDiv).collapse('hide');

            // store graphics in case we need to restore them after the cancel button is
            // clicked on the draw toolbar
            this.originalGraphicJsons = this.graphicsLayer.graphics.map(function (g) {
                return g.toJson();
            });

            topic.publish(config.topics.feature.startDrawing, this.featureCategorySelect.value);
        },
        onGeometryDefined: function (geometry, zoom, clear) {
            // summary:
            //      feature has been drawn or shapefile has been uploaded
            // geometry: Geometry
            // zoom: Boolean (optional)
            //      zoom to geometry
            // clear: Boolean (optional)
            //      clear any previous graphics
            console.log('app.project.CreateEditFeature:onGeometryDefined', arguments);

            $(this.uploadDiv).collapse('hide');
            $(this.featureAttributesDiv).collapse('show');

            var graphic = new Graphic(geometry);
            var symbol;
            var symbols = config.symbols.selected;
            switch (graphic.geometry.type) {
                case 'polygon':
                    symbol = symbols.poly;
                    break;
                case 'polyline':
                    symbol = symbols.line;
                    break;
                default:
                    symbol = symbols.point;
            }
            graphic.setSymbol(symbol);
            if (clear) {
                this.graphicsLayer.clear();
            }
            this.graphicsLayer.add(graphic);
            if (zoom) {
                if (graphic.geometry.type !== 'point') {
                    topic.publish(config.topics.map.setExtent, graphic.geometry.getExtent());
                } else {
                    topic.publish(config.topics.map.setExtent, graphic.geometry);
                }
            }

            this.bufferSelect.value = '';
            this.validateForm();
        },
        onPolyActionSelectChange: function () {
            // summary:
            //      update the treatment appropriate for the selected action
            // param or return
            console.log('app.project.CreateEditFeature:onPolyActionSelectChange', arguments);

            clearSelect(this.treatmentSelect);
            loadItemsIntoSelect(
                config.domains.featureAttributes[this.featureCategorySelect.value][this.polyActionSelect.value], this.treatmentSelect);

            var showHerb = this.polyActionSelect.value.toUpperCase() === config.herbicideActionName;
            domClass.toggle(this.herbicide, 'hidden', !showHerb);
        },
        resetFeatureAttributes: function (preserveVisibility) {
            // summary:
            //      clears all of the form controls
            console.log('app.project.CreateEditFeature:resetFeatureAttributes', arguments);

            var hide = function (node) {
                if (!preserveVisibility) {
                    domClass.add(node, 'hidden');
                }
            };

            [
                this.polyActionSelect,
                this.treatmentSelect,
                this.typeSelect,
                this.pointLineActionSelect].forEach(function (s) {
                if (!preserveVisibility) {
                    clearSelect(s);
                } else {
                    s.value = '';
                }
                hide(s.parentElement);
            });

            this.herbicideSelect.value = '';
            // always hide herbicide
            domClass.add(this.herbicide, 'hidden');

            this.commentsTxt.value = '';
            hide(this.comments);

            // don't reset retreatment if adding an additional action
            if (!preserveVisibility) {
                hide(this.retreatment);
                this.retreatmentChBx.checked = false;
            }

            this.saveBtn.disabled = true;
            this.addActionBtn.disabled = true;

            this.validateForm();
        },
        getServiceErrorMessage: function (er) {
            // summary:
            //      parses the error object and returns a user-friendly error message
            // er: Object
            //      with either `details` or `message` or both properties
            // returns: String
            console.log('app.project.CreateEditFeature:getServiceErrorMessage', arguments);

            var preface = 'Error uploading shapefile';

            if (er) {
                if (er.details) {
                    var regex = new RegExp(/Exception: (.*)/);
                    var match = regex.exec(er.details[er.details.length - 1]);
                    return preface + ': "' + match[1] + '"';
                } else if (er.message) {
                    return preface + ': "' + er.message + '"';
                }
            }

            return preface;
        },
        onCutFeatures: function (cutGeometry) {
            // summary:
            //      cut all features in the graphics layer with the cut geometry
            // cutGeometry: Line Geometry
            console.log('app.project.CreateEditFeature:onCutFeatures', arguments);

            this.graphicsLayer.graphics.forEach(function (g) {
                var newGeometries = geometryEngine.cut(g.geometry, cutGeometry);
                if (newGeometries.length > 0) {
                    var largestArea;
                    var largestGeometry;
                    newGeometries.forEach(function (geo) {
                        if (!largestArea || geometryEngine.planarArea(geo, 'square-feet') > largestArea) {
                            largestArea = geometryEngine.planarArea(geo, 'square-feet');
                            largestGeometry = geo;
                        }
                    });
                    g.setGeometry(largestGeometry);
                }
            });
        },
        onCancel: function () {
            // summary:
            //      destroy this widget and all associated data
            console.log('app.project.CreateEditFeature:onCancel', arguments);

            this.graphicsLayer.clear();

            this.emit('hide');

            topic.publish(config.topics.feature.finishEditingCreating);

            this.destroyRecursive();
        },
        onAddActionClick: function () {
            // summary:
            //      user has clicked the add action button
            console.log('app.project.CreateEditFeature:onAddActionClick', arguments);

            var params = this.getActionParams();

            var existing = this.actions.some(function (a) {
                return Object.keys(params).every(function (p) {
                    return params[p] === a[p];
                });
            });

            if (!existing) {
                this.addAction(params);

                this.resetFeatureAttributes(true);
            } else {
                topic.publish(config.topics.toast, this.duplicateActionMsg, 'warning');
            }
        },
        addAction: function (params) {
            // summary:
            //      adds an action
            // params: Object (params for new action)
            console.log('app.project.CreateEditFeature:addAction', arguments);

            var action = new Action(params, domConstruct.create('div', null, this.actionsContainer));
            this.own(action);
            this.actions.push(action);
            var that = this;
            var handle = aspect.before(action, 'destroyRecursive', function () {
                that.actions.splice(that.actions.indexOf(action), 1);
                that.validateForm();
                handle.remove();
            });
        },
        getActionParams: function () {
            // summary:
            //      get the params for a new Action from the visible form controls
            // param or return
            console.log('app.project.CreateEditFeature:getActionParams', arguments);

            var visible = function (node) {
                return !domClass.contains(node, 'hidden');
            };

            var params = {};

            if (visible(this.polyAction)) {
                params.action = this.polyActionSelect.value;
            }
            if (visible(this.type)) {
                params.type = this.typeSelect.value;
            }
            if (visible(this.treatment)) {
                params.treatment = this.treatmentSelect.value;
            }
            if (visible(this.pointLineAction)) {
                params.action = this.pointLineActionSelect.value;
            }
            if (visible(this.herbicide)) {
                params.herbicide = this.herbicideSelect.value;
            }
            if (visible(this.comments)) {
                params.description = this.commentsTxt.value;
            }

            return (Object.keys(params).length > 0) ? params : null;
        },
        onSaveClick: function () {
            // summary:
            //      gather data and submit to api
            console.log('app.project.CreateEditFeature:onSaveClick', arguments);

            var geometries = this.graphicsLayer.graphics.map(function (graphic) {
                return graphic.geometry;
            });

            if (!geometries || geometries.length < 1) {
                topic.publish(config.topics.toast, { message: 'No geometries found.', type: 'warning'});

                return;
            }

            var esriGeometry = this.reducePrecision(geometryEngine.union(geometries));
            var convert = new Wkt();
            var postData = lang.mixin(userCredentials.getUserData(),
            {
                category: this.featureCategorySelect.value,
                retreatment: this.retreatmentChBx.checked ? 'Y' : 'N',
                geometry: convert.toWkt(esriGeometry),
                actions: JSON.stringify(this.getActionsData())
            });

            var onError = function (msg) {
                topic.publish(config.topics.toast, {
                    message: msg || 'Error submitting feature to the server!',
                    type: 'danger'
                });
            };

            var projectId = router.getProjectId();
            var url = config.urls.api + '/project/' + projectId + '/feature/';
            var featureId = (this.existingData) ? this.existingData.featureId : null;
            var method = (featureId) ? 'PUT' : 'POST';
            url += featureId || 'create';
            xhr(url, {
                method: method,
                handleAs: 'json',
                headers: config.defaultXhrHeaders,
                data: postData,
                failOk: true
            }).response.then(function (response) {
                if (httpStatus.isSuccessful(response.status, method)) {
                    var responseMessage = response.data;
                    if (!response.data) {
                        var action = method === 'POST' ? 'added' : 'modified';
                        responseMessage = 'Feature ' + action + ' successfully.';
                    }

                    topic.publish(config.topics.toast, {
                        message: responseMessage,
                        type: 'success'
                    });
                    topic.publish(config.topics.projectIdsChanged, [projectId]);
                } else {
                    onError(response);
                }
            }, function (error) {
                onError(error.response.data);
            }).always(function () {
                topic.publish(config.topics.hideProjectLoader);
                topic.publish(config.topics.feature.finishEditingCreating);
            });

            topic.publish(config.topics.showProjectLoader);
        },
        getActionsData: function () {
            // summary:
            //      format action data for submission to api
            console.log('app.project.CreateEditFeature:getActionsData', arguments);

            var tempAction;
            if (this.validateForm()) {
                var params = this.getActionParams();
                if (params) {
                    tempAction = new Action(params);
                }
            }
            var actions = (tempAction) ? this.actions.concat([tempAction]) : this.actions;

            // use object to allow for easier checking for existing items
            var nestedActions = {};

            // don't need to worry about duplicates for non-nested actions
            var nonNestedActions = [];

            actions.forEach(function (a) {
                if (a.action && a.treatment) {
                    // nested action
                    if (!nestedActions[a.action]) {
                        nestedActions[a.action] = {
                            treatments: {}
                        };
                    }
                    var action = nestedActions[a.action];

                    if (a.treatment) {
                        if (!action.treatments[a.treatment]) {
                            action.treatments[a.treatment] = [a.herbicide];
                        } else {
                            action.treatments[a.treatment].push(a.herbicide);
                        }
                    }
                } else {
                    // non-nested action
                    nonNestedActions.push(a.toObject());
                }
            });

            // convert to a single array of actions
            var result = nonNestedActions.concat(Object.keys(nestedActions).map(function (action) {
                return {
                    action: action,
                    treatments: Object.keys(nestedActions[action].treatments).map(function (treatmentName) {
                        var treatment = {
                            treatment: treatmentName
                        };
                        var herbicides = nestedActions[action].treatments[treatmentName].filter(function (y) {
                            // only return defined herbicide values
                            return y;
                        });
                        if (herbicides.length > 0) {
                            treatment.herbicides = herbicides;
                        }

                        return treatment;
                    })
                };
            }));

            return (result.length > 0) ? result : null;
        },
        onBufferChange: function () {
            // summary:
            //      fires when the buffer select changes
            console.log('app.project.CreateEditFeature:onBufferChange', arguments);

            // get lines from graphics layer
            if (!this.bufferLines) {
                this.bufferLines = this.graphicsLayer.graphics.filter(function (g) {
                    return g.geometry.type === 'polyline';
                });
                this.bufferLines.forEach(function (g) {
                    this.graphicsLayer.remove(g);
                }, this);
            }
            var geometries = this.bufferLines.map(function (g) {
                return g.geometry;
            });
            var buffers = geometryEngine.geodesicBuffer(
                geometries, [parseInt(this.bufferSelect.value, 10)], 'meters', true
            );

            buffers.forEach(function (b) {
                this.onGeometryDefined(b, false, false);
            }, this);
        },
        changeOpacity: function (newValue, origin, featureId) {
            // summary:
            //      update the opacity of the graphics layer
            // newValue: Number
            // origin: String
            // featureId: Number
            console.log('app.project.CreateEditFeature:changeOpacity', arguments);

            if (this.existingData && this.existingData.featureId === featureId) {
                this.graphicsLayer.setOpacity(newValue);
            }
        },
        reducePrecision: function (geometry) {
            // summary:
            //      rounds coordinates of polygons and polylines
            // geometry: Geometry
            console.log('app.project.CreateEditFeature:reducePresision', arguments);

            var roundCoords = function (ringsOrPaths) {
                ringsOrPaths.forEach(function (r) {
                    r.forEach(function (pnt) {
                        pnt[0] = formatting.round(pnt[0], 2);
                        pnt[1] = formatting.round(pnt[1], 2);
                    });
                });
            };

            if (geometry.rings || geometry.paths) {
                roundCoords(geometry.rings || geometry.paths);
            }

            return geometry;
        }
    });
});
