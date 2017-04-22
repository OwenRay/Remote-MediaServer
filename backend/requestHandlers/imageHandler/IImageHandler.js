"use strict";
/**
 * Created by owenray on 7/9/16.
 */

class IImageHandler
{
    /**
     *
     * @param mediaItem
     * @param type
     */
    getImageData()
    {

    }
}

IImageHandler.TYPE_BACKDROP = "backdrop";
IImageHandler.TYPE_POSTER = "poster";
IImageHandler.TYPE_POSTER_SMALL = "postersmall";

module.exports = IImageHandler;