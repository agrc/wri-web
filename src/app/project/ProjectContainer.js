define([
    'app/config',
    'app/project/FeaturesGrid',
    'app/project/ProjectDetails',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/dom-class',
    'dojo/dom-style',
    'dojo/on',
    'dojo/on/throttle',
    'dojo/request/xhr',
    'dojo/text!app/project/templates/ProjectContainer.html',
    'dojo/topic',
    'dojo/window'
], function (
    config,
    FeaturesGrid,
    ProjectDetails,

    _TemplatedMixin,
    _WidgetBase,

    declare,
    lang,
    domClass,
    domStyle,
    on,
    throttle,
    xhr,
    template,
    topic,
    win
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        // description:
        //      The container to hold and manage all the widgets for working with projects
        templateString: template,
        baseClass: 'project-container',

        // Properties to be sent into constructor

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.project.ProjectContainer::postCreate', arguments);

            this.setupConnections();

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

            if (!ids || ids.length !== 1) {
                domClass.add(this.domNode, 'hidden');
                return;
            }

            this._queryForProjectDetails(ids[0]).then(
                lang.hitch(this, '_updateDetails'),
                function handleError(response) {
                    console.warn('wri web api request failed ' + response);
                });
        },
        _queryForProjectDetails: function (id) {
            // summary:
            //      query api for project informations
            // id
            console.log('app.project.ProjectContainer::_queryForProjectDetails', arguments);

            return xhr.get(config.urls.api + '/project/' + id, {
                handleAs: 'json',
                headers: { 'Accept': 'application/json' }
            });
        },
        _updateDetails: function (response) {
            // summary:
            //      refreshes the widget data for a new project
            // response
            console.log('app.project.ProjectContainer::_updateDetails', arguments);

            if (this.projectDetails) {
                this.projectDetails.destroy();
                this.featuresGrid.destroy();

                this.projectDetails = null;
                this.featuresGrid = null;
            }

            this.projectDetails = new ProjectDetails(response.project).placeAt(this.detailsNode);
            this.featuresGrid = new FeaturesGrid({
                features: response.features
            }).placeAt(this.featureGridNode);

            domClass.remove(this.domNode, 'hidden');

            this.projectDetails.startup();
            this.featuresGrid.startup();
            this.featuresGrid.grid.startup();
        },
        _resetHeight: function () {
            // summary:
            //      resizes the div to fit the screen on window resize
            console.log('app.project.ProjectContainer::_resetHeight', arguments);

            var maxHeight = win.getBox().h - 241;
            domStyle.set(this.domNode, 'maxHeight', maxHeight + 'px');
        }
    });
});
