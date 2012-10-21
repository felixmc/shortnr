/**
 * @author		Felix Milea-Ciobanu @felix_mc <felixmilea@gmail.com>
 * @version		1.0
 *
 * @see <a href="https://github.com/felixmc/shortnr">GitHub Repository</a>
 * @see <a href="http://fmc.io/">Example</a>
 */

var config = require( "./config" ),
	mysql = require( "mysql" );

var db_config = config.database,
	db_client = mysql.createConnection( db_config );

var queries = [
	"CREATE TABLE IF NOT EXISTS `" + db_config.tables.INSERT_LOG + "` (\n  `request_id` int(11) NOT NULL AUTO_INCREMENT,\n  `url_code` varchar(" + config.CODE_LENGTH + ") NOT NULL,\n  `response` enum('200','201','400') NOT NULL,\n  `ip_address` varchar(15) NOT NULL,\n  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  PRIMARY KEY (`request_id`),\n  KEY `url_code` (`url_code`,`response`,`ip_address`)\n) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;",
	"CREATE TABLE IF NOT EXISTS `" + db_config.tables.TRANSLATE_LOG + "` (\n  `query_id` int(11) NOT NULL AUTO_INCREMENT,\n  `url_code` varchar(" + config.CODE_LENGTH + ") NOT NULL,\n  `response` enum('200','404') NOT NULL,\n  `ip_address` varchar(15) NOT NULL,\n  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  PRIMARY KEY (`query_id`),\n  KEY `query` (`url_code`,`response`)\n) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;",
	"CREATE TABLE IF NOT EXISTS `" + db_config.tables.URLS + "` (\n  `url_code` varchar(" + config.CODE_LENGTH + ") NOT NULL,\n  `long_url` varchar(512) NOT NULL,\n  `ip_address` varchar(15) NOT NULL,\n  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  UNIQUE KEY `url_code` (`url_code`),\n  KEY `ip_address` (`ip_address`)\n) ENGINE=InnoDB DEFAULT CHARSET=latin1;",
	"CREATE TABLE IF NOT EXISTS `" + db_config.tables.VISIT_LOG + "` (\n  `visit_id` int(11) NOT NULL AUTO_INCREMENT,\n  `url_code` varchar(" + config.CODE_LENGTH + ") NOT NULL,\n  `response` enum('301','404') NOT NULL,\n  `ip_address` varchar(15) NOT NULL,\n  `user_agent` varchar(512) NOT NULL,\n  `referral` varchar(512) NOT NULL,\n  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  PRIMARY KEY (`visit_id`),\n  KEY `query` (`url_code`,`response`),\n  KEY `query_2` (`url_code`),\n  KEY `response` (`response`)\n) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;"
];

// keep track of how many queries have been executed
var completed = 0;

// loop though the queries
for ( i in queries )
{
	db_client.query( queries[ i ], function( error )
	{
		if ( error )
		{
			console.error( error );
		}
		else
		{
			// increment completed
			completed++;

			// check if it's done
			if ( completed == queries.length ) 
			{
				console.log( "\nDatabase configured successfully. You may now run shortnr.\n" );
				process.exit(0);
			}
		}
	});
}
