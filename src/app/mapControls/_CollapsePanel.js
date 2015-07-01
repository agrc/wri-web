define([
    'dojo/_base/declare',
    'dojo/on'
], function (
    declare,
    on
) {
    return declare([], {
        constructor: function () {
            // summary:
            //      add additional base class
            console.log('app/mapControls/_Panel:constructor', arguments);

            this.baseClass = this.baseClass + ' collapse-panel';
        },
        postCreate: function () {
            // summary:
            //      set up clickable header that shows and collapses the body
            console.log('app/mapControls/_Panel:postCreate', arguments);

            var that = this;
            on(this.heading, 'click', function (evt) {
                if (evt.srcElement !== that.closeBtn &&
                    evt.srcElement !== that.closeSpan) {
                    $(that.body).collapse('toggle');
                }
            });

            this.inherited(arguments);
        }
    });
});
