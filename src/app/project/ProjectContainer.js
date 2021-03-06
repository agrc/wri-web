define([
    'app/config',
    'app/mapControls/LayerControls',
    'app/project/FeatureDetails',
    'app/project/FeaturesGrid',
    'app/project/ProjectDetails',
    'app/project/userCredentials',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/dom-class',
    'dojo/dom-style',
    'dojo/on',
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
    userCredentials,

    _TemplatedMixin,
    _WidgetBase,

    domClass,
    domStyle,
    on,
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

        // projectDetailsRequest: Promise
        //      The promise returns by the xhr request
        projectDetailsRequest: null,


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

            var that = this;
            this.own(
                topic.subscribe(config.topics.projectIdsChanged,
                    lang.hitch(this, 'showDetailsForProject')),
                on(window, 'resize', lang.hitch(this, '_resetHeight')),
                topic.subscribe(config.topics.feature.startDrawing,
                    lang.partial(lang.hitch(this, 'toggle'), true)),
                topic.subscribe(config.topics.feature.drawEditComplete,
                    lang.partial(lang.hitch(this, 'toggle'), false)),
                on(this.closeNode, 'click', function () {
                    // this is to prevent the click event from being passed to toggle
                    that.toggle();
                }),
                topic.subscribe(config.topics.showProjectLoader,
                    lang.hitch(this, '_showLoader')),
                topic.subscribe(config.topics.hideProjectLoader,
                    lang.hitch(this, '_hideLoader'))
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
        toggle: function (hide) {
            // summary:
            //      hides the container to be able to view the map
            //
            // hide: Boolean (optional)
            console.log('app.project.ProjectContainer:hide', arguments);

            domClass.toggle(this.domNode, 'mini', hide);
            domClass.toggle(this.closeNode, 'mini', hide);
            domClass.toggle(this.contentNode, 'hidden', hide);
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

            this._showLoader();

            // cancel any in flight requests
            if (this.projectDetailsRequest && !this.projectDetailsRequest.isFulfilled()) {
                this.projectDetailsRequest.cancel();
            }

            var that = this;
            this.projectDetailsRequest = xhr.get(config.urls.api + '/project/' + id, {
                handleAs: 'json',
                headers: config.defaultXhrHeaders,
                query: userCredentials.getUserData()
            }).then(function (response) {
                that.clearTimer();

                return response;
            }, function () {
                topic.publish(config.topics.toast, {
                    message: 'Error with project api',
                    type: 'danger'
                });
            });
            return this.projectDetailsRequest;
        },
        _showLoader: function () {
            // summary:
            //      hides all content and shows the loader bar
            console.log('app.project.ProjectContainer:_showLoader', arguments);

            // clear any previous timers to make sure that they do not slip by
            this.clearTimer();

            var that = this;
            this.displayTimer = window.setTimeout(function () {
                domClass.remove(that.loadingNode, 'hidden');
                domClass.remove(that.domNode, 'hidden');
            }, 500);

            domClass.add(this.errorNode, 'hidden');
            domClass.add(this.contentNode, 'hidden');
            domClass.add(this.closeNode, 'hidden');
        },
        _hideLoader: function () {
            // summary:
            //      shows the content and hides the loader
            console.log('app.project.ProjectContainer:_hideLoader', arguments);

            this.clearTimer();

            domClass.add(this.loadingNode, 'hidden');
            domClass.remove(this.closeNode, 'hidden');
            domClass.remove(this.domNode, 'hidden');
            domClass.remove(this.contentNode, 'hidden');
        },
        _updateDetails: function (response) {
            // summary:
            //      refreshes the widget data for a new project
            // response
            console.log('app.project.ProjectContainer::_updateDetails', arguments);

            domClass.toggle(this.errorNode, 'hidden', response.project);

            this._hideLoader();

            if (!response.project) {
                domClass.add(this.contentNode, 'hidden');
                domClass.add(this.closeNode, 'hidden');
                this.errorTxt.innerHTML = 'We could not find a project with the id of "' + this.currentProject + '".';

                return;
            }

            response.project.allowEdits = response.allowEdits;
            this.projectDetails = new ProjectDetails(response.project).placeAt(this.detailsNode);
            this.featureDetails = new FeatureDetails(response.project).placeAt(this.featureDetailsNode);
            this.featuresGrid = new FeaturesGrid({
                features: response.features
            }).placeAt(this.featureGridNode);

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
