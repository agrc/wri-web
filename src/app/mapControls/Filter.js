define([
    'app/config',
    'app/mapControls/_CollapsePanel',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/on',
    'dojo/query',
    'dojo/text!app/mapControls/templates/Filter.html',

    'bootstrap-stylus/js/button',
    'bootstrap-stylus/js/collapse',
    'bootstrap-stylus/js/tooltip',
    'bootstrap-stylus/js/transition'
], function (
    config,
    _CollapsePanel,

    _TemplatedMixin,
    _WidgetBase,

    declare,
    lang,
    domClass,
    domConstruct,
    on,
    query,
    template
) {
    var c = declare([_WidgetBase, _TemplatedMixin, _CollapsePanel], {
        // description:
        //      A control for filtering by a defined set of choices.
        //      Allows selection of one or more choices.


        templateString: template,
        baseClass: 'filter panel panel-default',

        // selectedValues: String[]
        //      The currently selected items
        selectedValues: null,

        // any: Boolean
        //      any or all
        any: true,

        relatedAnyTxt: ['{{fieldName}} IN(SELECT {{fieldName}} FROM POINT WHERE {{query}} ',
            'union SELECT {{fieldName}} FROM LINE WHERE {{query}} ',
            'union SELECT {{fieldName}} FROM POLY WHERE {{query}})'
        ].join('').replace(/{{fieldName}}/g, config.fieldNames.Project_ID),


        // properties passed in via the constructor

        // items: [String, String][]
        //      description, value pairs
        items: null,

        // fieldName: String
        //      The name of the field associated with this filter
        fieldName: null,

        // fieldType: String (see TYPE* constants below)
        //      The type of the field so that we can build a proper query
        fieldType: null,

        // anyAllToggle: Boolean (default: false)
        //      If true the any/all toggle buttons appear
        anyAllToggle: false,

        // relatedTableQuery: Boolean (default: false)
        //      If true this is a query on related tables
        relatedTableQuery: false,

        constructor: function () {
            // summary:
            //      apply base class
            console.log('app/mapControls/Filter:constructor', arguments);

            this.selectedValues = [];
        },
        postCreate: function () {
            // summary:
            //      build bubbles
            console.log('app/mapControls/Filter:postCreate', arguments);

            this.items.forEach(function (item) {
                var lbl = domConstruct.create('label', {
                    'class': 'btn btn-default btn-xs',
                    innerHTML: item[0],
                    'onclick': lang.partial(lang.hitch(this, 'itemClicked'), item[1])
                }, this.buttonContainer);
                domConstruct.create('input', {
                    type: 'checkbox',
                    autocomplete: 'off'
                }, lbl, 'first');
            }, this);

            if (this.anyAllToggle) {
                domClass.remove(this.anyAllGroup, 'hidden');
            }

            $('[data-toggle="tooltip"]', this.domNode).tooltip({
                delay: {
                    show: 750,
                    hide: 100
                },
                container: 'body',
                html: true,
                placement: 'bottom'
            });
            this.inherited(arguments);
        },
        clear: function () {
            // summary:
            //      unselects all buttons
            console.log('app/mapControls/Filter:clear', arguments);

            query('.btn', this.buttonContainer).forEach(function (btn) {
                domClass.remove(btn, 'active');
                btn.setAttribute('aria-pressed', false);
            });

            this.numSpan.innerHTML = 0;
            this.selectedValues = [];
            this.emit('changed');
        },
        itemClicked: function (value) {
            // summary:
            //      description
            // value: String
            //      value of the item that was clicked
            console.log('app/mapControls/Filter:itemClicked', arguments);

            var index = this.selectedValues.indexOf(value);
            if (index === -1) {
                this.selectedValues.push(value);
            } else {
                this.selectedValues.splice(index, 1);
            }

            this.numSpan.innerHTML = this.selectedValues.length;

            this.emit('changed');
        },
        getQuery: function () {
            // summary:
            //      assembles all selected values into a def query
            console.log('app/mapControls/Filter:getQuery', arguments);

            if (this.selectedValues.length) {
                var values;
                if (this.fieldType === c.TYPE_TEXT) {
                    values = this.selectedValues.map(function (v) {
                        return "'" + v + "'";
                    });
                } else {
                    values = this.selectedValues;
                }
                if (this.any) {
                    var where = this.fieldName + ' IN(' + values.join(',') + ')';
                    return (!this.relatedTableQuery) ?
                        where : this.relatedAnyTxt.replace(/{{query}}/g, where);
                } else {
                    if (this.relatedTableQuery) {
                        var layerTypes = {};
                        values.forEach(function (v) {
                            var table = config.featureTypesInTables[v];
                            if (!layerTypes[table]) {
                                layerTypes[table] = [v];
                            } else {
                                layerTypes[table].push(v);
                            }
                        });
                        var subQueries = Object.keys(layerTypes).map(function (table) {
                            return 'SELECT ' + config.fieldNames.Project_ID + ' FROM ' + table +
                                ' WHERE ' + this.fieldName + ' IN(' + layerTypes[table].join(',') + ')';
                        }, this);
                        return config.fieldNames.Project_ID + ' IN(' + subQueries.join(' intersect ') + ')';
                    } else {
                        var that = this;
                        return values.reduce(function (previousReturn, currentValue) {
                            var where = that.fieldName + '=' + currentValue;
                            if (!previousReturn) {
                                return where;
                            } else {
                                return previousReturn + ' AND ' + where;
                            }
                        }, false);
                    }
                }
            } else {
                return undefined;
            }
        },
        toggleAny: function () {
            // summary:
            //      description
            console.log('app/mapControls/Filter:toggleAny', arguments);

            // add this to the bottom of the event loop to make sure that
            // bootstrap has added the 'active' class to the button
            var that = this;
            setTimeout(function () {
                that.any = domClass.contains(that.anyBtn, 'active');
                that.emit('changed');
            }, 0);
        },
        remove: function () {
            // summary:
            //      removes widget from visible filters
            console.log('app/mapControls/Filter:remove', arguments);

            this.clear();

            this.emit('removed', this);
        },
        open: function () {
            // summary:
            //      opens the body of the filter
            console.log('app/mapControls/Filter:open', arguments);

            $(this.body).collapse('show');

            this.inherited(arguments);
        }
    });

    // CONSTANTS
    c.TYPE_TEXT = 'text';
    c.TYPE_NUMBER = 'number';

    return c;
});