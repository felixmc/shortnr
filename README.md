# About

Shortnr is a node.js app for running a RESTful URL-shortening service. It is written in node.js and uses MySQL as it's database system.

Shortnr provides an API that users can use to shorten URLs, redirect users accessing shortened URLs, view the redirect location of a shortened URL without going to it, and even view statistics about shortened URLs.

It also keeps track of data about who is accessing the API, including analytics about people accessing shortened URLs and being redirected.

One could use Shortnr to run their own URL-shortening service similar to bit.ly or tinyurl.com.

### Features

- RESTful API for inserting, translating, retrieving statistics about URLs.
- Written in node.js and MySQL for speed and scalability.
- Ability to specify a Regex pattern for filtering what URLs can be shortened.
- Handles URL duplicates and only stores a URL in the database once, even if multiple people attempt to shorten it.
- Ability to proxy a static page to the root URL ("/") of the service.
- Ability to set the length and characters from which to generate shortened URLs.
- Ability to set limits on the amount of URL-shortening requests per client in a certain amount of time.
- Ability to whitelist and/or blacklist clients by IP address, restricting who can access the API.
	- Ability to customize the scope of the whitelist/blacklist functionality to only certain parts of the API.


### Background

I started this project during break for college just for fun and to give me something to do. I knew I wanted to do something with node.js, and was also interested into learning more about how HTTP works, so I thought a RESTful service would be a great project.

While this project turned out into a pretty great learning experience for me, and though I've been messing around in node.js for a while now, I learned node.js in a very informal setting, so there are bound to be things in my code that are not standard practice or perhaps not the best method of accomplishing something. As such, if you are a more experience node.js developer and happen to take a look at the source, I would very much appreciate any feedback.

### Support

