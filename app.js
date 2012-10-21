/**
 * @author		Felix Milea-Ciobanu @felix_mc <felixmilea@gmail.com>
 * @version		1.0
 *
 * @see <a href="https://github.com/felixmc/shortnr">GitHub Repository</a>
 * @see <a href="http://fmc.io/">Example</a>
 */

// ------------------------------
// setup and config
// ------------------------------

// load config file first (@see config.js)
var config = require( "./config" );

// load database module which contains all the database-related methods for the service (@see database.js)
var database = require( "./database" );

// load modules
var http		= require( "http" ),
	fs			= require( "fs" );
	express		= require( "express" ),
	app			= express(),
	params		= require( "express-params" ),
	log			= require( "custom-logger" ).config({ level: config.CONSOLE_LOG_LEVEL });

// listen on specified port
app.listen( config.PORT );

// load params module as middleware for express. It makes handling custom parameters a lot easier
params.extend( app );

// define urlCode as a URL segment to watch for
app.param( "urlCode", config.CODE_PATTERN );

// create a database client from the config
// notice that the "custom-logger" module is passed as well so that DB functions can log to the console
database.connect( config.database, log );

// setup variables to store actual lists
var whitelist, blacklist;

// check to see if the whitelist is enabled (@see config.js)
if ( config.WHITELIST )
{
	fs.readFile( config.WHITELIST, "utf8", function( error, data )
	{
		if ( error )
		{
			log.error( error );
		}
		else
		{
			whitelist = data.split( "\n" );
		}
	});
}

// check to see if the blacklist is enabled (@see config.js)
if ( config.BLACKLIST )
{
	fs.readFile( config.BLACKLIST, "utf8", function( error, data )
	{
		if ( error )
		{
			log.error( error );
		}
		else
		{
			blacklist = data.split( "\n" );
		}
	});
}


/**
 * Used in middleware to filter connections by the whitelist.
 * 
 * @param req			Express.js request object
 * @param res			Express.js response object
 * @param next			Express.js next function
 * @param passCallback	function to be executed if the client is found on the whitelist
 * @param failCallback 	function to be executed if the client is not found on the whitelist
 */
var whitelistClient = function( req, res, next, passCallback, failCallback )
{
	if ( whitelist.indexOf( req.real_ip ) != -1 )
	{
		if ( passCallback )
		{
			passCallback( req, res, next );
		}
		else
		{
			next();
		}
	}
	else
	{
		if ( failCallback )
		{
			failCallback( req, res, next );
		}
		else
		{
			show_403();
		}
	}
}


/**
 * Used in middleware to filter connections by the whitelist.
 * 
 * @param req			Express.js request object
 * @param res			Express.js response object
 * @param next			Express.js next function
 * @param passCallback	function to be executed if the client is found on the blacklist
 * @param failCallback 	function to be executed if the client is not found on the blacklist
 */
var blacklistClient = function( req, res, next, passCallback, failCallback )
{
	if ( blacklist.indexOf( req.real_ip ) != -1 )
	{
		if ( passCallback )
		{
			passCallback( req, res, next );
		}
		else
		{
			show_403();
		}
	}
	else
	{
		if( failCallback )
		{
			failCallback( req, res, next );
		}
		else
		{
			next();
		}
	}
}


/**
 * Return 403 error if the client is denied access to the API or service.
 * 
 * @param req			Express.js request object
 * @param res			Express.js response object
 */
var show_403 = function( req, res )
{
	var location = "the API";

	if ( config.LIST_SCOPE == 3 )
	{
		location = "this service";
	}

	// send error to client
	res.send( 403, "Error 403: You do not have permission to query " + location + "." );	
	res.end();

	// log error to console
	log.warn( "Client " + req.real_ip + " tried to access " + location + " and was denied." );
}


/**
 * Middleware for parsing the real IP address from the client.
 * 
 * @param req			Express.js request object
 * @param res			Express.js response object
 * @param next			Express.js next function
 */
app.use( function( req, res, next )
{
	/**
	 * Set real_ip property to real IP of client if using a reverse proxy (otherwise it will return 127.0.0.1)
	 * If not using proxy, it should fall back to req.ip
	 */
	req.real_ip = req.header("x-real-ip") || req.ip;

	next();
});


