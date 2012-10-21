/**
 * Configure the MySQL database setup
 */
exports.database = {
	host     : "localhost",
	user     : "root",
	password : "",
	database : "shortnr",

	// customize table names
	tables	 :
	{
		URLS		: "urls",
		VISIT_LOG	: "visitLog",
		INSERT_LOG	: "insertLog",
		TRANSLATE_LOG: "translateLog"
	}
};


/**
 * Port on which the server to listen to. 
 */
exports.PORT = 3000;


/**
 * URL of the service, will be used when returning shortened URLs.
 * For example, if your BASE_URL is set to "http://example.com/", your shortened URLs might look like "http://example.com/1aBcDe"
 */
exports.BASE_URL = "http://example.com/";


/**
 * Whether the / request to the server should return a static page (this service was originally designed to be used with an AWS S3-like static site).
 * It will do so acting as a sort of proxy: it will download the static page and return it to the client when they send a request to /.
 * This will be more customizable in the future (@see TODO.md).
 */
exports.SHOW_STATIC_PAGE = true;


/**
 * URL of static files location, used to load front page of website.
 * This could be the index location of a static site (something like "http://static.example.com/").
 * This was designed to be used with a static site running from a AWS S3 bucket.
 * This will be more customizable in the future (@see TODO.md).
 */
exports.STATIC_LOCATION = "http://static.example.com/";


/**
 * If set to true, clients will be able to access /stats/ to retrieve JSON statistics about the service.
 * Clients would also be able to access /stats/:urlCode to access JSON statistics about a specific URL code.
 */
exports.ENABLE_STATS = true;


/**
 * Configure console logging output.
 * 
 * 0 => All actions are logged.
 * 1 => Only Warnings and Errors are logged.
 * 2 => Only Errors are logged.
 * 3 => Nothing is logged.
 *
 * @see <a href="https://github.com/felixmc/custom-logger">Custom-Logger module documentation</a>
 */
exports.CONSOLE_LOG_LEVEL = 0;



/*******************************************************************************************************************************************************/


/**
 * Length of the code part of the short URLs to construct.
 */
exports.CODE_LENGTH = 5;


/**
 * Characters to construct the code for the short URLs from.
 * Probably won't want to change this too much.
 * This is not the best way of doing this, future versions might have a reverse-Regex sort of implementation (@see TODO.md).
 */
exports.CODE_CHARACTERS = "abcdefghiklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXTZ0123456789";


/**
 * Regex pattern to validate URL code to match for a redirect or translation request.
 * You should customize it so that it matches the above code length and characters.
 * Currently, there's no way to generate it automatically.
 * This is not the best way of doing this, future versions might have a reverse-Regex sort of implementation (@see TODO.md).
 */
exports.CODE_PATTERN = /^[a-zA-Z0-9]{5}$/;


/**
 * Pretty complex Regex pattern for validating URLs to be shortened.
 * You probably won't want to edit this unless you're planning on restricting your service to specific types of URLs (maybe such as images or something).
 * You could also potentially edit this so that it supports URLs only from specific domains, etc.
 */
exports.URL_PATTERN = /(https?|ftps?)\:\/\/([a-z0-9+!*(),;?&=\$_.-]+(\:[a-z0-9+!*(),;?&=\$_.-]+)?@)?([a-z0-9+\$_-]+(\.[a-z0-9+\$_-]+)*)(\:[0-9]{1,5})?(\/([a-z0-9,+\$_-]\.?)+)*\/?(\?[a-z+&\$_.-][a-z0-9,.;:@&%=+\/\$_.-]*)?(#[a-z_.-][a-z0-9+\$_.-]*)?/gi;



/***********************************************************************************************************************************************************/


/**
 * Allow URLs that are shorter or just as short as the final shortened URL to still be shortened.
 * Default is false to prevent spam by masking the long URL by shortening it multiple times or through multiple services.
 */
exports.ALLOW_SHORT_URLS = false;


/**
 * Setup limits for POST requests to the API (aka URL shortening attempts).
 * Limits are based on client IP address, later might add support for some "client ID" sort of system (@see TODO.md).
 * Set a limit to 0 or undefined to disable it.
 */
exports.limits = {
	MINUTE	: 5, 
	HOUR	: 20,
	DAY		: 100
};


/**
 * Strict limits count both sccessful and unsuccessful attempts to shorten URLs towards API limits in order to prevent DDOS-type attacks against the service.
 * Unsuccessful attempts include attempts to insert already short URLs, invalid URLs, and requests with an unproperly formatted body.
 * Another way to think of unsuccessful requests is any API request that does not return a 200 or 201 status code.
 */
exports.STRICT_LIMITS = true;


/**
 * Specify a file path containing a list of IP addresses on different lines.
 * File path can be either relative or absolute (system path).
 * TODO: add Apache-like support for partial IP addresses and IP address subsets (@see TODO.md).
 * If enabled, the whitelist will determine which clients are allowed to connect.
 * Leave blank or set to undefined to disable feature.
 */
exports.WHITELIST = undefined;


/**
 * Specify a file path containing a list of IP addresses on different lines.
 * File path can be either relative or absolute (system path).
 * TODO: add Apache-like support for partial IP addresses and IP address subsets (@see TODO.md).
 * If enabled, the blacklist will determine which clients are allowed to connect.
 * Leave blank or set to undefined to disable feature.
 */
exports.BLACKLIST = undefined;


/**
 * When both the whitelist and the blacklist are enabled, it decides which one has the final word.
 * When set to true true, the whitelist "wins" if the client is on both lists (aka the client goes through even though they are also blacklisted).
 * In this scenario, the client also goes through if they are NOT on the blacklist, regardless of if they are on the whitelist or not.
 * This is because the blacklist is checked first, and the whitelist is only checked if the client is blacklisted.
 * This is similar to Apache's "Order Deny, Allow" option.
 * 
 * When set to true false, the blacklist "wins" if the client is on both list.
 * This means that the whitelist is checked first, and ONLY clients on the whitelist will proceed.
 * Then, the client is checked against the blacklist and is allowed to proceed ONLY IF they are NOT on the blacklist.
 * This means that only clients who are on the whitelist, but NOT on the blacklist will proceed. 
 * This is similar to Apache's "Order Allow, Deny" option.
 *
 * For the actual filtering logic, @see app.js
 *
 * This option is ignored if either the whitelist or the blacklist is undefined.
 */
exports.WHITELIST_LAST = true;


/**
 * The scope of the whitelist/blacklist functionality (aka what the whitelist/blacklist will protect).
 * 
 * 0 => does not affect anything, listing functionality is turned off
 * 1 => affects only POST requests to /api
 * 2 => affects both POST and GET requests to /api as well as requests to /stats/
 * 3 => affects all requests to the service
 *
 * Might become more customizable in the future (@see TODO.md).
 */
exports.LIST_SCOPE = 1;
