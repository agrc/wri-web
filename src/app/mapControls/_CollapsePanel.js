define([
    'dojo/_base/declare',
    'dojo/on'
], function (
    declare,
    on
) {
    return declare([], {

        // preventToggleElements: Node[]
        //      these elements do not trigger a panel toggle when clicked
        preventToggleElements: null,

        constructor: function () {
            // summary:
            //      add additional base class
            console.log('app/mapControls/_Panel:constructor', arguments);

            this.baseClass = this.baseClass + ' collapse-panel';

            this.preventToggleElements = [];
        },
        postCreate: function () {
            // summary:
            //      set up clickable header that shows and collapses the body
            console.log('app/mapControls/_Panel:postCreate', arguments);

            this.preventToggleElements.push(this.closeBtn);
            this.preventToggleElements.push(this.closeSpan);

            var that = this;
            on(this.heading, 'click', function (evt) {
                if (that.preventToggleElements.indexOf(evt.srcElement) === -1) {
                    $(that.body).collapse('toggle');
                }
            });

            this.inherited(arguments);
        },
        open: function () {
            // summary:
            //      opens the body of the filter
            console.log('app/mapControls/Filter:open', arguments);

            $(this.body).collapse('show');

            this.inherited(arguments);
        }
    });
});