/**
* Middleware for filtering clients based on the whitelist and blacklist.
* 
* @param req			Express.js request object
* @param res			Express.js response object
* @param next			Express.js next function
*/
app.use( function( req, res, next )
{
	// check to see if the filtering has a scope (@see config.js)
	if ( config.LIST_SCOPE > 0 )
	{
		// check that the current request path is affected by the white/black listing (@see config.js)
		var path = ( config.LIST_SCOPE < 3 && req.path.indexOf("/api") == 0 ) || ( config.LIST_SCOPE == 2 && req.path.indexOf("/stats") == 0 ) || ( config.LIST_SCOPE == 3 );

		// check that the current request method is affected by the white/black listing (@see config.js)
		var method = ( config.LIST_SCOPE == 1 && req.method == "POST" ) || ( config.LIST_SCOPE == 2 && ( req.method == "POST" || req.method == "GET" ) ) || ( config.LIST_SCOPE == 3 );

		if ( path && method )
		{
			// if whitelist and blacklist are both enabled
			if ( config.WHITELIST != undefined && config.BLACKLIST != undefined )
			{
				// if whitelist "gets the last word" (@see config.js)
				if ( config.WHITELIST_LAST )
				{
					/**
					 * Below the function to filter clients based on the whitelist is called
					 * First three parameters are standard
					 * 
					 * 4th parameter ( passCallback ) is set to undefined so that the whitelist-filtering function
					 * allows the client to continue on with their request if they are on the whitelist
					 * 
					 * 5th parameter ( failCallback ) is set to the blacklist-filtering function
					 * this means that if the client is not on the whitelist, it will be checked against the blacklist
					 * before being allowed to proceed with their request
					 * 
					 * This means that the client will always fulfill their request IFF they are on the whitelist,
					 * regardless if they are also on the blacklist or not
					 * OR IFF they are NOT on the blacklist
					 */
					whitelistClient( req, res, next, undefined, blacklistClient );
				}
				else
				{
					/**
					 * Below the function to filter clients based on the blacklist is called
					 * First three parameters are standard
					 * 
					 * 4th parameter ( passCallback ) is set to the show_403 function
					 * so that clients who are matched on the blacklist cannot fulfill their requests
					 *
					 * 5th parameter ( failCallback ) is set to the whitelist-filtering function
					 * this means that if the client is not on the blacklist, it will be checked against the whitelist
					 * before being allowed to proceed with their request
					 * 
					 * This means that the client will only fulfill their request IFF they are NOT on the blacklist,
					 * BUT they are on the whitelist
					 */
					blacklistClient( req, res, next, show_403, whitelistClient );
				}
			}

			// if only whitelist is enabled
			else if ( config.WHITELIST != undefined )
			{
				/**
				 * The whitelist-filtering function below will only allow requests from clients on the list
				 * and will block everyone else's requests
				 */
				whitelistClient( req, res, next );
			}

			// if only blacklist is enabled
			else if ( config.BLACKLIST )
			{
				/**
				 * The blacklist-filtering function below will block all requests from clients on the list
				 * and will allow everyone else to fulfill their request
				 */
				blacklistClient( req, res, next );
			}
			else
			{
				next();
			}
		}
		else
		{
			next();
		}
	}
	else
	{
		next();
	}
});


/**
 * Middleware for parsing the request body as JSON.
 * 
 * @param req			Express.js request object
 * @param res			Express.js response object
 * @param next			Express.js next function
 */
app.use( function( req, res, next )
{
	req.setEncoding( "utf8" );
	
	/**
	 * create a new property to store the actual request body
	 * the "body" property will be overwritten with the parsed version of the request body
	 */
	req.rawBody = "";

	// listen for data chunks and construct the raw body
	req.on( "data", function( chunk )
	{
		req.rawBody += chunk;
	});

	// once the client finishes sending data..
	req.on( "end", function()
	{
		// try to parse request body as JSON
		try
		{
			req.body = JSON.parse( req.rawBody );
		}

		// if it fails, just set it to blank object
		catch (e)
		{
			req.body = {};
		}

		next();
	});
});


// ------------------------------
// setup helper functions
// ------------------------------

/**
 * Generates a new random URL code.
 * 
 * @return code			A randomly-generated URL code based on the config.
 */
function generateCode()
{
	var length = config.CODE_LENGTH,
		code = "";

	while( length != 0 )
	{
		code += config.CODE_CHARACTERS.charAt( Math.floor( Math.random() * config.CODE_CHARACTERS.length ) );
		length--;
	}

	return code;
}


/**
 * Generates a new random URL code, that is also unique in the database.
 * 
 * @param callback		A function to be executed once a new unique URL code is generated.
 *						This function will take the new URL code as a parameter.
 *
 * @return code			A unique randomly-generated URL code based on the config.
 */
