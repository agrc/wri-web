/* jshint camelcase:false */
/* jshint maxcomplexity:false */
var osx = 'OS X 10.10';
var windows = 'Windows 8.1';
var browsers = [{
    browserName: 'safari',
    platform: osx
}, {
    browserName: 'firefox',
    platform: windows
}, {
    browserName: 'chrome',
    platform: windows
}, {
    browserName: 'internet explorer',
    platform: windows,
    version: '11'
}];

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    var path = require('path');
    var port = grunt.option('port') || 8000;
    var jasminePort = grunt.option('jasminePort') || 8001;

    var jsAppFiles = 'src/app/**/*.js';
    var otherFiles = [
        'src/app/**/*.html',
        'src/app/**/*.css',
        'src/index.html',
        'src/ChangeLog.html'
    ];
    var gruntFile = 'GruntFile.js';
    var jsFiles = [
        jsAppFiles,
        gruntFile
    ];
    var bumpFiles = [
        'package.json',
        'bower.json',
        'src/app/package.json',
        'src/app/config.js'
    ];
    var secrets = {
        ags: {
            local: {},
            dev: {},
            at: {}
        }
    };
    var sauceConfig = {
        urls: ['http://127.0.0.1:' + jasminePort + '/_SpecRunner.html'],
        tunnelTimeout: 120,
        build: process.env.TRAVIS_JOB_ID,
        browsers: browsers,
        testname: 'wri-web',
        maxRetries: 10,
        maxPollRetries: 10,
        'public': 'public',
        throttled: 5,
        sauceConfig: {
            'max-duration': 1800
        },
        statusCheckAttempts: 500
    };
    try {
        secrets = grunt.file.readJSON('secrets.json');
        sauceConfig.username = secrets.sauce_name;
        sauceConfig.key = secrets.sauce_key;
    } catch (e) {
        grunt.log.ok();
    }

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        amdcheck: {
            main: {
                options: {
                    removeUnusedDependencies: false
                },
                files: [{
                    src: [
                        'src/app/**/*.js'
                    ]
                }]
            }
        },
        arcgis_press: {
            options: {
                mapServerBasePath: path.join(process.cwd(), 'maps'),
                commonServiceProperties: {
                    minInstancesPerNode: 1,
                    maxInstancesPerNode: 6
                },
                services: {
                   centroids: {
                       type: 'MapServer',
                       folder: 'WRI',
                       serviceName: 'Projects',
                       resource: 'wri.projects.local.mxd'
                   },
                   features: {
                       serviceName: 'Features',
                       folder: 'WRI',
                       type: 'MapServer',
                       resource: 'wri.features.local.mxd'
                   },
                   reference: {
                       serviceName: 'Reference',
                       folder: 'WRI',
                       type: 'MapServer',
                       resource: 'wri.reference.gdb.mxd'
                   }
               }
            },
            local: {
                options: {
                   server: {
                       host: secrets.ags.local.host,
                       username: secrets.ags.local.username,
                       password: secrets.ags.local.password
                   },
                   commonServiceProperties: {
                       maxInstancesPerNode: 2
                   }
               }
            },
            dev: {
                options: {
                   server: {
                       host: secrets.ags.dev.host,
                       username: secrets.ags.dev.username,
                       password: secrets.ags.dev.password
                   }
               }
            },
            at: {
                options: {
                   server: {
                       host: secrets.ags.at.host,
                       username: secrets.ags.at.username,
                       password: secrets.ags.at.password
                   }
               }
            }
        },
        bump: {
            options: {
                files: bumpFiles,
                commitFiles: bumpFiles,
                push: false
            }
        },
        clean: {
            build: ['dist/'],
            all: {
                options: {
                    force: true
                },
                files: [{
                    cwd: 'C:/Projects/svn/dnr-wri/src/main/webapp/js/agrc/'
                }]
            }
        },
        connect: {
            options: {
                livereload: true,
                open: secrets.openOnConnect
            },
            server: {
                options: {
                    port: port,
                    base: {
                        path: './src',
                        options: {
                            maxAge: 0
                        }
                    },
                    logger: 'dev',
                    middleware: function (connect, options, defaultMiddleware) {
                        var proxy = require('grunt-connect-proxy/lib/utils').proxyRequest;
                        return [proxy].concat(defaultMiddleware);
                    }
                },
                proxies: [
                    {
                        context: '/arcgis',
                        host: secrets.devHost,
                        headers: {
                            connection: 'keep-alive'
                        }
                    },
                    {
                        context: '/wri/api',
                        host: secrets.devHost,
                        headers: {
                            connection: 'keep-alive'
                        }
                    }
                ]
            },
            built: {
                options: {
                    port: port,
                    base: {
                        path: './dist',
                        options: {
                            index: 'map/map.html'
                        }
                    },
                    logger: 'dev',
                    middleware: function (connect, options, defaultMiddleware) {
                        var proxy = require('grunt-connect-proxy/lib/utils').proxyRequest;
                        return [proxy].concat(defaultMiddleware);
                    }
                },
                proxies: [
                    {
                        context: '/arcgis',
                        host: secrets.devHost,
                        headers: {
                            connection: 'keep-alive'
                        }
                    },
                    {
                        context: '/wri/api',
                        host: secrets.devHost,
                        headers: {
                            connection: 'keep-alive'
                        }
                    }
                ]
            },
            jasmine: {
                options: {
                    port: jasminePort,
                    base: {
                        path: '.',
                        options: {
                            index: '_SpecRunner.html'
                        }
                    }
                }
            }
        },
        copy: {
            main: {
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['*.html', '!index.html'],
                    dest: 'dist/map/'
                }]
            },
            all: {
                files: [{
                    src: ['**',
                        '!**/*.uncompressed.js',
                        '!**/*consoleStripped.js',
                        '!**/bootstrap/less/**',
                        '!**/bootstrap/test-infra/**',
                        '!**/tests/**',
                        '!build-report.txt',
                        '!components-jasmine/**',
                        '!favico.js/**',
                        '!jasmine-favicon-reporter/**',
                        '!jasmine-jsreporter/**',
                        '!stubmodule/**',
                        '!util/**',
                        '!**/_SpecRunner.html',
                        '!**/*.profile.js',
                        '!**/*.sublime-project',
                        '!**/bower.json',
                        '!**/LICENSE.md',
                        '!**/README.md',
                        '!**/secrets.json.sample',
                        '!**/secrets.sample.json',
                        '!**/*.styl',
                        '!**/*.md',
                        '!**/package.json',
                        '!**/bower.json',
                        '!index.html',
                        '!ChangeLog.html',
                        '!**/Gruntfile.*'

                    ],
                    dest: 'C:/Projects/svn/dnr-wri/src/main/webapp/js/agrc/',
                    cwd: 'dist/js/agrc/',
                    expand: true
                }]
            },
            dts: {
                files: {
                    'C:/Projects/GitHub/wri-dts/src/main/webapp/js/agrc/dojo/dojo.js': 'C:/Projects/GitHub/wri-web/dist/js/agrc/dojo/dojo.js',
                    'C:/Projects/GitHub/wri-dts/src/main/webapp/js/agrc/app/resources/App.css': 'C:/Projects/GitHub/wri-web/dist/js/agrc/app/resources/App.css',
                    'C:/Projects/GitHub/wri-dts/src/main/webapp/js/agrc/jsonconfig/config.json': 'C:/Projects/GitHub/wri-web/dist/js/agrc/jsonconfig/config.json',
                    'C:/Projects/GitHub/wri-dts/src/main/webapp/js/agrc/esri/geometry/geometryEngine.js': 'C:/Projects/GitHub/wri-web/dist/js/agrc/esri/geometry/geometryEngine.js'
                }
            }
        },
        dojo: {
            prod: {
                options: {
                    // You can also specify options to be used in all your tasks
                    profiles: ['profiles/prod.build.profile.js', 'profiles/build.profile.js'] // Profile for build
                }
            },
            stage: {
                options: {
                    // You can also specify options to be used in all your tasks
                    profiles: ['profiles/stage.build.profile.js', 'profiles/build.profile.js'] // Profile for build
                }
            },
            options: {
                // You can also specify options to be used in all your tasks
                dojo: 'src/dojo/dojo.js', // Path to dojo.js file in dojo source
                load: 'build', // Optional: Utility to bootstrap (Default: 'build')
                releaseDir: '../dist/js/agrc',
                require: 'src/app/run.js', // Optional: Module to require for the build (Default: nothing)
                basePath: './src'
            }
        },
        imagemin: {
            main: {
                options: {
                    optimizationLevel: 3
                },
                files: [{
                    expand: true,
                    cwd: 'src/',
                    // exclude tests because some images in dojox throw errors
                    src: ['**/*.{png,jpg,gif}', '!**/tests/**/*.*'],
                    dest: 'src/'
                }]
            }
        },
        jasmine: {
            main: {
                src: ['src/app/run.js'],
                options: {
                    specs: ['src/app/**/Spec*.js'],
                    vendor: [
                        'src/jasmine-favicon-reporter/vendor/favico.js',
                        'src/jasmine-favicon-reporter/jasmine-favicon-reporter.js',
                        'src/jasmine-jsreporter/jasmine-jsreporter.js',
                        'src/app/tests/jasmineDojoConfig.js',
                        'src/dojo/dojo.js',
                        'src/app/tests/jasmineTestBootstrap.js',
                        'src/app/tests/jsReporterSanitizer.js',
                        'src/app/tests/jasmineAMDErrorChecking.js'
                    ],
                    host: 'http://localhost:' + jasminePort
                }
            }
        },
        jscs: {
            main: {
                src: jsFiles
            },
            force: {
                src: jsFiles,
                options: {
                    force: true
                }
            }
        },
        jshint: {
            main: {
                src: jsFiles
            },
            force: {
                // must use src for newer to work
                src: jsFiles,
                options: {
                    force: true
                }
            },
            options: {
                reporter: require('jshint-stylish'),
                jshintrc: '.jshintrc'
            }
        },
        processhtml: {
            options: {},
            main: {
                files: {
                    'dist/map/map.html': ['src/index.html']
                }
            }
        },
        'saucelabs-jasmine': {
            all: {
                options: sauceConfig
            }
        },
        shell: {
            options: {
                stdout: true
            },
            configLocal: {
                command: 'python scripts/BuildJSON/build_json.py L'
            },
            configDev: {
                command: 'python scripts/BuildJSON/build_json.py D'
            },
            configAt: {
                command: 'python scripts/BuildJSON/build_json.py A'
            },
            configProd: {
                command: 'python scripts/BuildJSON/build_json.py P'
            },
            mapLocal: {
                command: 'python maps/RepointMXD.py L'
            },
            mapDev: {
                command: 'python maps/RepointMXD.py D'
            },
            mapAt: {
                command: 'python maps/RepointMXD.py A'
            }
        },
        stylus: {
            main: {
                options: {
                    compress: false,
                    'resolve url': true
                },
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['app/resources/App.styl'],
                    dest: 'src/',
                    ext: '.css'
                }]
            }
        },
        uglify: {
            options: {
                preserveComments: false,
                sourceMap: false,
                compress: {
                    drop_console: true, // eslint-disable-line camelcase
                    passes: 2,
                    dead_code: true // eslint-disable-line camelcase
                }
            },
            specific: {
                options: {
                    compress: {
                        drop_console: false // eslint-disable-line camelcase
                    }
                },
                src: ['dist/js/agrc/dojo/dojo.js'],
                dest: 'dist/js/agrc/dojo/dojo.js'
            },
            all: {
                files: [{
                    expand: true,
                    cwd: 'dist/js/agrc/',
                    src: '**/*.js',
                    dest: 'dist/js/agrc/'
                }]
            }
        },
        watch: {
            options: {
                livereload: true
            },
            jshint: {
                files: jsFiles,
                tasks: ['newer:jshint:main', 'newer:jscs:main', 'jasmine:main:build']
            },
            src: {
                files: jsFiles.concat(otherFiles)
            },
            stylus: {
                files: 'src/app/**/*.styl',
                tasks: ['stylus']
            },
            built: {
                files: 'dist/app/*.*'
            }
        }
    });

    grunt.registerTask('default', [
        'jasmine:main:build',
        'jshint:force',
        'jscs:force',
        'amdcheck:main',
        'configureProxies:server',
        'connect:server',
        'connect:jasmine',
        'stylus',
        'watch'
    ]);
    grunt.registerTask('serve', [
        'configureProxies:server',
        'connect:server',
        'connect:jasmine',
        'watch'
    ]);
    grunt.registerTask('build-prod', [
        'jshint:main',
        'jscs:main',
        'clean:build',
        'newer:imagemin:main',
        'stylus',
        'shell:configProd',
        'dojo:prod',
        'uglify:specific',
        'copy:main',
        'processhtml:main'
    ]);
    grunt.registerTask('build-stage', [
        'jshint:main',
        'jscs:main',
        'clean:build',
        'newer:imagemin:main',
        'stylus',
        'shell:configAt',
        'dojo:stage',
        'uglify:specific',
        'copy:main',
        'processhtml:main'
    ]);
    grunt.registerTask('deploy', [
        'copy:dts'
    ]);
    grunt.registerTask('sauce', [
        'jasmine:main:build',
        'connect:jasmine',
        'connect:server',
        'saucelabs-jasmine'
    ]);
    grunt.registerTask('travis', [
        'jshint:main',
        'jscs:main',
        'sauce',
        'build-prod'
    ]);
    grunt.registerTask('serve-built', [
        'configureProxies:built',
        'connect:built',
        'watch:built'
    ]);
    grunt.registerTask('press', [
        'shell:local',
        'arcgis_press:mapLocal'
    ]);
    grunt.registerTask('press-dev', [
        'shell:dev',
        'arcgis_press:mapDev'
    ]);
    grunt.registerTask('press-at', [
        'shell:at',
        'arcgis_press:mapAt'
    ]);
};
