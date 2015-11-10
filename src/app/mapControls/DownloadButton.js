define([
    'app/config',
    'app/mapControls/Download',
    'app/mapControls/_popoverMixin',

    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/text!app/mapControls/templates/DownloadButton.html',
    'dojo/topic',
    'dojo/_base/declare',
    'dojo/_base/lang'
], function (
    config,
    Download,
    _popoverMixin,

    domClass,
    domConstruct,
    template,
    topic,
    declare,
    lang
) {
    return declare([_popoverMixin], {
        // description:
        //      The button for showing the download widget
        templateString: template,
        baseClass: 'download-button',

        // Properties to be sent into constructor

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.mapControls.DownloadButton::postCreate', arguments);

            this.widget = new Download({}, domConstruct.create('div'));

            this.titleDiv = domConstruct.create('div', {
                innerHTML: '<span class="text-info"><strong>Download Spatial Data</strong></span>'
            });

            this.setupConnections();

            this.inherited(arguments);
        },
        setupConnections: function () {
            // summary:
            //      wire events, and such
            console.log('app.mapControls.DownloadButton::setupConnections', arguments);

            this.own(
                topic.subscribe(config.topics.projectIdsChanged, lang.hitch(this, 'toggleSelf'))
            );
        },
        toggleSelf: function (ids) {
            // summary:
            //      determines whether widget should be displayed or not
            // ids: {5:type or return: type}
            console.log('app.mapControls.DownloadButton::toggleSelf', arguments);

            this.widget.projectId = ids;
            var hide = ids && ids.length >= 1;
            domClass.toggle(this.domNode, 'hidden', !hide);
        }
    });
});
