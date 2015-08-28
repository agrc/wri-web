(function () {
    var config = {
        packages: [
            'agrc',
            'app',
            'bootstrap',
            'bootstrap-stylus',
            'dgrid',
            'dgrid0.3',
            'dijit',
            'dojo',
            'dojox',
            'dstore',
            'esri',
            'ijit',
            'jsonconfig',
            'lodash',
            'put-selector',
            'xstyle',
            {
                name: 'jquery',
                location: './jquery/dist',
                main: 'jquery'
            }, {
                name: 'ladda',
                location: './ladda-bootstrap',
                main: 'dist/ladda'
            }, {
                name: 'mustache',
                location: './mustache',
                main: 'mustache'
            }, {
                name: 'slider',
                location: './seiyria-bootstrap-slider',
                main: 'js/bootstrap-slider'
            }, {
                name: 'spin',
                location: './spinjs',
                main: 'spin'
            }, {
                name: 'stubmodule',
                location: './stubmodule',
                main: 'src/stub-module'
            }
        ],
        map: {
            'esri': {
                dgrid: 'dgrid0.3'
            }
        }
    };
    require(config, ['dojo/parser', 'jquery', 'dojo/domReady!'], function (parser) {
        parser.parse();
    });
})();