If you need help or encounter any problems with Shortnr, shout out to [@felix_mc](http://twitter.com/#!/felix_mc) on Twitter.



# Installation

### 1. Get the code

	git clone git://github.com/felixmc/shortnr.git

### 2. Install Modules

	cd shortnr
	npm install

### 3. Configure Shortnr

Edit the `config.js` file and enter your database configuration as well as well as specify the length of the URLs the service will generate as this will affect the database setup.

Make sure that you already created the MySQL database you plan on using with Shortnr.

### 4. Generate Database Tables

The following will create the appropriate tables in your database based on your configuration. 

	npm db_config

If you change the "CODE_LENGTH" parameter of your configuration, you will need to run this again. Doing so might delete any data you had stored in your Shortnr database.

### 5. Running Shortnr

Finally, you can run Shortnr like any other node.js app:

	node app

If you would like to run Shortnr as a daemon on your server, take a look at [forever](https://github.com/nodejitsu/forever).

### 6. Using Nginx as reverse proxy (optional)

If you'd like to use Nginx as a reverse proxy for your Shortnr service, a sample configuration file is provided in extras/nginx.conf.

Simply replace `3000` and `example.com` with your own values and place the file inside your nginx conf directory.



# Configuration

The information below is supposed to help you when setting up your config.js file.

The file itself is thoroughly documented and contains most of the same info.

### Service

- The `database` property should be self-explanatory. You can use the `tables` property to customize the name of the tables in which different things will be stored.

- The `PORT` property determines what port the service will listen to.

- `BASE_URL` is the web address to the service and will be used when generating shortened URLs.

- `SHOW_STATIC_PAGE` determines whether a static website should be loaded at the root ("/") of the service. This allows you to setup a home page for the service.

- `STATIC_LOCATION` is the location the service will return to the client when accessing "/" if the `SHOW_STATIC_PAGE` property is set to `true`. Rather than redirecting the uesr, it will act as a proxy, loading the static location at the root ("/") of the service. This was designed to be used with an AWS S3-like static site.

- `ENABLE_STATS` determines whether clients can access service and URL statistics via "/stats/" and "/stats/:urlCode".

- `CONSOLE_LOG_LEVEL` configures what is outputted to the console. It uses the [Custom-Logger](https://github.com/felixmc/custom-logger) module internally.
	- 0 => All actions are logged.
	- 1 => Only Warnings and Errors are logged.
	- 2 => Only Errors are logged.
	- 3 => Nothing is logged.

### URL and URL Code

The URL code is the unique identifier that is associated with a URL in the database. It is the part that shows up after the domain in a shortened URL. For example, in the shortened URL "http://fmc.io/abcde", "abcde" is the URL code.

- `CODE_LENGTH` specifies how many character the URL code should be. This property should be filled out before running `npm db_setup` as it will affect the length of certain table fields.

- `CODE_CHARACTERS` specifies what characters Shortnr should use when generating a new URL code. This probably won't be edited too much.

- `CODE_PATTERN` specifies how URL codes are identified. It is *very* important that the Regex pattern assigned to this property reflex the values in your `CODE_LENGTH` and `CODE_CHARACTERS` properties. Currently there is no way of generating this automatically. There's a plan to fix this in the future.

- `URL_PATTERN` specifies a Regex pattern for validating URLs before being accepted by the service. The default Regex is pretty robust, however you can edit this property if you'd like to specify your service to accept only certain types of URLs, such as images maybe, or to restrict the domain of the allowed URLs.

### Restrictions

For the purpose of this service, a client is someone using the API. Clients are distinguished by their IP address. This might change in future versions.

- `ALLOW_SHORT_URLS` determines whether the service will allow already short URLs to be shortened by the service. Setting this value to `false` might be useful in preventing spam by double-shortening the URL in order to conceal its final destination.

- `limits` determines how many times a client can query to shorten a URL within a specif timeframe (minute, hour, day). This is useful for preventing spam or DDOS attacks against your Shortnr service. Setting any of the `limits` properties to `0` will disable that limit.

- `STRICT_LIMITS` if set to true, the service will count both successful and unsuccessful attempts to shorten a URL against the client's limits. Unsuccessful attempts include attempts to insert already short URLs, invalid URLs, and requests with an unproperly formatted body. Any request that does not return a 200 or 201 status code is considered unsucessful.

- `WHITELIST` specifies a file path containing a list of IP addresses separated on different lines. If enabled, the whitelist will determine which clients are allowed to connect. Leave blank or set to undefined to disable feature.

- `BLACKLIST` specifies a file path containing a list of IP addresses separated on different lines. If enabled, the whitelist will determine which clients are allowed to connect. Leave blank or set to undefined to disable feature.

- `WHITELIST_LAST` determines whether the whitelist or blacklist takes predence when they are both enabled.
	- When set to `true`, the whitelist "wins" if the client is on both lists (aka the client goes through even though they are also blacklisted).
		- In this scenario, the client also goes through if they are NOT on the blacklist, regardless of if they are on the whitelist or not.
		- This is because the blacklist is checked first, and the whitelist is only checked if the client is blacklisted.
		- This is similar to Apache's "Order Deny, Allow" option.
	- When set to true false, the blacklist "wins" if the client is on both list.
		- This means that the whitelist is checked first, and ONLY clients on the whitelist will proceed.
		- Then, the client is checked against the blacklist and is allowed to proceed ONLY IF they are NOT on the blacklist.
		- This means that only clients who are on the whitelist, but NOT on the blacklist will proceed. 
		- This is similar to Apache's "Order Allow, Deny" option.
	- This option is ignored if either the whitelist or the blacklist is undefined.
	- For the actual filtering logic, see app.js.

- `LIST_SCOPE` determines the scope of the whitelist/blacklist functionality (aka what the whitelist/blacklist will protect).
	- 0 => does not affect anything, listing functionality is turned off.
	- 1 => affects only POST requests to /api
	- 2 => affects both POST and GET requests to /api as well as requests to /stats/
	- 3 => affects all requests to the service.



# API

The only way of interacting with Shortnr is through it's RESTful API.

### URL Redirects

A GET request to `/:urlCode` where `:urlCode` is a valid URL code as specified in `config.js` will return a `301 redirect` to the matching URL in the database, or a `404 not found` error if the URL code is not associated with any URL in the database. Regardless of its outcome, this request is logged into the database under the specified `VISIT_LOG` table, along with the client's IP address, user agent, and HTTP referrer.

### Shortening URLs

Links can be shortened through a POST request to `/api` or `/api/`. The body of the request must validate to JSON and must contain the `url` property which stores the URL to be shortened.

The service takes the following steps when a URL is submitted to be shortened:

1. Check the client limits to make sure the client is allowed to shorten a URL.
	- An error message with status code 429 is returned if the client reached any of the limits specified in `config.js`.
2. Check to see if the URL is valid according to the `URL_PATTERN` property specified in `config.js`. If the URL is invalid, Shortnr will attempt to determine why in order to help the client:
	2a. Check to see if request body contained properly formatted JSON.
		- If not, the service returns an error 400 message telling the client what happened.
	2b. Now assuming the request body contained valid JSON, checks to see if the `url` property was defined.
		- If not, the service returns an error 400 message telling the client what happened.
	2c. Lastly, if the request body contained valid JSON and the `url` property was defined, Shortnr assumes the URL provided did not validate and returns an error 400 message telling the client what happened.
3. Check to see if the URL is too short to be shortened.
	- If the URL is too short, an appropriate error 400 message telling the client what happened is returned.
4. Check to see if the URL has already been shortened in the past.
	- If it has, return the existing short URL associated with the provided URL. This returns a response code 200.
	- If it has not, a new unique URL code is generated and is returned to the client. This returns a response code 201.

Regardless of its outcome, this request is logged into the database under the specified `INSERT_LOG` table, along with the client's IP address.

### Translating URLs

As a way of helping users of the service fight spam, a translation service is provided that will return the associated URL from a given URL code without redirecting the user's browser.

A GET request to `/api/:urlCode` where `:urlCode` is a valid URL code as specified in `config.js` will return status code 200 and the associated URL in the response body if the URL code exists in the database, or a `404 not found` error if the URL code is not associated with any URL in the database. Regardless of its outcome, this request is logged into the database under the specified `VISIT_LOG` table, along with the client's IP address.

### Accessing Statistics

A GET request to `/stats/` will return basic statistics about the current service in JSON format to the client. The statistics currently only contain the number of URLs shortened and the total number of redirects the service provided.

A GET request to `/stats/:urlCode` where `:urlCode` is a valid URL code as specified in `config.js` will return status code 200 and the date of creation as well as the number of visits of the associated URL as JSON in the response body if the URL code exists in the database, or a `404 not found` error if the URL code is not associated with any URL in the database.

Requests to the stats portion of the API are not logged in the database.

### Catch-All

If the client's request did not match any of the above queries, it is returned a status code `400` page with the message "Error 400: The request could not be fulfilled due to bad synthax. Please see the documentation on how to properly use this service's API." These requests are not logged in the database.



# Database Table Structure
Shortnr uses 4 different database tables to store the data it needs in order to function, as well as analytics about its usage. The sections below are based on the default table names as specified in `config.js`.

### urls

This table stores URLs and their associated URL code. It is mainly used to respond to redirects and translation queries. It also stores the IP address of the client who _first_ shortened that URL and a timestamp of when the URL was _first_ shortened.

The following is the SQL structure of the table:

	`url_code` varchar( CODE_LENGTH ) NOT NULL,
	`long_url` varchar(512) NOT NULL,
	`ip_address` varchar(15) NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	UNIQUE KEY `url_code` (`url_code`),
	KEY `ip_address` (`ip_address`)

Where `CODE_LENGTH` is a positive integer value representing the length of the URL code as specified in `config.js`.

### insertLog

This table logs all (both successful and unsuccessful) POST requests made to `/api`. This data is used for rate limiting, but could also be used for analytics in terms of analyzing the virality of certain URLs by looking at how many separate times a URL was submitted for shortening, especially over a specific time frame. This table stores the URL code returned to the client, assuming their query was successful; it also stores the HTTP response code returned to the client (`201` if URL was new, `200` if it already existed, and `400` if the request was unsuccessful due to invalid formatting of either the request or URL), the IP address of the client, and a timestamp of when the request was made.

The following is the SQL structure of the table:

	`request_id` int(11) NOT NULL AUTO_INCREMENT,
	`url_code` varchar( CODE_LENGTH ) NOT NULL,
	`response` enum('200','201','400') NOT NULL,
	`ip_address` varchar(15) NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`request_id`),
	KEY `url_code` (`url_code`,`response`,`ip_address`)

Where `CODE_LENGTH` is a positive integer value representing the length of the URL code as specified in `config.js`.

### visitLog

This table logs "visits" to shortened URLs that the service redirects. The table stores the URL code that the user accessed, the HTTP response code returned by the service (`301` if user was redirected, and `404` if user accessed a code that's not associated with an URL), the IP address of the user (useful if run though a Geolocation service for identifying the physical location of the service's users), the user's user-agent string (aka web browser or HTTP client), the referrer, and a timestamp of when the user accessed the URL.

The following is the SQL structure of the table:

	`visit_id` int(11) NOT NULL AUTO_INCREMENT,
	`url_code` varchar( CODE_LENGTH ) NOT NULL,
	`response` enum('301','404') NOT NULL,
	`ip_address` varchar(15) NOT NULL,
	`user_agent` varchar(512) NOT NULL,
	`referral` varchar(512) NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`visit_id`)

Where `CODE_LENGTH` is a positive integer value representing the length of the URL code as specified in `config.js`.

### translateLog

This table logs translation queries, which are GET requests made to `/api`. This table is not necessary for the service to function, but it could potentially provide some useful data about which URLs users seem to mistrust and might contain spam. The table stores the URL code the user attempted to translate, the HTTP response code returned by the service (`200` if the request was successful, and `404` if user accessed a code that's not associated with an URL), the user's IP address, and a timestamp of when the query was made.

The following is the SQL structure of the table:

	`query_id` int(11) NOT NULL AUTO_INCREMENT,
	`url_code` varchar(5) NOT NULL,
	`response` enum('200','404') NOT NULL,
	`ip_address` varchar(15) NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`query_id`),
	KEY `query` (`url_code`,`response`)

Where `CODE_LENGTH` is a positive integer value representing the length of the URL code as specified in `config.js`.

# License

Shortnr uses the MIT License. Take a look at LICENSE for the actual text of the license.



# Todos

For a list of things that still need to be done, take a look at TODO.md.