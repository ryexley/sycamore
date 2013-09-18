module.exports = function (grunt) {

    grunt.initConfig({

        pkg: grunt.file.readJSON("package.json"),

        meta: {
            banner: "// <%= pkg.name %>, v<%= pkg.version %> | (c) <%= grunt.template.today('yyyy') %> Bob Yexley\n" +
                    "// Description: <%= pkg.description %> \n" +
                    "// Generated: <%= grunt.template.today('yyyy-mm-dd @ h:MM:ss') %>\n" +
                    "// https://github.com/ryexley/sycamore\n" +
                    "// License: http://www.opensource.org/licenses/mit-license\n"
        },

        jshint: {
            all: {
                options: {
                    jshintrc: ".jshintrc",
                    jshintignore: ".jshintignore"
                },
                files: {
                    source: ["source/*.js"]
                }
            }
        },

        concat: {
            options: {
                banner: "<%= meta.banner %>\n"
            },
            dist: {
                src: ["source/requester.js"],
                dest: "dist/requester.js"
            }
        },

        mocha: {
            all: {
                options: {
                    run: true,
                    urls: ["spec/runner.html"]
                }
            }
        },

        uglify: {
            dist: {
                options: {
                    banner: "<%= meta.banner %>"
                },
                files: {
                    "dist/requester.min.js": ["source/requester.js"]
                }
            }
        },

        watch: {
            scripts: {
                files: ["source/*.js", "spec/*.js"],
                tasks: ["default"],
                options: {
                    nospawn: true
                }
            }
        }

    });

    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-mocha");

    grunt.registerTask("default", ["jshint", "build", "test"]);
    grunt.registerTask("build", ["concat", "uglify"]);
    grunt.registerTask("test", ["mocha"]);
}