function uniqueCode( callback )
{
	/**
	 * Takes in a URL code and checks to see if it's already being used.
	 * If the URL code is already in use, it generates a new one and calls itself until a unique URL is found.
	 *
	 * @param code			A valid URL code to be searched for in the database.
	 */
	var tryURL = function( code )
	{
		database.URLFromCode( code, function( url )
		{
			if ( url == undefined )
			{
				callback( code );
			}
			else
			{
				tryURL( generateCode() );
			}
		});
	}

	tryURL( generateCode() );
}


/**
 * Checks to see if the given URL is long enough to be shortened.
 * 
 * @param url		The URL to be analyzed.
 */
function isLongEnough( url )
{
	return url.length > ( config.BASE_URL.length + config.CODE_LENGTH);
}


// ------------------------------
// setup the web server/REST service
// ------------------------------

// first setup the home page aka static part of the site
if ( config.SHOW_STATIC_PAGE )
{
	app.get( "/", function( req, res )
	{
		var output = "";

		// make a GET request to static page
		http.get( config.STATIC_LOCATION, function( response )
		{
			response.setEncoding( "utf8" );

			// load the page one chunk at a time..
			response.on( "data", function( chunk )
			{
				output += chunk;
			});
			
			// once the page is finished loaded, return contents of static page to client
			response.on( "end", function()
			{
				res.send( output );			
			});
		});
	});
}


/**
 * Check to see if the stats functionality is enabled.
 */
 if ( config.ENABLE_STATS )
 {

	/**
	 * Returns stats about the service in JSON format.
	 */
	app.get( "/stats/", function( req, res )
	{
		database.getURLCount( function( urls )
		{
			database.getTotalVisits( function( count )
			{
				res.json( 200, { urls: urls, visits: count } );
				res.end();
				log.info( "GET request to \"" + req.path + "\" from client: " + req.real_ip );
			});
		});
	});

	/**
	 * Returns stats about a specified URL in JSON format.
	 */
	app.get( "/stats/:urlCode", function( req, res )
	{
		database.getURLDate( req.params.urlCode[0], function( date )
		{
			if ( date == undefined )
			{
				res.send( 404, "Error 404: There is no URL associated with this code." );
				res.end();
				log.info( "GET request to \"" + req.path + "\" from client: " + req.real_ip );
			}
			else
			{
				database.getURLVisits( req.params.urlCode[0], function( count )
				{
					res.json( 200, { created: date, visits: count } );
					res.end();
					log.info( "GET request to \"" + req.path + "\" from client: " + req.real_ip );
				});
			}
		});
	});
}


/**
 * Redirects the client when they try to access a shortened URL.
 */
app.get( "/:urlCode", function( req, res )
{
	// query the URL code in the database (@see database.js)
	database.URLFromCode( req.params.urlCode[0], function( url )
	{
		// if URL was found in the database..
		if( url != undefined )
		{
			var status = 301;
			
			// redirect to matching URL and auto-expire the permanent redirect so that it can be logged again in the future
			res.writeHead( status, { "Location": url, "Expires": (new Date).toGMTString() } );
			res.end();
			
			// log visitor data into database
			database.logVisit( req.params.urlCode[0], status, req );

			// log request to the console
			log.info( "GET request to \"" + req.path + "\" - 301: Successfully redirected user to URL \"" + url + "\"" );
		}

		// else if there's no matching URL
		else
		{
			var status = 404;
			var message = "Error 404: This URL does not redirect to anything.";

			// send error message to browser
			res.send( status, message );

			// log visitor data into database
			database.logVisit( req.params.urlCode[0], status, req );

			// log request to the console
			log.warn( "GET request to \"" + req.path + "\" - " + message );
		}
	});
});


/**
 * Handles API requests to "translate" a URL code into the actual URL.
 */
app.get( "/api/:urlCode", function( req, res )
{
	// attempt to retrieve URL from database based on code (@see database.js)
	database.URLFromCode( req.params.urlCode[0], function( url )
	{
		var status = 0;

		// if URL was found in the database..
		if ( url != undefined )
		{
			status = 200;

			// send long URL to client
			res.send( status, url );

			// log request to the console
			log.info( "GET request to \"" + req.path + "\" - 200: Successfully returned the URL \"" + url + "\"" );
		}

		// else if there's no matching URL
		else
		{
			status = 404;
			var message = "Error 404: The URL code \"" + req.params.urlCode[0] + "\" does not match any URL in the database.";

			// send error message to client
			res.send( status, message );

			// log request to the console
			log.warn( "GET request to \"" + req.path + "\" - " + message );
		}

		// log request to database
		database.logTranslate( req.params.urlCode[0], status, req.real_ip );
	});
});


/**
 * Handles API requests to shorten a URL.
 */
