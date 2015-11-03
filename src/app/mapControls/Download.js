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

    'esri/tasks/Geoprocessor',

    'xstyle/css!app/mapControls/resources/Download.css'
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

        // parentWidget: a reference to the parent widget
        parentWidget: null,

        // url: url to gp tool
        url: null,

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
               this.gp.on('get-result-data-complete', lang.hitch(this, 'resultComplete'))
           );
       },
        onDownloadClick: function () {
            // summary:
            //      handle click event to talk to download gp tools
            //
            console.log('app.mapControls.Download:onDownloadClick', arguments);

            // topic.publish(config.topics.showProjectLoader);
            // this.hideDownloadLink();

            var params = {
                'project_ids': this.projectId
            };

            this.submitJob(params);

            return params;
        },
        submitJob: function (data) {
            // summary:
            //      sends the download filter to the gp service
            console.log('app.mapControls.Download::submitJob', arguments);

            this.resultButton.innerHTML = '';
            this.messageBox.innerHTML = '';

            domClass.add(this.resultButton, 'hidden');

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

            if (status.jobInfo.jobStatus === 'esriJobSucceeded' && this.resultName) {
                this.gp.getResultData(status.jobInfo.jobId, this.resultName);
            } else {
                this.messageBox.innerHTML = 'There was a problem. Try again.';
            }
        },
        resultComplete: function (response) {
            // summary:
            //      gets the gp result from the server
            // response: the gp resultData object
            console.log('app.mapControls.Download:resultComplete', arguments);

            domConstruct.place('<span class=\'glyphicon glyphicon-download-alt\'></span> Request Project Data as .fgdb', this.downloadButton, 'only');
            this.resultButton.innerHTML = 'Download Data';
            domAttr.set(this.resultButton, 'href', response.result.value.url);
            domClass.remove(this.resultButton, 'hidden');
        }
    });
});
