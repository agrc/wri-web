define([
    'app/config',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/dom-class',
    'dojo/text!app/mapControls/templates/Print.html',
    'dojo/topic',
    'dojo/_base/array',
    'dojo/_base/declare',
    'dojo/_base/lang',

    'esri/request',
    'esri/tasks/PrintParameters',
    'esri/tasks/PrintTask',
    'esri/tasks/PrintTemplate'
], function (
    config,

    _TemplatedMixin,
    _WidgetBase,

    domClass,
    template,
    topic,
    array,
    declare,
    lang,

    esriRequest,
    PrintParameters,
    PrintTask,
    PrintTemplate
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        // description:
        //      Controls for printing the map. Uses the PrintTask

        templateString: template,
        baseClass: 'print',

        // btnText: String
        //      save the button text for hideLoader
        btnText: null,

        // params: PrintParameters
        params: null,

        // task: PrintTask
        task: null,


        // Properties to be sent into constructor

        // map: Map
        map: null,

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            // tags:
            //      private
            console.log('app.map.Print::postCreate', arguments);

            this.btnText = this.printBtn.innerHTML;

            var template = new PrintTemplate();

            template.layoutOptions = {
                customTextElements: [
                    {
                        title: 'Created by WRI Online Map'
                    }
                ]
            };

            this.params = new PrintParameters();
            this.params.template = template;

            this.task = new PrintTask(config.urls.print, {
                async: true
            });

            this.own(
                this.task.on('complete', lang.hitch(this, 'onComplete')),
                this.task.on('error', lang.hitch(this, 'onError'))
            );

            this.inherited(arguments);
        },
        setRequestPreCallback: function (patch) {
            // summary:
            //      set the function to inspect the print request
            // patch: bool whether to patch or noop the precallback
            console.log('app.mapControls.Print:setRequestPreCallback', arguments);

            var precallback;
            if (patch) {
                precallback = lang.hitch(this, lang.hitch(this, 'patchMapServiceUrls'));
            }

            esriRequest.setRequestPreCallback(precallback);
        },
        patchMapServiceUrls: function (ioArgs) {
            // summary:
            //      patch gp request with https urls
            // {url, content}
            console.log('app.mapControls.Print:patchMapServiceUrls', arguments);

            if (config.urls.print + '/submitJob' !== ioArgs.url) {
                return ioArgs;
            }

            var json = JSON.parse(ioArgs.content.Web_Map_as_JSON);
            json.operationalLayers = json.operationalLayers.map(function (layer) {
                if (!layer.url) {
                    return layer;
                }

                if (layer.urlTemplate) {
                    layer.urlTemplate = layer.urlTemplate.replace(/^https/, 'http');
                }

                layer.url = layer.url.replace(/^https/, 'http');

                return layer;
            });

            ioArgs.content.Web_Map_as_JSON = JSON.stringify(json);

            return ioArgs;
        },
        print: function () {
            // summary:
            //      sends data to print service
            console.log('app.map.Print::print', arguments);

            this.setRequestPreCallback(true);
            this.hideLink();
            this.showLoader('Processing');

            var legendLayers = [];
            array.forEach(this.map.graphicsLayerIds, function (id) {
                if (!/graphicsLayer/.test(id)) {
                    legendLayers.push({
                        layerId: id
                    });
                }
            });

            if (this.titleNode.value) {
                this.params.template.layoutOptions.customTextElements[0] = {
                    title: this.titleNode.value
                };
            }

            this.params.template.layoutOptions.legendLayers = legendLayers;

            this.task.execute(this.params);
            this.setRequestPreCallback(false);
        },
        onComplete: function (evt) {
            // summary:
            //      print completed successfully
            // evt: {result: {url: String}}
            console.log('app.map.Print::onComplete', arguments);

            var url = evt.url || evt.result.url;
            this.downloadLink.href = url;
            domClass.remove(this.downloadLinkAlert, 'hidden');

            this.hideLoader();
        },
        onError: function (evt) {
            // summary:
            //      print returned an error
            // evt: {error: Error}
            console.log('app/map/Print:onError', arguments);

            topic.publish(config.topics.toast, { message: evt.error.message, type: 'danger' });
            this.hideLoader();
        },
        showLoader: function (msg) {
            // summary:
            //      disables the print button and sets message text
            // msg: String
            console.log('app/map/Print:showLoader', arguments);

            this.printBtn.disabled = true;
            this.printBtn.innerHTML = msg;
        },
        hideLoader: function () {
            // summary:
            //      resets the button
            console.log('app/map/Print:hideLoader', arguments);

            this.printBtn.disabled = false;
            this.printBtn.innerHTML = this.btnText;
        },
        hideLink: function () {
            // summary:
            //      hides the link after the user clicks on it
            console.log('app/map/Print:hideLink', arguments);

            domClass.add(this.downloadLinkAlert, 'hidden');
        },
        setMap: function (map) {
            // summary:
            //      sets the Map
            // esri/Map
            console.log('app.mapControls.Print:setMap', arguments);

            this.map = map;
        },
        startup: function () {
            // summary:
            //      description
            // param or return
            console.log('app.mapControls.Print:startup', arguments);

            topic.publish(config.topics.map.setMap, this);

            this.params.map = this.map;
        }
    });
});