app.post( "/api/?", function( req, res )
{
	// retrieve client history from the database (@see database.js)
	database.clientHistory( req.real_ip, config.STRICT_LIMITS, function( history )
	{
		var status = 0;

		// check individual time-frame limits
		if ( config.limits.MINUTE != 0 && history.minute >= config.limits.MINUTE )
		{
			status = 429;
			res.send( status, "Error 429: Your IP address has reached or exceeded its API requests limit of " + config.limits.MINUTE + " requests per minute." );
			log.warn( "Client " + req.ip + " has reached its API requests limit of " + config.limits.MINUTE + " requests per minute." );
		}
		else if ( config.limits.HOUR != 0 && history.hour >= config.limits.HOUR )
		{
			status = 429;
			res.send( status, "Error 429: Your IP address has reached or exceeded its API requests limit of " + config.limits.HOUR + " requests per hour." );
			log.warn( "Client " + req.ip + " has reached its API requests limit of " + config.limits.HOUR + " requests per hour." );
		}
		else if ( config.limits.DAY != 0 && history.day >= config.limits.DAY )
		{
			status = 429;
			res.send( status, "Error 429: Your IP address has reached or exceeded its API requests limit of " + config.limits.DAY + " requests per day." );
			log.warn( "Client " + req.ip + " has reached its API requests limit of " + config.limits.DAY + " requests per day." );
		}

		// if limits haven't been met
		else
		{
			var body = req.body,
				url = req.body.url;

			// if the URL is valid
			if ( url && url.match( config.URL_PATTERN ) )
			{
				// if the URL is long enough to be shortened
				if ( config.ALLOW_SHORT_URLS || ( !config.ALLOW_SHORT_URLS && isLongEnough( url ) ) )
				{
					// check to see if someone else already shortened that URL (@see database.js)
					database.codeFromURL( url, function( code )
					{
						// if the URL is not in the database
						if ( code == undefined )
						{
							// generate a unique URL code to be associated with this URL
							uniqueCode( function( code )
							{
								database.insertURL( code, url, req.real_ip, function( newCode )
								{
									status = 201;

									// return shortened URL to client
									res.send( status, config.BASE_URL + newCode );
						
									// log URL creation to console
									log.info( "POST request to \"" + req.path + "\" - 201 Created: New URL shortened: " + ( config.BASE_URL + newCode ) );

									// log API request to database
									database.logInsert( newCode, status, req.real_ip );
								});
							});
						}

						// else if someone else already shortened this link
						else
						{
							status = 200;
							
							// return shortened URL to client
							res.send( status, config.BASE_URL + code );
							
							// log URL creation to console				
							log.info( "POST request to \"" + req.path + "\" - 200 OK: Already shortened URL returned: " + ( config.BASE_URL + code ) );

							// log API request
							database.logInsert( code, status, req.header("x-real-ip") );
						}
					});
				}
				
				// else if URL was already short enough
				else
				{
					status = 400;
					var message = "Error 400: The submitted URL is already as short enough and would not benefit from shortening.";

					// send error to client
					res.send( status, message );

					// log error to console
					log.warn( "POST request to \"" + req.path + "\" - " + message );

					// log API request to database
					database.logInsert( "", status, req.real_ip );
				}
			}

			// if request body appeared to be blank
			else if ( Object.keys( body ).length == 0 )
			{
				status = 400;
				var message = "Error 400: The request body is empty or contains invalid JSON.";

				// send error to client
				res.send( status, message );

				// log error to console
				log.warn( "POST request to \"" + req.path + "\" - " + message );

				// log API request to database
				database.logInsert( "", status, req.real_ip );
			}

			// if the request body contained valid JSON with a "url" property BUT that property was left blank
			else if ( url == undefined )
			{
				status = 400;
				var message = "Error 400: The request does not contain an \"url\" property.";

				// send error to client
				res.send( status, message );

				// log error to console
				log.warn( "POST request to \"" + req.path + "\" - " + message );

				// log API request to database
				database.logInsert( "", status, req.real_ip );
			}

			// else if the URL was just invalid
			else
			{
				status = 400;
				var message = "Error 400: The following provided URL seems to be invalid: \"" + url + "\"";

				// send error to client
				res.send( status, message );

				// log error to console
				log.warn( "POST request to \"" + req.path + "\" - " + message );

				// log api request to database
				database.logInsert( "", status, req.real_ip );
			}
		}
	});
});

/**
 * Catches all other requests, returning Error 400 to the client
 */
app.all( "*", function( req, res )
{
	// send error to client
	res.send( 400, "Error 400: The request could not be fulfilled due to bad synthax. Please see the documentation on how to properly use this service's API." );

	// log error to console
	log.warn( "Error 400: Bad request to \"" + req.path + "\"" );
});