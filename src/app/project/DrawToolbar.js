define([
    'app/config',
    'app/helpers',

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
    helpers,

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
                this.own(this.editToolbar.on('deactivate', function (evt) {
                    evt.graphic.setSymbol(config.symbols.selected.point);
                }));
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

            var target;
            var geoType = helpers.getGeometryTypeFromCategory(category);
            if (geoType === 'POLY') {
                target = this.drawBtnArea;
                domClass.remove(this.drawBtnArea, 'hidden');
                domClass.remove(this.drawBtnLine, 'hidden');
                domClass.add(this.drawBtnPoint, 'hidden');
            } else if (geoType === 'LINE') {
                target = this.drawBtnLine;
                domClass.add(this.drawBtnArea, 'hidden');
                domClass.remove(this.drawBtnLine, 'hidden');
                domClass.add(this.drawBtnPoint, 'hidden');
            } else {
                // point
                target = this.drawBtnPoint;
                domClass.add(this.drawBtnArea, 'hidden');
                domClass.add(this.drawBtnLine, 'hidden');
                domClass.remove(this.drawBtnPoint, 'hidden');
            }

            this.onToolClick({
                target: target
            });

            // cut is not applicable to points
            this.cutBtn.disabled = geoType === 'POINT';
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

            if ([this.drawBtnArea, this.drawBtnLine, this.drawBtnPoint].indexOf(btn) > -1) {
                this.startDrawing(btn);
            } else if (btn === this.cutBtn) {
                this.startCutting();
            } else {
                this.startSelecting();
            }
        },
        startDrawing: function (btn) {
            // summary:
            //      start drawing a new graphic
            // btn: Button
            //      the button that was clicked on
            console.log('app.project.DrawToolbar:startDrawing', arguments);

            var drawTypes = {
                'POLY': Draw.POLYGON,
                'POINT': Draw.POINT,
                'LINE': Draw.POLYLINE
            };

            this.editToolbar.deactivate();

            this.drawToolbar.deactivate();
            this.drawToolbar.activate(drawTypes[btn.value]);
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

            if (domClass.contains(this.selectBtn, 'active') && domClass.contains(this.domNode, 'in')) {
                /*jshint bitwise: false*/
                if (graphic.geometry.type === 'point') {
                    graphic.setSymbol(config.symbols.selectedPointForEditing);
                }
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
            if (domClass.contains(this.cutBtn, 'active')) {
                topic.publish(config.topics.feature.cutFeatures, evt.geometry);
            } else {
                if (geo.type !== 'polygon' || geo.rings[0].length > 3) {
                    topic.publish(config.topics.feature.drawingComplete, evt.geometry);
                }
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
