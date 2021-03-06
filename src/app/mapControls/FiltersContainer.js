define([
    'app/centroidController',
    'app/config',
    'app/mapControls/Filter',
    'app/mapControls/MapReferenceData',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/text!app/mapControls/templates/FiltersContainer.html',
    'dojo/topic',
    'dojo/_base/declare',
    'dojo/_base/lang'
], function (
    centroidController,
    config,
    Filter,
    MapReferenceData,

    _TemplatedMixin,
    _WidgetBase,

    domClass,
    domConstruct,
    template,
    topic,
    declare,
    lang
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        // description:
        //      Holds filter widgets and coordinates their work
        templateString: template,
        baseClass: 'filters-container map-overlay',

        // filters: _Filter[]
        //      list of filters for this widget
        filters: null,

        // Properties to be sent into constructor

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.mapControls.FiltersContainer::postCreate', arguments);

            var statuses = config.domains.projectStatus;
            // default to no status filters on by default in multi-project view
            // otherwise turn draft and cancelled off by default
            var statusesOffByDefault = (this.multiProjectView) ? [] : statuses.filter(function (s) {
                return s !== statuses[0] && s !== statuses[5];
            }).map(function (item) {
                return item[0];
            });
            this.filters = [
                new Filter({
                    name: 'Project Status',
                    items: statuses.map(function (item) {
                        return [item[0], item[0]];
                    }),
                    fieldName: config.fieldNames.Status,
                    fieldType: Filter.TYPE_TEXT,
                    cssClass: 'status',
                    defaultToSelected: statusesOffByDefault
                }, domConstruct.create('div', null, this.container)),
                new Filter({
                    name: 'Feature Type',
                    items: config.domains.featureType,
                    fieldName: config.fieldNames.TypeCode,
                    fieldType: Filter.TYPE_NUMBER,
                    relatedTableQuery: true,
                    anyAllToggle: true,
                    cssClass: 'feature-type'
                }, domConstruct.create('div', null, this.container))
            ];
            this.filters.forEach(function (f) {
                f.on('changed', lang.hitch(this, 'onFilterChange'));
                f.startup();
                this.own(f);
            }, this);

            // startups and deps are all fouled up. Need to set on object
            // for first pageload since topic is not caught
            centroidController._projectAndFeatureFilter = centroidController.filter = this.onFilterChange();

            var mapReferenceData = new MapReferenceData({}).placeAt(this.container);
            this.own(mapReferenceData);
            mapReferenceData.startup();

            this.setUpConnections();

            this.inherited(arguments);
        },
        setUpConnections: function () {
            // summary:
            //      description
            console.log('app.mapControls:setUpConnections', arguments);

            this.own(topic.subscribe(config.topics.projectIdsChanged,
                lang.hitch(this, 'onProjectIdsChanged')));
        },
        onProjectIdsChanged: function (ids) {
            // summary:
            //      hide or show this widget
            // ids: String[]
            console.log('app.mapControls:onProjectIdsChanged', arguments);

            if (ids) {
                domClass.toggle(this.domNode, 'hidden', (ids.length === 1));
            }
        },
        onFilterChange: function () {
            // summary:
            //      builds a def query and/or geometry and sends it to the map controller
            console.log('app/mapControls/FilterContainer:onFilterChange', arguments);

            var wheres = [];
            this.filters.forEach(function (f) {
                var query = f.getQuery();
                if (query) {
                    wheres.push(query);
                }
            });

            var where = (wheres.length) ? wheres.join(' AND ') : undefined;
            topic.publish(config.topics.filterQueryChanged, {
                projectAndFeatureFilter: where
            });

            return where;
        }
    });
});
