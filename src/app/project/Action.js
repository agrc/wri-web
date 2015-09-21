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

        // retreatment: String (true | false) (optional)
        //      string value of the checked state of the checkbox
        retreatment: null,

        // action: String
        action: null,

        // comments: String (optional)
        comments: null,

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.project.Action::postCreate', arguments);

            // show only controls for which there was data passed
            ['type', 'treatment', 'retreatment', 'action', 'comments'].forEach(function (v) {
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
        }
    });
});
