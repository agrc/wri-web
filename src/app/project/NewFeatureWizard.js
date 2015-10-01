define([
    'app/config',
    'app/project/Action',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',
    'dijit/_WidgetsInTemplateMixin',

    'dojo/aspect',
    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/query',
    'dojo/text!app/project/templates/NewFeatureWizard.html',
    'dojo/topic',
    'dojo/_base/declare',
    'dojo/_base/lang',

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
    Action,

    _TemplatedMixin,
    _WidgetBase,
    _WidgetsInTemplateMixin,

    aspect,
    domClass,
    domConstruct,
    query,
    template,
    topic,
    declare,
    lang,

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

    var loadItemsIntoSelect = function (items, select) {
        // summary:
        //      add the items as options to the select
        // items: String[]
        // select: Select Dom Node

        items.forEach(function (item) {
            domConstruct.create('option', {
                innerHTML: item,
                value: item
            }, select);
        });
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
    };

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        // description:
        //      Wizard for adding new features to a project.
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

        // Properties to be sent into constructor

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.project.NewFeatureWizard::postCreate', arguments);

            this.actions = [];

            loadItemsIntoSelect(config.domains.featureType.map(function (category) {
                return category[0];
            }), this.featureCategorySelect);

            this.gp = new Geoprocessor(config.urls.zipToGraphics);

            this.graphicsLayer = new GraphicsLayer();
            this.own(
                this.graphicsLayer.on('click', function (evt) {
                    topic.publish(config.topics.feature.selectedForEditing, evt.graphic);
                }),
                topic.subscribe(config.topics.feature.drawingComplete, lang.hitch(this, 'onGeometryDefined')),
                topic.subscribe(config.topics.feature.cutFeatures, lang.hitch(this, 'onCutFeatures')),
                topic.subscribe(config.topics.feature.cancelDrawing, lang.hitch(this, 'onCancelDrawing')),
                query('select, textarea, checkbox', this.featureAttributesDiv)
                    .on('change', lang.hitch(this, 'validateForm'))
            );
            topic.publish(config.topics.layer.add, {
                graphicsLayers: [this.graphicsLayer],
                dynamicLayers: []
            });

            loadItemsIntoSelect(config.domains.herbicides, this.herbicideSelect);

            this.inherited(arguments);
        },
        validateForm: function () {
            // summary:
            //      check for required fields and enables/disables save and add buttons accordingly
            console.log('app.project.NewFeatureWizard:validateForm', arguments);

            var category = this.featureCategorySelect.value !== '';
            var requiredActionFields = query('.form-group:not(.hidden) select, .form-group:not(.hidden) textarea',
                                             this.featureAttributesDiv);
            var populatedActionFields = requiredActionFields.filter(function (s) {
                return s.value !== '';
            });
            var valid = (
                category &&
                populatedActionFields.length === requiredActionFields.length &&
                this.graphicsLayer.graphics.length > 0
            );

            this.addActionBtn.disabled = !valid;
            this.saveBtn.disabled = !(
                valid ||
                (this.actions.length > 0 && category && populatedActionFields.length === 0)
            );
        },
        onCancelDrawing: function () {
            // summary:
            //      restore original graphics
            console.log('app.project.NewFeatureWizard:onCancelDrawing', arguments);

            this.graphicsLayer.clear();
            this.originalGraphicJsons.forEach(function (json) {
                this.graphicsLayer.add(new Graphic(json));
            }, this);
        },
        onFeatureCategoryChange: function () {
            // summary:
            //      shows or hides the drawing buttons
            console.log('app.project.NewFeatureWizard:onFeatureCategoryChange', arguments);

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
                loadItemsIntoSelect(config.domains.pointLineActions, this.pointLineActionSelect);
                if (items.length > 0) {
                    loadItemsIntoSelect(items, this.typeSelect);
                    domClass.remove(this.typeSelect.parentElement, 'hidden');
                } else {
                    domClass.add(this.typeSelect.parentElement, 'hidden');
                }

                domClass.remove(this.pointLineActionSelect.parentElement, 'hidden');
            } else {
                // polygon actions
                var actions = [];
                for (var action in items) {
                    if (items.hasOwnProperty(action)) {
                        actions.push(action);
                    }
                }
                loadItemsIntoSelect(actions, this.polyActionSelect);
                domClass.remove(this.polyActionSelect.parentElement, 'hidden');
                domClass.remove(this.treatmentSelect.parentElement, 'hidden');
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
            console.log('app.project.NewFeatureWizard:onUploadClick', arguments);

            $(this.uploadDiv).collapse('show');
        },
        onFileSelected: function () {
            // summary:
            //      update controls after a file is selected for upload
            console.log('app.project.NewFeatureWizard:onFileSelected', arguments);

            this.uploadTxtBox.value = this.fileUploadInput.value.replace(/.*\\/, '');
            this.uploadBtn.disabled = false;
            $(this.uploadBtn).button('reset');
        },
        onUpload: function () {
            // summary:
            //      uploads the zip file
            console.log('app.project.NewFeatureWizard:onUpload', arguments);

            this.graphicsLayer.clear();
            $(this.uploadBtn).button('loading');

            var onError = function (er) {
                topic.publish(config.topics.toast, {
                    message: that.getServiceErrorMessage(er),
                    type: 'danger'
                });
                $(that.uploadBtn).button('reset');
            };

            var that = this;
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
            console.log('app.project.NewFeatureWizard:onDrawClick', arguments);

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
            console.log('app.project.NewFeatureWizard:onGeometryDefined', arguments);

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

            this.validateForm();
        },
        onPolyActionSelectChange: function () {
            // summary:
            //      update the treatment appropriate for the selected action
            // param or return
            console.log('app.project.NewFeatureWizard:onPolyActionSelectChange', arguments);

            clearSelect(this.treatmentSelect);
            loadItemsIntoSelect(
                config.domains.featureAttributes[this.featureCategorySelect.value][this.polyActionSelect.value], this.treatmentSelect);

            var showHerb = this.polyActionSelect.value.toUpperCase() === config.herbicideActionName;
            domClass.toggle(this.herbicide, 'hidden', !showHerb);
        },
        resetFeatureAttributes: function (preserveVisibility) {
            // summary:
            //      clears all of the form controls
            console.log('app.project.NewFeatureWizard:resetFeatureAttributes', arguments);

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
            console.log('app.project.NewFeatureWizard:getServiceErrorMessage', arguments);

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
            console.log('app.project.NewFeatureWizard:onCutFeatures', arguments);

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
            console.log('app.project.NewFeatureWizard:onCancel', arguments);

            this.graphicsLayer.clear();

            this.emit('hide');

            this.destroyRecursive();
        },
        onAddActionClick: function () {
            // summary:
            //      user has clicked the add action button
            console.log('app.project.NewFeatureWizard:onAddActionClick', arguments);

            var visible = function (node) {
                return !domClass.contains(node, 'hidden');
            };

            var params = {};
            if (visible(this.polyAction)) {
                params.type = this.polyActionSelect.value;
            } else if (visible(this.type)) {
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
                params.comments = this.commentsTxt.value;
            }

            var existing = this.actions.some(function (a) {
                var match;
                Object.keys(params).forEach(function (p) {
                    match = params[p] === a[p];
                    if (!match) {
                        return false;
                    }
                });
                return match;
            });

            if (!existing) {
                var action = new Action(params, domConstruct.create('div', null, this.actionsContainer));
                this.own(action);
                this.actions.push(action);
                var that = this;
                var handle = aspect.before(action, 'destroyRecursive', function () {
                    that.actions.splice(that.actions.indexOf(action), 1);
                    handle.remove();
                });

                this.resetFeatureAttributes(true);
            } else {
                topic.publish(config.topics.toast, this.duplicateActionMsg, 'warning');
            }
        },
        onSaveClick: function () {
            // summary:
            //      gather data and submit to api
            console.log('app.project.NewFeatureWizard:onSaveClick', arguments);


        }
    });
});
