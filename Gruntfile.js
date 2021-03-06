module.exports = function(grunt) {

/*
    build concept:
        - for developement, the application itself is packed
          --> ngtemplates packs all angular templates into one JS file (build/templates.js)
          --> concat packs all application specific javascript (including build/templates.js) into (app/app.all.js)
        - for dist
          --> usemin is used to pack everything (see index.html)


   --> we do this two phase thing, so we don't have to list all js files in the index.html
*/

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
        options : {
            sourceMap :true
        },
        js: {
            src: ['app/app.js','app/components/**/*.js','app/partials/**/*.js','app/views/**/*.js','build/templates.js'],
            //dest: './build/cat/app.js'
            dest: './app/app.all.js'

        }
    },
    watch:{
        scripts: {
            files: ['app/**/*.js','!app/*.all.js'],
            tasks: ['packjs']
        },
        htmls: {
            files:  ['**/*.html'],
            tasks: ['packhtml']
        }
    },
    
    ngAnnotate: {
        app: {
            files: [{
                expand: true,
                src:['app/app.js','app/components/**/*.js','app/partials/**/*.js','app/views/**/*.js'],
                dest: 'annot/'        
            }]
        }      
    },
    ngtemplates:  {     
        InmantaApp:        {
                src: ['**/*.html','!index.html','!bower_components/**/*.html'],
                dest: 'build/templates.js',
                cwd: 'app'
        },
        options :{
            htmlmin: {
                collapseBooleanAttributes:      true,
                collapseWhitespace:             true,
                removeAttributeQuotes:          true,
                removeComments:                 true, // Only if you don't use comment directives! 
                removeEmptyAttributes:          true,
                removeRedundantAttributes:      true,
                removeScriptTypeAttributes:     true,
                removeStyleLinkTypeAttributes:  true
            }
            }
  },
   copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: 'app',
          dest: 'dist',
          src: [
            '*.{ico,png,txt}',
            'index.html',
            'img/*',
            'config.js'
          ]
        },{
          expand: true,
          cwd: 'app/bower_components/bootstrap/fonts',
          src: '*',
          dest: 'dist/fonts'
        },{
          expand: true,
          cwd: 'app/bower_components/font-awesome/fonts',
          src: '*',
          dest: 'dist/fonts'
        },{
          expand: true,
          cwd: 'app/bower_components/angular-awesome-slider/src/img',
          src: '*',
          dest: 'dist/img'
        }]
      }
      
    },
  useminPrepare: {
    html: 'app/index.html',
    options: {
      root: 'app',
      dest: 'dist'
    }
  },
  usemin: {
      html: 'dist/index.html',
      options: {
        root: 'app',
        dest: 'dist'
      }
  },
  compress: {
    main: {
        options: {
          archive: 'dist.tgz',
          mode:'tgz'
        },
        src: ['dist/**']
    }
  },
  easy_rpm: {
    options: {
       name: "inmanta-dashboard",
       version: "2017.3rc1",
       release: "0",
       buildArch: "noarch"
    },
    release: {
     files: [
        {src: "**", dest: "/usr/share/inmanta/dashboard", cwd: "dist"} 
      ]
    }
  }

  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-filerev');
  grunt.loadNpmTasks('grunt-ng-annotate');
  grunt.loadNpmTasks('grunt-angular-templates');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks("grunt-easy-rpm");

  // Default task(s).
  
  grunt.registerTask('packhtml', ['ngtemplates','packjs']);
  grunt.registerTask('packjs', ['concat']);
  grunt.registerTask('default', ['packhtml','watch']);
  grunt.registerTask('rpm', ['dist','easy_rpm:release']);
  
  grunt.registerTask('dist', [
  'packhtml',
  'useminPrepare',
  'copy:dist',
  'concat:generated',
  'cssmin:generated',
  'uglify:generated',
//  'filerev',
  'usemin',
  'compress'
  ]);

};
