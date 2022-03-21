
# Create a new Heroku app

 > First of all you need to have a heroku account


### Create a heroku.yml config file for your project in the root directory of your project


## Install Heroku CLI
```bash
$ npm i -g heroku
```

## Login to Heroku

```bash
$ heroku login
```

## Start git

```bash
# initialize git
$ git init

# create a gitignore file
$ npx gitignore node

## git add and commit
$ git add && git commit -m "initial commit"
```

## Create a new Heroku app

```bash
$ heroku apps:create <app-name>
```

## Verify the heroku remote is setup

```bash
$ git remote -v
```

## Link the app to a container

```bash
$ heroku stack:set container
```

## Pushing to Heroku $master

```bash
$ git push heroku master/ main
```

## Open the app in the browser

```bash
$ heroku open
```

## See the logs of the app

```bash
$ heroku logs -t
## -t is for tailing
```

## Remove app from Heroku

```bash
$ heroku apps:delete

## type the app name and hit enter
```