#### Emissions Reduction chart aka [hong-chart]

If you cant make git clone - please try this link https://bitbucket.org/sonnanhaft/hong-chart/get/master.zip 
You will get all the sources in zip file.

#### Init repo and build the project
After you clone git repo, you need to install NodeJS locally, then to run 
```ssh
npm install -g gulp && npm install -g bower
bower install
```
After gulp is installed, from folder with sources you need to run 
```ssh
gulp build
```
So build directry will appear. From this directory you need:
_hong-chart.js_
_hong-chart.css_
_stubs_ folder (with csv files)
_src_ folder (with image files)

Right now hong-chart.js will work with relative to app path. 
This mean if you adding chart to site, and url is like 'www.chart.com/custom/chart', then 
stubs folder should be accessible by url 'www.chart.com/custom/chart/stub'

#### How to run manually built sources
In build folder you will see hong-chart.zip archive with source files. 
This archive contains everything to render the chart. Put it to your local server and open index.html 
inside the server - chart should be rendered properly.

#### How to run manually
To run manually you need html code like this:

```html
<!doctype html>
<html lang="en">
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta charset="UTF-8">
    <title>Emissions Reduction chart</title>

    <script src="//cdnjs.cloudflare.com/ajax/libs/angular.js/1.5.5/angular.min.js"></script>
    <script src="//cdnjs.cloudflare.com/ajax/libs/d3/3.5.16/d3.min.js"></script>
    
    <script src="hong-chart.js"></script>
    <link rel="stylesheet" href="hong-chart.css">
</head>
<body>
<div ng-app="hong-layout">
    <hong-layout></hong-layout>
</div>
</body>
</html>
```

as you see, we are dependent on 2 libraries, and also add our js and css, so in the html you just need this:

```html
<div ng-app="hong-layout">
    <hong-layout></hong-layout>
</div>
```

please mention that angular is used, and it is not possible to add this code snippet dynamically without angular.js knowledge.

#### How to develop/extend

As I mentioned before, I'm using WebStorm for the development. I'm just creating web server by 
pressing right mouse click on index.html file to open the demo. There is gulp file in the project for
 watching the stylus files (css preprocessor) and for target build (minify+concat). So here are tasks 
 that you should use in development:
 
To compile all styl to css.

```ssh
gulp $stylus
```

To watch all changes on styl file and to run _gulp $stylus_ automatically on each *.styl update (run it for rapid development):

```ssh
gulp "$watch-styl"
```

Build project:

```ssh
gulp build
```
