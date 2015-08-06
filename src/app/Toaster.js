define([
    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'app/ToasterItem',

    'dojo/aspect',
    'dojo/text!app/templates/Toaster.html',
    'dojo/topic',
    'dojo/_base/declare',
    'dojo/_base/lang'
], function (
    _TemplatedMixin,
    _WidgetBase,

    ToasterItem,

    aspect,
    template,
    topic,
    declare,
    lang
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        // description:
        //      a toaster notification widget
        templateString: template,
        baseClass: 'toaster',

        // maxItems: Number
        //		The max number of items to show
        maxItems: 5,

        // topic: String
        //		Name of topic; anything published to this topic will be displayed as a message.
        //		Message format is either String or an object like
        //		{message: 'hello word', type: 'error'}
        topic: 'app/Toaster',

        // allowableClasses: array
        //		The css classes that will work properly with bootstrap
        allowableClasses: [
        'info',
        'success',
        'warning',
        'danger'
        ],

        // defaultClass: String
        //		The default class to use when none is passed in
        defaultClass: 'info',

        // Properties to be sent into constructor

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.Toaster::postCreate', arguments);

            this.toasterItems = [];

            this.setupConnections();

            this.inherited(arguments);
        },
        setupConnections: function () {
            // summary:
            //      wire events, and such
            console.log('app.Toaster::setupConnections', arguments);

            this.own(
                topic.subscribe(this.topic, lang.hitch(this, 'handleMessage'))
            );
        },
        handleMessage: function (message) {
            // summary:
            //      handles the message and sets default arguments
            // {message: type:}
            console.log('app.Toaster:handleMessage', arguments);

            if (lang.isString(message)) {
                this.setContent(message, this.defaultClass);
            } else {
                var cssClass = message.type;
                if (!cssClass || this.allowableClasses.indexOf(cssClass) < 0) {
                    console.warn('app.Toaster::message css class [' + cssClass +
                                 '] is not in allowableClasses. Falling back to defaultClass.');
                    cssClass = this.defaultClass;
                }

                this.setContent(message.message, cssClass);
            }
        },
        setContent: function (message, cssClass) {
            // summary:
            //      description
            // the message and it's css class
            console.log('app.Toaster:setContent', arguments);

            if (message) {
                if (this.isDuplicate(this.toasterItems, message, cssClass)) {
                    return;
                }

                var item = new ToasterItem({
                    message: message,
                    cssClass: cssClass
                }).placeAt(this.domNode, 'first');


                if (this.toasterItems.length >= this.maxItems) {
                    var entry = this.toasterItems[0];
                    entry.destroyRecursive(false);
                }

                this.toasterItems.push(item);
                item.show();

                var connection;
                connection = aspect.before(item, 'destroyRecursive', lang.hitch(this, function () {
                    this.toasterItems = this.toasterItems.slice(1);

                    connection.remove();
                }));
            }
        },
        isDuplicate: function (items, message, cssClass) {
            // summary:
            //      returns true or false if there is a duplicate
            // the message text and css class
            console.log('app.Toaster:isDuplicate', arguments);

            return items.some(function (item) {
                return item.message + item.cssClass === message + cssClass;
            });
        }
    });
});
