/**
 * @author		Felix Milea-Ciobanu @felix_mc <felixmilea@gmail.com>
 * @version		1.0
 *
 * @see <a href="https://github.com/felixmc/shortnr">GitHub Repository</a>
 * @see <a href="http://fmc.io/">Example</a>
 */

var jsesc = require("jsesc");

var mysql = require( "mysql" ),
	database,
	tables,
	log;


/**
 * Setup connection to MySQL database.
 * 
 * @param config			The database object from the config file.
 * @param _log				The logging module used for outputting information to the console.
 */
exports.connect = function( config, _log )
{
	tables = config.tables;
	delete config.tables;
	database = mysql.createConnection( config );
	log = _log;
};


/**
 * Retrieves the URL from the database based on a given code code.
 * 
 * @param urlCode			The code to look for in the database.
 * @param callback			The function to execute once the database operation has completed.
 *							The found URL (or undefined) is passed as a parameter to that function.
 */
exports.URLFromCode = function( urlCode, callback )
{
	var query = "SELECT `long_url` FROM `" + tables.URLS + "` WHERE `url_code` = '" + jsesc(urlCode) + "'";

	database.query( query, function( error, rows )
	{
		if ( error )
		{
			log.error( error );
		}
		else if ( callback != undefined )
		{
			// if code didn't match an url, return undefined
			var url = rows.length > 0 ? rows[0].long_url : undefined ;
			callback( url );
		}
	});
}


/**
 * Attempts to retrieve the code from a given URL.
 * 
 * @param url_code			The URL to look for in the database.
 * @param callback			The function to execute once the database operation has completed.
 *							The found URL code (or undefined) is passed as a parameter to that function.
 */
exports.codeFromURL = function( url, callback )
{
	var query = "SELECT `url_code` FROM `" + tables.URLS + "` WHERE `long_url` = '" + jsesc(url) + "'";

	database.query( query, function( error, rows )
	{
		if ( error )
		{
			log.error( error );
		}
		else if ( callback != undefined )
		{
			// if the URL didn't match a code, return undefined
			var code = rows.length > 0 ? rows[0].url_code : undefined ;
			callback( code );
		}
	});
}


/**
 * Retrieves the creation date of a specified URL code.
 * 
 * @param callback			The function to execute once the database operation has completed.
 *							The date is passed as a parameter to that function.
 */
exports.getURLDate = function( urlCode, callback )
{
	var query = "SELECT `timestamp` FROM `" + tables.URLS + "` WHERE `url_code` = '" + jsesc(urlCode) + "'";

	database.query( query, function( error, date )
	{
		if ( error )
		{
			log.error( error );
		}
		else if ( callback != undefined )
		{
			if ( date[0] == undefined )
			{
				callback( undefined );
			}
			else
			{
				callback( new Date( date[0].timestamp ) );
			}
		}
	});
}


/**
 * Retrieves the current number of URLs from the database.
 * 
 * @param callback			The function to execute once the database operation has completed.
 *							The number of URLs stored in the database is passed as a parameter to that function.
 */
exports.getURLCount = function( callback )
{
	var query = "SELECT COUNT(*) FROM `" + tables.URLS + "`";

	database.query( query, function( error, count )
	{
		if ( error )
		{
			log.error( error );
		}
		else if ( callback != undefined )
		{
			callback( count[0]["COUNT(*)"] );
		}
	});
}


/**
 * Retrieves the current number of successful URL visits.
 * 
 * @param callback			The function to execute once the database operation has completed.
 *							The number of successful visits logged in the database is passed as a parameter to that function.
 */
exports.getTotalVisits = function( callback )
{
	var query = "SELECT COUNT(*) FROM `" + tables.VISIT_LOG + "` WHERE `response` = '301'";

	database.query( query, function( error, count )
	{
		if ( error )
		{
			log.error( error );
		}
		else if ( callback != undefined )
		{
			callback( count[0]["COUNT(*)"] );
		}
	});
}


/**
 * Retrieves the current number of successful visits to a specific URL.
 * 
 * @param callback			The function to execute once the database operation has completed.
 *							The number of successful visits logged in the database is passed as a parameter to that function.
 */
exports.getURLVisits = function( urlCode, callback )
{
	var query = "SELECT COUNT(*) FROM `" + tables.VISIT_LOG + "` WHERE `response` = '301' AND `url_code` = '" + jsesc(urlCode) + "'";

	database.query( query, function( error, count )
	{
		if ( error )
		{
			log.error( error );
		}
		else if ( callback != undefined )
		{
			callback( count[0]["COUNT(*)"] );
		}
	});
}


/**
 * Inserts a new URL into the database.
 * 
 * @param code				The code to associate the URL with.
 * @param url				The URL to insert in the database.
 * @param ipAddress			The client's IP address.
 * @param callback			The found URL (or undefined) is passed as a parameter to that function.
 */
exports.insertURL = function( code, url, ipAddress, callback )
{
	var query = "INSERT INTO `" + tables.URLS + "`( `url_code`, `long_url`, `ip_address` ) VALUES ( '" + jsesc(code) + "', '" + jsesc(url) + "', '" + jsesc(ipAddress) + "' )";

	database.query( query, function( error )
	{
		if ( error )
		{
			log.error( error );
		}
		else
		{
			callback( code );
		}
	});
}


