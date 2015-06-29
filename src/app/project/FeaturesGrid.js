define([
    'app/config',
    'app/project/OpacitySlider',

    'dgrid/OnDemandGrid',
    'dgrid/Tree',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',
    'dijit/_WidgetsInTemplateMixin',

    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/aspect',
    'dojo/dom-class',
    'dojo/text!app/project/templates/FeaturesGrid.html',
    'dojo/topic',

    'dstore/Memory',
    'dstore/Tree'
], function (
    config,
    OpacitySlider,

    Grid,
    Tree,

    _TemplatedMixin,
    _WidgetBase,
    _WidgetsInTemplateMixin,

    declare,
    lang,
    aspect,
    domClass,
    template,
    topic,

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
        //     featureId: Number,
        //     size: String,
        //     hasChildren: Boolean
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
                subType: 'Treatment/Type',
                opacity: {
                    label: 'Opacity',
                    renderCell: function (data) {
                        if ((!data.hasChildren && !data.parent) || data.hasChildren) {
                            var stripped = lang.clone(data);
                            delete stripped.id;
                            var slider = new OpacitySlider(stripped);
                            slider.startup();
                            return slider.domNode;
                        }
                    }
                }
            };

            var store = new (declare([Memory, DStoreTree]))({});

            this.grid = new (declare([Grid, Tree]))({
                columns: columns,
                collection: store.getRootCollection(),
                shouldExpand: function () {
                    return true;
                }
            }, this.gridDiv);

            aspect.after(this.grid, 'renderRow', function (row, args) {
                if (!args[0].hasChildren) {
                    domClass.add(row, 'selectable');
                }

                return row;
            });

            // Sets up the selectable stuff above with the aspect.
            store.setData(this.features);
            this.grid.set('collection', store.getRootCollection());
            this.grid.refresh();

            this.setupConnections();

            this.inherited(arguments);
        },
        setupConnections: function () {
            // summary:
            //      wire events, and such
            console.log('app.project.FeaturesGrid::setupConnections', arguments);

            var that = this;
            this.own(
                this.grid.on('.dgrid-row.selectable:click', function (evt) {
                    topic.publish(config.topics.featureSelected, that.grid.row(evt).data);
                })
            );
        }
    });
});
