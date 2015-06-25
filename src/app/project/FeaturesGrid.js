define([
    'dgrid/OnDemandGrid',
    'dgrid/Tree',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',
    'dijit/_WidgetsInTemplateMixin',

    'dojo/_base/declare',
    'dojo/aspect',
    'dojo/dom-class',
    'dojo/text!app/project/templates/FeaturesGrid.html',

    'dstore/Memory',
    'dstore/Tree'
], function (
    Grid,
    Tree,

    _TemplatedMixin,
    _WidgetBase,
    _WidgetsInTemplateMixin,

    declare,
    aspect,
    domClass,
    template,

    Memory,
    DStoreTree
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        // description:
        //      A grid that shows all of the features for the selected project
        templateString: template,
        baseClass: 'features-grid',
        widgetsInTemplate: true,

        // Properties to be sent into constructor

        // features: Object[]
        // {
        //     id: Number, // unique
        //     type: String,
        //     subType: String,
        //     action: String,
        //     origin: String (point, line, poly),
        //     parent: Number,
        //     featureId: Number
        //     size: String
        // }
        features: null,

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.project.FeaturesGrid::postCreate', arguments);

            var columns = {
                id: 'Unique ID',
                type: {
                    label: 'Feature Type',
                    renderExpando: true
                },
                action: 'Action',
                subType: 'Treatment/Type'
            };

            var store = new (declare([Memory, DStoreTree]))({
                data: this.features
            });

            this.grid = new (declare([Grid, Tree]))({
                columns: columns,
                collection: store.getRootCollection(),
                shouldExpand: function () {
                    return true;
                }
            }, this.gridDiv);

            aspect.after(this.grid, 'renderRow', function (row, args) {
                console.log('args', args);
                if (!args[0].hasChildren) {
                    domClass.add(row, 'selectable');
                }

                return row;
            });

            // what is this for?
            // this.grid.set('collection', store.getRootCollection());
            // this.grid.refresh();

            this.setupConnections();

            this.inherited(arguments);
        },
        setupConnections: function () {
            // summary:
            //      wire events, and such
            console.log('app.project.FeaturesGrid::setupConnections', arguments);

        }
    });
});
