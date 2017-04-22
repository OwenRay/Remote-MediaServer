"use strict";

const Settings = require("../Settings");

class Log
{
    /**
     @param {...*} message
     */
    static debug()
    {
        Log.log(Log.LEVEL.DEBUG, arguments);
    }

    /**
     @param {...*} message
     */
    static info()
    {
        Log.log(Log.LEVEL.INFO, arguments);
    }

    /**
     @param {...*} message
     */
    static warning()
    {
        Log.log(Log.LEVEL.WARNING, arguments);
    }

    /**
     @param {...*} message
     */
    static exception()
    {
        Log.log(Log.LEVEL.EXCEPTION, arguments);
    }

    static log(level, message)
    {
        if(level>=Settings.getValue("verbosity")) {
            switch(level)
            {
                case Log.LEVEL.INFO:
                case Log.LEVEL.DEBUG:
                    console.log.apply(console, message);
                    break;
                case Log.LEVEL.WARNING:
                    console.warn.apply(console, message);
                    break;
                case Log.LEVEL.EXCEPTION:
                    console.error.apply(console, message);
                    break;
            }
        }
    }
}

Log.LEVEL = {DEBUG:0, INFO:1, WARNING:3, EXCEPTION:4};

module.exports = Log;