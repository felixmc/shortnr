#Installation

## 1. Get the code

	git clone git://github.com/felixmc/shortnr.git

## 2. Install Modules

	cd shortnr
	npm install

## 3. Configure shortnr

Edit the config.js file and enter your database configuration as well as well as specify the length of the URLs the service will generate as this will affect the database setup.
Make sure you already created the MySQL database you plan on using with Shortnr.

## 4. Generate Database Tables

The following will create the appropriate tables in your database based on your configuration. 

	npm db_config

If you change the "CODE_LENGTH" parameter of your configuration, you will need to run this again. Doing so might delete any data you had stored in your Shortnr database.

## 5. Running Shortnr

Finally, you can run Shortnr like any other node.js app:

	node app

If you would like to run Shortnr as a daemon on your server, take a look at [forever](https://github.com/nodejitsu/forever).

#Configuration
Further documentation on configuring the service can be found inside the `config.js` file which is throughly commented.
