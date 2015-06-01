/* jshint camelcase:false */
var osx = 'OS X 10.10';
var windows = 'Windows 8.1';
var browsers = [{

    // OSX

    //     browserName: 'firefox',
    //     // no version = latest
    //     platform: osx
    // }, {
    //     browserName: 'chrome',
    //     platform: osx
    // }, {
    browserName: 'safari',
    platform: osx
}, {

    //     // iOS

    //     browserName: 'iPad',
    //     platform: osx,
    //     version: '8.1'
    // }, {
    //     browserName: 'iPad',
    //     platform: osx,
    //     version: '8.0'
    // }, {
    //     browserName: 'iPad',
    //     platform: osx,
    //     version: '7.1'
    // },{

    // Android

    //     browserName: 'android',
    //     platform: 'Linux',
    //     version: 4.4
    // },{
    //     browserName: 'android',
    //     platform: 'Linux',
    //     version: 4.3
    // },{
    //     browserName: 'android',
    //     platform: 'Linux',
    //     version: 4.2
    // },{
    //     browserName: 'android',
    //     platform: 'Linux',
    //     version: 4.0
    // },{
    //     browserName: 'android',
    //     platform: 'Linux',
    //     version: 2.3
    // },{

    // Windows

    browserName: 'firefox',
    platform: windows
}, {
    browserName: 'chrome',
    platform: windows
}, {
    browserName: 'internet explorer',
    platform: windows,
    version: '11'
}, {
    browserName: 'internet explorer',
    platform: 'Windows 8',
    version: '10'
}, {
    browserName: 'internet explorer',
    platform: 'Windows 7',
    version: '9'
}];

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);
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
    var internFile = 'tests/intern.js';
    var jsFiles = [
        jsAppFiles,
        gruntFile,
        internFile
    ];
    var bumpFiles = [
        'package.json',
        'bower.json',
        'src/app/package.json',
        'src/app/config.js'
    ];
    var secrets;
    var sauceConfig = {
        urls: ['http://127.0.0.1:8001/_SpecRunner.html'],
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
        // swallow for build server
        secrets = {
            stage: {
                host: '',
                username: '',
                password: ''
            },
            prod: {
                host: '',
                username: '',
                password: ''
            }
        };
    }

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        bump: {
            options: {
                files: bumpFiles,
                commitFiles: bumpFiles,
                push: false
            }
        },
        clean: {
            build: ['dist']
        },
        connect: {
            server: {
                options: {
                    port: port,
                    base: './src',
                    livereload: true,
                    open: true
                }
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
                    src: ['*.html'],
                    dest: 'dist/'
                }]
            },
            toDts: {
                files: {
                    'C:/Projects/svn/dnr-wri/src/main/webapp/js/agrc/dojo/dojo.js': 'C:/Projects/GitHub/wri-web/dist/dojo/dojo.js',
                    'C:/Projects/svn/dnr-wri/src/main/webapp/css/agrc/App.css': 'C:/Projects/GitHub/wri-web/dist/app/resources/App.css'
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
                releaseDir: '../dist',
                require: 'src/app/run.js', // Optional: Module to require for the build (Default: nothing)
                basePath: './src'
            }
        },
        esri_slurp: {
            options: {
                version: '3.13'
            },
            dev: {
                options: {
                    beautify: true
                },
                dest: 'src/esri'
            },
            travis: {
                dest: 'src/esri'
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
                        'src/app/tests/jasmineAMDErrorChecking.js',
                        'src/app/tests/jasmineTestBootstrap.js',
                        'src/app/tests/jsReporterSanitizer.js',
                        'src/dojo/dojo.js',
                        'src/jasmine-favicon-reporter/jasmine-favicon-reporter.js',
                        'src/jasmine-favicon-reporter/vendor/favico.js',
                        'src/jasmine-jsreporter/jasmine-jsreporter.js'
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
                    'dist/index.html': ['src/index.html']
                }
            }
        },
        'saucelabs-jasmine': {
            all: {
                options: sauceConfig
            }
        },
        secrets: secrets,
        stylus: {
            main: {
                options: {
                    compress: false
                },
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['app/**/*.styl'],
                    dest: 'src/',
                    ext: '.css'
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
                tasks: ['newer:stylus']
            }
        }
    });

    grunt.registerTask('default', [
        'jasmine:main:build',
        'jshint:force',
        'jscs:force',
        'if-missing:esri_slurp:dev',
        'connect',
        'stylus',
        'watch'
    ]);
    grunt.registerTask('serve', [
        'connect',
        'watch'
    ]);
    grunt.registerTask('build-prod', [
        'clean:build',
        'if-missing:esri_slurp:dev',
        'newer:imagemin:main',
        'stylus',
        'dojo:prod',
        'copy:main',
        'processhtml:main'
    ]);
    grunt.registerTask('build-stage', [
        'clean:build',
        'if-missing:esri_slurp:dev',
        'newer:imagemin:main',
        'stylus',
        'dojo:stage',
        'copy:main',
        'processhtml:main'
    ]);
    grunt.registerTask('deploy', [
        'copy:toDts'
    ]);
    grunt.registerTask('sauce', [
        'jasmine:main:build',
        'connect',
        'saucelabs-jasmine'
    ]);
    grunt.registerTask('travis', [
        'if-missing:esri_slurp:travis',
        'jshint:main',
        'jscs:main',
        'sauce',
        'build-prod'
    ]);
};
