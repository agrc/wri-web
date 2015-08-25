define([
    'app/config',
    'app/mapControls/LayerControls',
    'app/project/FeatureDetails',
    'app/project/FeaturesGrid',
    'app/project/ProjectDetails',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/dom-class',
    'dojo/dom-style',
    'dojo/on',
    'dojo/on/throttle',
    'dojo/request/xhr',
    'dojo/text!app/project/templates/ProjectContainer.html',
    'dojo/topic',
    'dojo/window',
    'dojo/_base/declare',
    'dojo/_base/lang'
], function (
    config,
    LayerControls,
    FeatureDetails,
    FeaturesGrid,
    ProjectDetails,

    _TemplatedMixin,
    _WidgetBase,

    domClass,
    domStyle,
    on,
    throttle,
    xhr,
    template,
    topic,
    win,
    declare,
    lang
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        // description:
        //      The container to hold and manage all the widgets for working with projects
        templateString: template,
        baseClass: 'project-container map-overlay',

        // displayTimer: Number
        //      The timer that delays the display of the progress bar
        displayTimer: null,


        // Properties to be sent into constructor

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.project.ProjectContainer::postCreate', arguments);

            this.childWidgets = [];

            this.setupConnections();

            this.childWidgets.push(new LayerControls({}, this.referenceLayerNode));

            this._resetHeight();

            this.inherited(arguments);
        },
        setupConnections: function () {
            // summary:
            //      wire events, and such
            console.log('app.project.ProjectContainer::setupConnections', arguments);

            this.own(
                topic.subscribe(config.topics.projectIdsChanged,
                     lang.hitch(this, 'showDetailsForProject')),
                on(window, throttle('resize', 1000), lang.hitch(this, '_resetHeight'))
            );
        },
        showDetailsForProject: function (ids) {
            // summary:
            //      determines whether to to query for projects and show itself
            // ids: an array of project id's
            console.log('app.project.ProjectContainer::showDetailsForProject', arguments);

            [this.featureDetails, this.projectDetails, this.featuresGrid].forEach(function (widget) {
                if (widget) {
                    widget.destroy();
                }
            });

            if (!ids || ids.length !== 1) {
                domClass.toggle(this.domNode, 'hidden', ids && ids.length !== 1);

                return;
            }

            this.currentProject = ids[0];

            var that = this;
            this._queryForProjectDetails(ids[0]).then(
                lang.hitch(this, '_updateDetails'),
                function (response) {
                    console.warn('wri web api request failed ' + response);
                    topic.publish(config.topics.toast, {
                        message: 'There was an error getting project details!',
                        type: 'danger'
                    });
                    that.clearTimer();
                    domClass.add(that.domNode, 'hidden');
                });
        },
        clearTimer: function () {
            // summary:
            //      clears the display timer if it exists
            console.log('app.project.ProjectContainer:clearTimer', arguments);

            if (this.displayTimer) {
                window.clearTimeout(this.displayTimer);
            }
        },
        _queryForProjectDetails: function (id) {
            // summary:
            //      query api for project informations
            // id
            console.log('app.project.ProjectContainer::_queryForProjectDetails', arguments);

            var that = this;
            this.displayTimer = window.setTimeout(function () {
                domClass.remove(that.loadingNode, 'hidden');
                domClass.remove(that.domNode, 'hidden');
            }, 500);

            domClass.add(this.errorNode, 'hidden');
            domClass.add(this.contentNode, 'hidden');

            return xhr.get(config.urls.api + '/project/' + id, {
                handleAs: 'json',
                headers: { 'Accept': 'application/json' }
            }).then(function (response) {
                that.clearTimer();

                return response;
            });
        },
        _updateDetails: function (response) {
            // summary:
            //      refreshes the widget data for a new project
            // response
            console.log('app.project.ProjectContainer::_updateDetails', arguments);

            domClass.toggle(this.errorNode, 'hidden', response.project);
            domClass.add(this.loadingNode, 'hidden');
            domClass.remove(this.domNode, 'hidden');

            if (!response.project) {
                this.errorNode.innerHTML = 'We could not find a project with the id: ' + this.currentProject + '.';

                return;
            }

            this.projectDetails = new ProjectDetails(response.project).placeAt(this.detailsNode);
            this.featureDetails = new FeatureDetails(response.project).placeAt(this.featureDetailsNode);
            this.featuresGrid = new FeaturesGrid({
                features: response.features
            }).placeAt(this.featureGridNode);

            domClass.remove(this.contentNode, 'hidden');

            this.featureDetails.startup();
            this.projectDetails.startup();
            this.featuresGrid.startup();
            this.featuresGrid.grid.startup();
        },
        _resetHeight: function () {
            // summary:
            //      resizes the div to fit the screen on window resize
            console.log('app.project.ProjectContainer::_resetHeight', arguments);

            var maxHeight = win.getBox().h - 250;
            domStyle.set(this.domNode, 'maxHeight', maxHeight + 'px');
        },
        startup: function () {
            // summary:
            //      Fires after postCreate when all of the child widgets are finished laying out.
            console.log('app.project.ProjectContainer::startup', arguments);

            var that = this;
            this.childWidgets.forEach(function (widget) {
                that.own(widget);
                widget.startup();
            });

            this.inherited(arguments);
        }
    });
});
