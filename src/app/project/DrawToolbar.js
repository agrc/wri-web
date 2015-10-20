define([
    'app/config',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',
    'dijit/_WidgetsInTemplateMixin',

    'dojo/dom-class',
    'dojo/keys',
    'dojo/on',
    'dojo/query',
    'dojo/text!app/project/templates/DrawToolbar.html',
    'dojo/topic',
    'dojo/_base/declare',
    'dojo/_base/lang',

    'esri/toolbars/draw',
    'esri/toolbars/edit',

    'bootstrap-stylus/js/button',
    'bootstrap-stylus/js/collapse',
    'bootstrap-stylus/js/dropdown',
    'bootstrap-stylus/js/transition'
], function (
    config,

    _TemplatedMixin,
    _WidgetBase,
    _WidgetsInTemplateMixin,

    domClass,
    keys,
    on,
    query,
    template,
    topic,
    declare,
    lang,

    Draw,
    Edit
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        // description:
        //      Toolbar containing controls for drawing or editing features
        templateString: template,
        baseClass: 'draw-toolbar well collapse fade',
        widgetsInTemplate: true,

        // drawToolbar: Draw
        drawToolbar: null,

        // editToolbar: Edit
        editToolbar: null,


        // Properties to be sent into constructor

        // map: esri/Map
        map: null,

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.project.DrawToolbar::postCreate', arguments);

            $(this.domNode).collapse({toggle: false});

            var that = this;
            this.own(
                topic.subscribe(config.topics.feature.startDrawing, lang.hitch(this, 'onStartDrawingFeature')),
                query('.tool', this.domNode).on('click', lang.hitch(this, 'onToolClick')),
                topic.subscribe(config.topics.feature.selectedForEditing, lang.hitch(this, 'onSelectedForEditing')),
                topic.subscribe(config.topics.projectIdsChanged, function () {
                    // only fire cancel if drawing toolbar is active
                    if (domClass.contains(that.domNode, 'in')) {
                        that.onCancelClick();
                    }
                }),
                on(document, 'keyup', lang.hitch(this, 'onKeyUp'))
            );

            this.inherited(arguments);
        },
        onKeyUp: function (evt) {
            // summary:
            //      deletes the selected feature, if any if the delete key was pressed
            // evt: Event Object
            console.log('app.project.DrawToolbar:onKeyUp', arguments);

            if (evt.keyCode === keys.DELETE) {
                var currentState = this.editToolbar.getCurrentState();
                if (currentState.tool !== 0) {
                    this.editToolbar.deactivate();
                    topic.publish(config.topics.feature.removeEditingGraphic, currentState.graphic);
                }
            }
        },
        show: function () {
            // summary:
            //      shows the toolbar
            console.log('app.project.DrawToolbar:show', arguments);

            if (!this.drawToolbar) {
                this.drawToolbar = new Draw(this.map);
                this.own(this.drawToolbar.on('draw-complete', lang.hitch(this, 'onDrawComplete')));
                this.editToolbar = new Edit(this.map);
            }

            $(this.domNode).collapse('show');
        },
        hide: function () {
            // summary:
            //      hides the toolbar
            console.log('app.project.DrawToolbar:hide', arguments);

            $(this.domNode).collapse('hide');

            if (this.drawToolbar) {
                this.drawToolbar.deactivate();
                this.editToolbar.deactivate();
            }
        },
        onStartDrawingFeature: function (category) {
            // summary:
            //      show the widget and set it up for the specified category
            // category: String
            console.log('app.project.DrawToolbar:onStartDrawingFeature', arguments);

            this.show();
            this.categoryNode.innerHTML = category;
            this.onToolClick({
                target: this.drawBtn
            });
        },
        onToolClick: function (evt) {
            // summary:
            //      the user clicked on a tool button
            // evt: Event Object
            console.log('app.project.DrawToolbar:onToolClick', arguments);

            // clear any previously selected buttons
            query('.tool', this.domNode).removeClass('active');

            // activate clicked button
            var btn;
            if (evt.target.tagName === 'SPAN') {
                btn = evt.target.parentElement;
            } else {
                btn = evt.target;
            }
            domClass.add(btn, 'active');

            if (btn === this.drawBtn) {
                this.startDrawing();
            } else if (btn === this.cutBtn) {
                this.startCutting();
            } else {
                this.startSelecting();
            }
        },
        startDrawing: function () {
            // summary:
            //      start drawing a new graphic
            console.log('app.project.DrawToolbar:startDrawing', arguments);

            this.editToolbar.deactivate();
            var geometryTypes = {
                'POLY': Draw.POLYGON,
                'POINT': Draw.POINT,
                'LINE': Draw.POLYLINE
            };

            var categoryNum = config.domains.featureType.filter(function (t) {
                return t[0] === this.categoryNode.innerHTML;
            }, this)[0][1];
            var geoType = geometryTypes[config.featureTypesInTables[categoryNum]];
            this.drawToolbar.activate(geoType);

            // cut is not applicable to points
            this.cutBtn.disabled = geoType === Draw.POINT;
        },
        startCutting: function () {
            // summary:
            //      activate the draw line tool
            console.log('app.project.DrawToolbar:startCutting', arguments);

            this.editToolbar.deactivate();
            this.drawToolbar.activate(Draw.POLYLINE);
        },
        startSelecting: function () {
            // summary:
            //      deactivate drawing toolbar
            console.log('app.project.DrawToolbar:startSelecting', arguments);

            this.drawToolbar.deactivate();
        },
        onSelectedForEditing: function (graphic) {
            // summary:
            //      activate the edit toolbar if select button is active
            // graphic: Graphic
            console.log('app.project.DrawToolbar:onSelectedForEditing', arguments);

            if (domClass.contains(this.selectBtn, 'active')) {
                /*jshint bitwise: false*/
                this.editToolbar.activate(Edit.MOVE | Edit.EDIT_VERTICES, graphic);
                /*jshint bitwise: true*/
            }
        },
        onDrawComplete: function (evt) {
            // summary:
            //      the user has double-clicked to finish the drawing
            //      add a new geometry or cut existing ones depending on which button is active
            // evt: Object ({geographicGeometry: Geometry, geometry: Geometry})
            console.log('app.project.DrawToolbar:onDrawComplete', arguments);

            var geo = evt.geometry;
            if (domClass.contains(this.drawBtn, 'active')) {
                if (geo.type !== 'polygon' || geo.rings[0].length > 3) {
                    topic.publish(config.topics.feature.drawingComplete, evt.geometry);
                }
            } else {
                topic.publish(config.topics.feature.cutFeatures, evt.geometry);
            }
        },
        onSaveClick: function () {
            // summary:
            //      save button was clicked
            console.log('app.project.DrawToolbar:onSaveClick', arguments);

            this.hide();

            topic.publish(config.topics.feature.drawEditComplete);
        },
        onCancelClick: function () {
            // summary:
            //      cancel button was clicked
            console.log('app.project.DrawToolbar:onCancelClick', arguments);

            topic.publish(config.topics.feature.cancelDrawing);
            topic.publish(config.topics.feature.drawEditComplete);

            this.hide();
        }
    });
});