/**
 * Log a URL-redirect (referred to as a visit in the database).
 * 
 * @param urlCode			The URL code visited.
 * @param status			The HTTP status code returned by the REST service (to differentiate between an actual redirect and a failed attempt aka 404 error).
 * @param request			Express.js request object used for extracting client data.
 * @param callback			A function to run once the database operation has completed.
 */
exports.logVisit = function( urlCode, status, request, callback )
{
	var query = "INSERT INTO `" + tables.VISIT_LOG + "` ( `url_code`, `response`, `ip_address`, `user_agent`, `referral` ) VALUES ( '" + jsesc(urlCode) + "', '" + jsesc(status) + "', '" + request.real_ip + "', '" + jsesc(request.get("user-agent")) + "', '" + request.get("referrer") + "' )";

	database.query( query, function( error )
	{
		if ( error )
		{
			log.error( error );
		}
		else if ( callback != undefined )
		{
			callback();
		}
	});
}


/**
 * Log a URL-insertion attempt into the database.
 * 
 * @param code				The URL code inserted.
 * @param status			The HTTP status code returned by the REST service (to differentiate between successful and unsuccessful requests).
 * @param ipAddress			The client's IP address.
 * @param callback			A function to run once the database operation has completed.
 */
exports.logInsert = function( code, status, ipAddress, callback )
{
	var query = "INSERT INTO `" + tables.INSERT_LOG + "`( `url_code`, `response`, `ip_address` ) VALUES ( '" + jsesc(code) + "', '" + jsesc(status) + "', '" + jsesc(ipAddress) + "' )";

	database.query( query, function( error )
	{
		if ( error )
		{
			log.error( error );
		}
		else if ( callback != undefined )
		{
			callback();
		}
	});
}


/**
 * Log a URL-translation query into the database.
 * 
 * @param urlCode			The URL code translated.
 * @param status			The HTTP status code returned by the REST service (to determine whether a URL was defined for that code at the time).
 * @param ipAddress			The client's IP address.
 * @param callback			A function to run once the database operation has completed.
 */
exports.logTranslate = function( urlCode, status, ipAddress, callback )
{
	var query = "INSERT INTO `" + tables.TRANSLATE_LOG + "` ( `url_code`, `response`, `ip_address` ) VALUES ( '" + jsesc(urlCode) + "', '" + jsesc(status) + "', '" + jsesc(ipAddress) + "' )";

	database.query( query, function( error )
	{
		if ( error )
		{
			log.error( error );
		}
		else if ( callback != undefined )
		{
			callback();
		}
	});
}


/**
 * Retrieve the API history of the client from the database.
 * 
 * @param ipAddress			The client's IP address to get the history of.
 * @param strict			Boolean value that determines whether unsucessful attempts are also counted against the limit.
 * 							true => all requests are counted
 *							false => only 200 and 201 requests are counted
 * @param callback			A function to run once the database operation has completed.
 *							An object containing the client's history is passed as a parameter to this function.
 *							The object contains the following properties: "day", "hour", and "minute" which each contain the number of requests that client has made within that timeframe.
 */
exports.clientHistory = function( ipAddress, strict, callback )
{
	var strictQuery = "";

	// if it's not strict
	if ( !strict )
	{
		// restrict query to only successful requests
		strictQuery = "AND ( `response` = '200' OR `response` = '201' )";
	}

	var query = "SELECT `timestamp` FROM `" + tables.INSERT_LOG + "` WHERE `ip_address` = '" + jsesc(ipAddress) + "'" + strictQuery + " AND `timestamp` > DATE_SUB( NOW(), INTERVAL 24 HOUR)";

	// setup object to be returned via the callback
	var history = { day : 0, hour: 0, minute: 0 };

	database.query( query, function( error, rows )
	{
		if ( error )
		{
			log.error( error );
		}
		else
		{
			// get the current time
			var now = new Date().getTime() / 1000;

			// constant to store the number of seconds in an hour or minute to be used in calculations below
			var SECONDS_COUNT = { HOUR: 3600, MINUTE: 60 };

			// the MySQL query already queries rows in the last 24 hours, so this is already the daily history
			history.day = rows.length;

			/**
			 * In order to preserve resources by avoiding subsequent database calls for each time frame,
			 * it analyzes the logs of the last day and further sub-divides them by hours and minutes.
			 */
			
			// loop through the log rows from the last day
			for ( var i = 0; i < rows.length; i++ )
			{
				// transform the timestamp into seconds
				var then = new Date( rows[i].timestamp ).getTime() / 1000;

				// if the time difference between the log and now is within the last hour..
				if ( now - then <= SECONDS_COUNT.HOUR )
				{
					history.hour++;
				}

				// if the time difference between the log and now is within the last minute..
				if ( now - then <= SECONDS_COUNT.MINUTE )
				{
					history.minute++;
				}
			}

			// return the history results to the callback
			callback( history );
		}
	});
}
