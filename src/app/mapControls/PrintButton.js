define([
    'app/mapControls/Print',
    'app/mapControls/_popoverMixin',

    'dojo/dom-construct',
    'dojo/text!app/mapControls/templates/PrintButton.html',
    'dojo/_base/declare'
], function (
    Print,
    _popoverMixin,

    domConstruct,
    template,
    declare
) {
    return declare([_popoverMixin], {
        // description:
        //      the ui/ux container for exporting the map to PDF
        templateString: template,
        baseClass: 'print-button',

        // Properties to be sent into constructor

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.mapControls.PrintButton::postCreate', arguments);

            this.widget = new Print({}, domConstruct.create('div'));

            this.titleDiv = domConstruct.create('div', {
                innerHTML: '<span class="text-info"><strong>Export Map</strong></span>'
            });

            this.inherited(arguments);
        }
    });
});
