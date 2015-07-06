define([
    'app/config',
    'app/mapControls/Filter',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/dom-construct',
    'dojo/text!app/mapControls/templates/FiltersContainer.html',
    'dojo/topic'
], function (
    config,
    Filter,

    _TemplatedMixin,
    _WidgetBase,

    declare,
    lang,
    domConstruct,
    template,
    topic
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        // description:
        //      Holds filter widgets and coordinates their work
        templateString: template,
        baseClass: 'filters-container',

        // filters: _Filter[]
        //      list of filters for this widget
        filters: null,

        // Properties to be sent into constructor

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.mapControls.FiltersContainer::postCreate', arguments);

            this.filters = [
                new Filter({
                    name: 'Project Status',
                    items: config.domains.projectStatus.map(function (item) {
                        return [item, item];
                    }),
                    fieldName: config.fieldNames.Status,
                    fieldType: Filter.TYPE_TEXT
                }, domConstruct.create('div', null, this.container)),
                new Filter({
                    name: 'Feature Type',
                    items: config.domains.featureType,
                    fieldName: config.fieldNames.TypeCode,
                    fieldType: Filter.TYPE_NUMBER,
                    relatedTableQuery: true,
                    anyAllToggle: true
                }, domConstruct.create('div', null, this.container))
            ];
            this.filters.forEach(function (f) {
                f.startup();
                this.own(f);
                f.on('changed', lang.hitch(this, 'onFilterChange'));
            }, this);

            this.inherited(arguments);
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
            topic.publish(config.topics.filterQueryChanged, where);
            console.log('where', where);
        }
    });
});
