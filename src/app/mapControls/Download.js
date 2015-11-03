define([
    'app/config',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/dom-attr',
    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/text!app/mapControls/templates/Download.html',
    'dojo/topic',
    'dojo/_base/declare',
    'dojo/_base/lang',

    'esri/tasks/Geoprocessor'
], function (
    config,

    _TemplatedMixin,
    _WidgetBase,

    domAttr,
    domClass,
    domConstruct,
    template,
    topic,
    declare,
    lang,

    Geoprocessor
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        // description:
        //      Downloads the spatial data for the project in single project view
        templateString: template,
        baseClass: 'download',

        // gp: esri/tasks/geoprocessing
        gp: null,

        //async gp task job id
        jobId: null,

        // parameters passed in via the constructor

        //resultName: string property to request the result from the gp
        resultName: 'output',
        // Properties to be sent into constructor

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.mapControls.Download::postCreate', arguments);

            this.inherited(arguments);

            this.initGp(config.urls.download);
        },
        initGp: function (url) {
            // summary:
            //      creates the gp
            //
            console.log('app.mapControls.Download::initGp', arguments);

            this.gp = new Geoprocessor(url);

            this.own(
                this.gp.on('job-complete', lang.hitch(this, 'gpComplete')),
                this.gp.on('status-update', lang.hitch(this, 'statusUpdate')),
                this.gp.on('job-cancel', lang.hitch(this, 'jobCancelled')),
                this.gp.on('get-result-data-complete', lang.hitch(this, 'resultComplete')),
                this.gp.on('error', lang.hitch(this, 'onError'))
            );
        },
        onDownloadClick: function () {
            // summary:
            //      handle click event to talk to download gp tools
            //
            console.log('app.mapControls.Download:onDownloadClick', arguments);

            this._hideLink();

            domClass.add(this.downloadButton, 'disabled');
            domAttr.set(this.downloadButton, 'disabled', true);

            var params = {
                'project_ids': this.projectId.join()
            };

            this.submitJob(params);

            return params;
        },
        submitJob: function (data) {
            // summary:
            //      sends the download filter to the gp service
            console.log('app.mapControls.Download::submitJob', arguments);

            this.gp.submitJob(data);
        },
        cancelJob: function () {
            // summary:
            //      cancels the download job
            console.log('app.mapControls.Download::cancelJob', arguments);

            try {
                //throws error if it's already done and you try to cancel
                this.gp.cancelJob(this.jobId);
            } catch (a) {}
        },
        jobCancelled: function () {
            // summary:
            //      successful cancel
            console.log('app.mapControls.Download::jobCancelled', arguments);
        },
        statusUpdate: function (status) {
            // summary:
            //      status updates from the gp service
            // jobinfo: esri/tasks/JobInfo
            console.log('app.mapControls.Download::statusUpdate', arguments);
            //
            switch (status.jobInfo.jobStatus) {
                case 'esriJobSubmitted':
                    this.downloadButton.innerHTML = 'Submitted';
                    break;
                case 'esriJobExecuting':
                    this.downloadButton.innerHTML = 'Processing';
                    break;
                case 'esriJobSucceeded':
                    this.downloadButton.innerHTML = 'Requesting zip file';
                    break;
            }
        },
        gpComplete: function (status) {
            // summary:
            //      description
            // status: esri/tasks/JobInfo
            console.log('app.mapControls.Download::gpComplete', arguments);

            if (status.jobInfo && status.jobInfo.jobStatus === 'esriJobSucceeded' && this.resultName) {
                this.gp.getResultData(status.jobInfo.jobId, this.resultName);
            } else {
                topic.publish(config.topics.toast, { message: status.error.message || 'The GP Service may not be started. Try again.', type: 'danger' });
            }

            domClass.remove(this.downloadButton, 'disabled');
            domAttr.remove(this.downloadButton, 'disabled');
        },
        resultComplete: function (response) {
            // summary:
            //      gets the gp result from the server
            // response: the gp resultData object
            console.log('app.mapControls.Download:resultComplete', arguments);

            this.downloadButton.innerHTML = 'Request Project Data as .fgdb';
            var url = response.url || response.result.url || response.result.value.url;
            this.downloadLink.href = url;
            domClass.remove(this.downloadLinkAlert, 'hidden');
        },
        onError: function (evt) {
            // summary:
            //      print returned an error
            // evt: {error: Error}
            console.log('app.mapControls.Download:onError', arguments);

            topic.publish(config.topics.toast, { message: evt.error.message, type: 'danger' });
            domClass.remove(this.downloadButton, 'disabled');
            domAttr.remove(this.downloadButton, 'disabled');
        },
        _hideLink: function () {
            // summary:
            //      hides the link after the user clicks on it
            console.log('app.mapControls.Download:_hideLink', arguments);

            domClass.add(this.downloadLinkAlert, 'hidden');
        }
    });
});
