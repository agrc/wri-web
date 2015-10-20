define([
    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/dom-class',
    'dojo/text!app/project/templates/Action.html',
    'dojo/_base/declare'
], function (
    _TemplatedMixin,
    _WidgetBase,

    domClass,
    template,
    declare
) {
    var props = ['type', 'treatment', 'action', 'description', 'herbicide'];

    return declare([_WidgetBase, _TemplatedMixin], {
        // description:
        //      Container for holding action data
        templateString: template,
        baseClass: 'action alert alert-info',

        // Properties to be sent into constructor

        // type: String
        type: null,

        // treatment: String
        treatment: null,

        // action: String
        action: null,

        // herbicide: String
        herbicide: null,

        // description: String (optional)
        description: null,

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.project.Action::postCreate', arguments);

            // show only controls for which there was data passed
            props.forEach(function (v) {
                if (this[v] !== null) {
                    domClass.remove(this[v + 'Li'], 'hidden');
                }
            }, this);

            this.inherited(arguments);
        },
        onClose: function () {
            // summary:
            //      destroy this widget
            console.log('app.project.Action:onClose', arguments);

            this.destroyRecursive(false);
        },
        toObject: function () {
            // summary:
            //      convert the properties of this widget to an object
            console.log('app.project.Action:toObject', arguments);

            var obj = {};
            props.forEach(function (p) {
                if (this[p]) {
                    obj[p] = this[p];
                }
            }, this);

            return obj;
        }
    });
});
